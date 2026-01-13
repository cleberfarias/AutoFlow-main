
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Wand2, Play, Sparkles, ZoomIn, ZoomOut, RotateCcw, Zap, Trash2, 
  Save, History, Mic, MicOff, Users, Plus, Search, ChevronRight, 
  LogOut, Clock, Edit3, FolderOpen, Pencil, ArrowLeft, Eye, Download, EyeOff
} from 'lucide-react';
// NOTE: html-to-image is imported dynamically where needed to avoid build-time errors when not installed.
import { WorkflowStep, StepType, Client, Workflow } from './types';
import NodeCard from './components/NodeCard';
import EditorModal from './components/EditorModal';
import TestChat from './components/TestChat';
import NameModal from './components/NameModal';
import LegendPanel from './components/LegendPanel';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import WorkflowsPage from './components/WorkflowsPage';
import GenericPage from './components/GenericPage';
import MCPHub from './components/MCPHub';
import { MCPSelectorModal, MCPNodeCard } from './components/MCPNode';
import { generateWorkflowFromPrompt } from './services/geminiService';
// ChatGuru integration exports
import { exportWorkflowToChatGuru } from './src/integrations/chatguru/exporter';
import { validateChatGuruPatch } from './src/integrations/chatguru/validator';
import ChatGuruClient from './src/integrations/chatguru/client';
// Generic patch and adapters
import { exportGenericPatch } from './src/core/patch/genericV1';
import { compileToChatGuru } from './src/adapters/chatguru/compile';
import { compileToChatIA } from './src/adapters/chatia/compile';


const App: React.FC = () => {
  // Estados de Navegação e Dados
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados dos Modais de Nomeação
  const [namingModal, setNamingModal] = useState<{
    isOpen: boolean;
    title: string;
    placeholder: string;
    defaultValue: string;
    type: 'CLIENT' | 'AUTOMATION' | 'RENAME_AUTOMATION';
    id?: string;
    clientId?: string; // Para associar workflow a um cliente específico
  }>({
    isOpen: false,
    title: '',
    placeholder: '',
    defaultValue: '',
    type: 'CLIENT'
  });

  // Estados do Editor
  const [promptValue, setPromptValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [viewTransform, setViewTransform] = useState({ x: 80, y: 80, scale: 0.75 });
  const [isPreview, setIsPreview] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isGroupingMode, setIsGroupingMode] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{x:number;y:number;width:number;height:number}|null>(null);
  const groupingRef = useRef<{startX:number,startY:number,active:boolean}|null>(null);
  const GRID_SIZE = 20;
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  
  // Menu de contexto MCP
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    visible: boolean;
    canvasX?: number;
    canvasY?: number;
  }>({ x: 0, y: 0, visible: false });
  const [showMCPModal, setShowMCPModal] = useState(false);

  // Guided nodes: keep track of unlocked steps (by id)
  const [unlockedSteps, setUnlockedSteps] = useState<Set<string>>(new Set());

  // Local UI metric: API errors count
  const [apiErrors, setApiErrors] = useState(0);
  const incrementApiErrors = (n = 1) => setApiErrors(v => v + n);

  // Initialize unlocked steps when a workflow is loaded or changed
  useEffect(() => {
    if (!activeWorkflow) { setUnlockedSteps(new Set()); return; }
    const first = activeWorkflow.steps?.[0]?.id;
    const newSet = new Set<string>();
    if (first) newSet.add(first);
    // preserve already completed steps
    activeWorkflow.steps.forEach(s => { if (s.isComplete) newSet.add(s.id); });
    setUnlockedSteps(newSet);
  }, [activeWorkflow]);
  
  const lastMousePos = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpacePressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpacePressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔌 Menu de Contexto MCP ativado!', { x: e.clientX, y: e.clientY });
    
    if (!canvasRef.current) {
      console.warn('Canvas ref não encontrado');
      return;
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left - viewTransform.x) / viewTransform.scale;
    const canvasY = (e.clientY - rect.top - viewTransform.y) / viewTransform.scale;
    
    console.log('📍 Posição calculada:', { screenX: e.clientX, screenY: e.clientY, canvasX, canvasY });
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visible: true,
      canvasX,
      canvasY
    });
  };
  
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Fechar menu de contexto ao clicar
    if (contextMenu.visible) {
      setContextMenu({ ...contextMenu, visible: false });
    }
    
    const isMiddleClick = e.button === 1;
    
    // Se clicou em um NodeCard, não fazer nada (deixar o NodeCard lidar com o drag)
    if ((e.target as HTMLElement).closest('.NodeCard')) {
      return;
    }

    // Grouping mode: start selection rect in canvas coords
    if (isGroupingMode) {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const sx = (e.clientX - rect.left - viewTransform.x) / viewTransform.scale;
      const sy = (e.clientY - rect.top - viewTransform.y) / viewTransform.scale;
      groupingRef.current = { startX: sx, startY: sy, active: true };
      setSelectionRect({ x: sx, y: sy, width: 0, height: 0 });
      return;
    }

    // Ativar panning: clique no canvas vazio, clique do meio ou espaço pressionado
    e.preventDefault();
    setIsPanning(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    // Try to capture the pointer to avoid lost events when moving fast
    try { (e.target as HTMLElement).setPointerCapture?.((e as any).pointerId); } catch {}
  };

  useEffect(() => {
    if (!isPanning) return;

    // Batching updates with requestAnimationFrame to avoid many React state updates
    const pending = { dx: 0, dy: 0, ticking: false } as { dx: number; dy: number; ticking: boolean };
    const PAN_MULTIPLIER = 1.25; // small speed multiplier for snappier panning

    const handleMove = (e: PointerEvent) => {
      const dx = (e.clientX - lastMousePos.current.x) * PAN_MULTIPLIER;
      const dy = (e.clientY - lastMousePos.current.y) * PAN_MULTIPLIER;
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      pending.dx += dx;
      pending.dy += dy;

      if (!pending.ticking) {
        pending.ticking = true;
        requestAnimationFrame(() => {
          setViewTransform(prev => ({ ...prev, x: prev.x + pending.dx, y: prev.y + pending.dy }));
          pending.dx = 0; pending.dy = 0; pending.ticking = false;
        });
      }
    };

    const stop = () => setIsPanning(false);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, [isPanning]);

  // Grouping handlers: update selection rect while grouping
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!groupingRef.current || !groupingRef.current.active) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const sx = (e.clientX - rect.left - viewTransform.x) / viewTransform.scale;
      const sy = (e.clientY - rect.top - viewTransform.y) / viewTransform.scale;
      const start = groupingRef.current.startX !== undefined ? groupingRef.current.startX : 0;
      const startY = groupingRef.current.startY !== undefined ? groupingRef.current.startY : 0;
      const x = Math.min(start, sx);
      const y = Math.min(startY, sy);
      const w = Math.abs(sx - start);
      const h = Math.abs(sy - startY);
      setSelectionRect({ x, y, width: w, height: h });
    };

    const handleUp = (e: PointerEvent) => {
      if (!groupingRef.current || !groupingRef.current.active) return;
      groupingRef.current.active = false;
      // finalize: compute selected steps and create group
      if (!selectionRect || !activeWorkflow) {
        setSelectionRect(null);
        return;
      }
      const padding = 20;
      const selected = activeWorkflow.steps.filter(s => {
        const sx = s.position.x;
        const sy = s.position.y;
        return sx >= selectionRect.x && sx <= selectionRect.x + selectionRect.width && sy >= selectionRect.y && sy <= selectionRect.y + selectionRect.height;
      }).map(s => s.id);
      if (selected.length > 0) {
        const nodes = activeWorkflow.steps.filter(s => selected.includes(s.id));
        const minX = Math.min(...nodes.map(n => n.position.x));
        const minY = Math.min(...nodes.map(n => n.position.y));
        const maxX = Math.max(...nodes.map(n => n.position.x)) + 360; // width assumed
        const maxY = Math.max(...nodes.map(n => n.position.y)) + 240; // height assumed
        const group = { id: `g_${Date.now()}`, name: `Grupo ${ (activeWorkflow.groups?.length || 0) + 1 }`, color: '#fef3c7', x: minX - padding, y: minY - padding, width: (maxX - minX) + padding * 2, height: (maxY - minY) + padding * 2, stepIds: selected };
        const updatedGroups = [...(activeWorkflow.groups || []), group];
        const updated = { ...activeWorkflow, groups: updatedGroups };
        setActiveWorkflow(updated);
        // persist groups
        const updatedClients = clients.map(c => c.id === activeClient?.id ? { ...c, automations: c.automations?.map(a => a.id === activeWorkflow.id ? updated : a) } : c);
        saveToDB(updatedClients);
      }

      setSelectionRect(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [selectionRect, isGroupingMode, activeWorkflow, clients, activeClient]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomIntensity = 0.0015;
    const delta = -e.deltaY * zoomIntensity;
    const nextScale = Math.min(1.6, Math.max(0.3, viewTransform.scale + delta));
    if (!canvasRef.current) {
      setViewTransform(prev => ({ ...prev, scale: nextScale }));
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const scaleRatio = nextScale / viewTransform.scale;

    setViewTransform(prev => ({
      x: mouseX - (mouseX - prev.x) * scaleRatio,
      y: mouseY - (mouseY - prev.y) * scaleRatio,
      scale: nextScale
    }));
  };

  const fitToWorkflow = () => {
    if (!canvasRef.current || !activeWorkflow?.steps?.length) {
      setViewTransform({ x: 80, y: 80, scale: 0.75 });
      return;
    }

    const width = 360;
    const height = 240;
    const padding = 140;
    const xs = activeWorkflow.steps.map(s => s.position?.x || 0);
    const ys = activeWorkflow.steps.map(s => s.position?.y || 0);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs) + width;
    const maxY = Math.max(...ys) + height;
    const boundsWidth = maxX - minX + padding * 2;
    const boundsHeight = maxY - minY + padding * 2;

    const rect = canvasRef.current.getBoundingClientRect();
    const scale = Math.min(1.2, Math.max(0.3, Math.min(rect.width / boundsWidth, rect.height / boundsHeight)));
    const x = (rect.width - boundsWidth * scale) / 2 - minX * scale + padding * scale;
    const y = (rect.height - boundsHeight * scale) / 2 - minY * scale + padding * scale;
    setViewTransform({ x, y, scale });
  };

  // Inicialização
  useEffect(() => {
    const savedData = localStorage.getItem('autoflow_db');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData) as Client[];
        // migration: ensure steps have title/description
        const normalized = parsed.map(c => ({
          ...c,
          automations: c.automations?.map(a => ({
            ...a,
            steps: a.steps?.map(s => ({
              ...s,
              title: s.title || s.type || 'Sem título',
              description: s.description || ''
            })) || []
          })) || []
        }));
        setClients(normalized);
        // persist normalized data
        localStorage.setItem('autoflow_db', JSON.stringify(normalized));
      } catch (e) {
        setClients([]);
      }
    } else {
      const demoClients: Client[] = [
        { id: '1', name: 'Padaria Sabor Real', email: 'contato@saborreal.com.br', automations: [] },
        { id: '2', name: 'Oficina do João', email: 'joao@oficina.com', automations: [] }
      ];
      setClients(demoClients);
      localStorage.setItem('autoflow_db', JSON.stringify(demoClients));
    }
  }, []);

  const saveToDB = (updatedClients: Client[]) => {
    setClients(updatedClients);
    localStorage.setItem('autoflow_db', JSON.stringify(updatedClients));
  };

  // Funções de Gerenciamento de Modal de Nome
  const handleOpenNamingModal = (type: typeof namingModal.type, id?: string, currentName?: string) => {
    if (type === 'CLIENT') {
      setNamingModal({
        isOpen: true,
        title: 'Novo Cliente',
        placeholder: 'Nome da empresa ou cliente...',
        defaultValue: '',
        type
      });
    } else if (type === 'AUTOMATION') {
      setNamingModal({
        isOpen: true,
        title: 'Nova Automação',
        placeholder: 'Ex: Funil de WhatsApp, Cobrança...',
        defaultValue: `Automação ${activeClient?.automations.length || 0 + 1}`,
        type
      });
    } else if (type === 'RENAME_AUTOMATION') {
      setNamingModal({
        isOpen: true,
        title: 'Renomear Automação',
        placeholder: 'Novo nome...',
        defaultValue: currentName || '',
        type,
        id
      });
    }
  };

  const handleConfirmNaming = (name: string) => {
    const { type, id, clientId } = namingModal;
    
    if (type === 'CLIENT') {
      const newClient: Client = {
        id: Date.now().toString(),
        name,
        email: `${name.toLowerCase().replace(/ /g, '.')}@email.com`,
        automations: []
      };
      const updated = [...clients, newClient];
      saveToDB(updated);
      setActiveClient(newClient);
    } 
    else if (type === 'AUTOMATION') {
      // Se tiver clientId, usa ele; senão usa activeClient; senão cria um cliente padrão
      let targetClient = clientId ? clients.find(c => c.id === clientId) : activeClient;
      
      if (!targetClient) {
        // Se não há cliente, cria um cliente padrão
        targetClient = {
          id: Date.now().toString(),
          name: 'Cliente Padrão',
          email: 'padrao@email.com',
          automations: []
        };
        const updatedClientsWithNew = [...clients, targetClient];
        saveToDB(updatedClientsWithNew);
        setActiveClient(targetClient);
      }
      
      const newWorkflow: Workflow = {
        id: Date.now().toString(),
        name,
        lastModified: Date.now(),
        steps: []
      };
      const updatedClient = {
        ...targetClient,
        automations: [...targetClient.automations, newWorkflow]
      };
      const updatedClients = clients.map(c => c.id === targetClient.id ? updatedClient : c);
      if (!clients.find(c => c.id === targetClient.id)) {
        updatedClients.push(updatedClient);
      }
      saveToDB(updatedClients);
      setActiveClient(updatedClient);
      setActiveWorkflow(newWorkflow);
    }
    else if (type === 'RENAME_AUTOMATION' && activeClient && id) {
      const updatedClient = {
        ...activeClient,
        automations: activeClient.automations.map(a => a.id === id ? { ...a, name, lastModified: Date.now() } : a)
      };
      const updatedClients = clients.map(c => c.id === activeClient.id ? updatedClient : c);
      saveToDB(updatedClients);
      setActiveClient(updatedClient);
      if (activeWorkflow?.id === id) setActiveWorkflow(prev => prev ? { ...prev, name } : null);
    }

    setNamingModal(prev => ({ ...prev, isOpen: false }));
  };

  const saveCurrentWorkflow = (updatedSteps: WorkflowStep[]) => {
    if (!activeClient || !activeWorkflow) return;
    const updatedWorkflow = { ...activeWorkflow, steps: updatedSteps, lastModified: Date.now() };
    const updatedClient = {
      ...activeClient,
      automations: activeClient.automations.map(a => a.id === activeWorkflow.id ? updatedWorkflow : a)
    };
    const updatedClients = clients.map(c => c.id === activeClient.id ? updatedClient : c);
    saveToDB(updatedClients);
    setActiveWorkflow(updatedWorkflow);
    setActiveClient(updatedClient);
  };

  const snapToGrid = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;

  const moveStep = (id: string, rawX: number, rawY: number) => {
    if (!activeWorkflow) return;
    const x = snapToGrid(rawX);
    const y = snapToGrid(rawY);
    const updated = activeWorkflow.steps.map(s => s.id === id ? { ...s, position: { x, y } } : s);
    saveCurrentWorkflow(updated);
  };

  // Handler MCP: adicionar node MCP no canvas
  const handleAddMCPNode = (mcpConfig: any) => {
    if (!activeWorkflow) return;
    
    const { service, action, params } = mcpConfig;
    
    // Labels amigáveis
    const serviceLabels: Record<string, string> = {
      stripe: 'Stripe',
      sendgrid: 'SendGrid',
      twilio: 'Twilio',
      hubspot: 'HubSpot',
      zendesk: 'Zendesk',
      'google-calendar': 'Google Calendar',
      docusign: 'DocuSign',
      clicksign: 'Clicksign',
      rdstation: 'RD Station',
      pagarme: 'Pagar.me',
      advbox: 'Advbox',
      mongodb: 'MongoDB'
    };
    
    const actionLabels: Record<string, string> = {
      createCheckout: 'Criar Checkout',
      createPaymentIntent: 'Criar Pagamento',
      createCustomer: 'Criar Cliente',
      sendEmail: 'Enviar Email',
      sendSMS: 'Enviar SMS',
      sendWhatsApp: 'Enviar WhatsApp',
      createContact: 'Criar Contato',
      updateContact: 'Atualizar Contato',
      createTicket: 'Criar Ticket',
      updateTicket: 'Atualizar Ticket',
      createMeeting: 'Criar Reunião',
      sendDocument: 'Enviar Documento',
      createCharge: 'Criar Cobrança',
      createPix: 'Criar PIX'
    };
    
    const newStep: WorkflowStep = {
      id: `mcp-${Date.now()}`,
      type: StepType.MCP,
      title: `${serviceLabels[service] || service}`,
      description: actionLabels[action] || action,
      params: {
        mcp: {
          service,
          action,
          params
        }
      },
      position: {
        x: contextMenu.canvasX ? snapToGrid(contextMenu.canvasX) : 400,
        y: contextMenu.canvasY ? snapToGrid(contextMenu.canvasY) : 300
      }
    };
    
    saveCurrentWorkflow([...activeWorkflow.steps, newStep]);
    setShowMCPModal(false);
    setContextMenu({ ...contextMenu, visible: false });
  };

  const deleteWorkflow = (id: string) => {
    if (!activeClient || !window.confirm("Excluir esta automação permanentemente?")) return;
    const updatedClient = {
      ...activeClient,
      automations: activeClient.automations.filter(a => a.id !== id)
    };
    const updatedClients = clients.map(c => c.id === activeClient.id ? updatedClient : c);
    saveToDB(updatedClients);
    setActiveClient(updatedClient);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
        mediaRecorder.onstop = async () => {
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const fd = new FormData();
            fd.append('file', audioBlob, 'gravacao.webm');
            const res = await fetch('/api/autoflow/transcribe', { method: 'POST', body: fd });
            if (res.ok) {
              const data = await res.json();
              setPromptValue(p => p + (p ? " " : "") + (data.text || ''));
            } else {
              // fallback: not available on server
              setPromptValue(p => p + (p ? " " : "") + '');
            }
          } catch (err) {
            console.error("Erro na transcrição:", err);
          } finally {
            stream.getTracks().forEach(t => t.stop());
          }
        };
        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) { alert("Microfone não disponível."); }
    }
  };

  // Views
  const renderPageContent = () => {
    // Prepare workflow list from all clients
    const allWorkflows = clients.flatMap(c => c.automations.map(auto => ({ ...auto, clientName: c.name })));

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard clients={clients} workflows={allWorkflows} />;
      case 'workflows':
        return <WorkflowsPage 
          workflows={allWorkflows} 
          onCreateWorkflow={() => handleOpenNamingModal('AUTOMATION')}
          onSelectWorkflow={(workflow) => {
            const client = clients.find(c => c.automations.some(a => a.id === workflow.id));
            if (client) {
              setActiveClient(client);
              setActiveWorkflow(workflow);
            }
          }}
        />;
      case 'mcp-hub':
        return <MCPHub />;
      case 'ai-routing':
      case 'templates':
      case 'versions':
      case 'logs':
        return <GenericPage title={currentPage} description={`Página de ${currentPage}`} />;
      default:
        return <Dashboard clients={clients} workflows={allWorkflows} />;
    }
  };

  if (!activeClient) {
    const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return (
      <div className="flex h-screen w-full bg-slate-900">
        <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
        <div className="ml-64 flex-1 bg-slate-900 overflow-y-auto">
          {renderPageContent()}
        </div>
        <NameModal {...namingModal} onClose={() => setNamingModal(p => ({...p, isOpen: false}))} onConfirm={handleConfirmNaming} />
      </div>
    );
  }

  if (!activeWorkflow) {
    return (
      <div className="flex h-screen w-full bg-slate-900">
        <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
        <div className="ml-64 flex-1 bg-slate-900 overflow-y-auto">
          <header className="p-8 border-b border-slate-700 flex items-center justify-between bg-slate-800 sticky top-0 z-10">
            <div className="flex items-center gap-6">
              <button onClick={() => setActiveClient(null)} className="p-3 hover:bg-slate-700 rounded-2xl text-slate-400 transition-colors"><ArrowLeft size={24} /></button>
              <div>
                <h1 className="text-3xl font-black tracking-tighter text-white">{activeClient.name}</h1>
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 bg-teal-950 px-2 py-0.5 rounded-md mt-1 block w-fit">Dash de Gestão</span>
              </div>
            </div>
            <button onClick={() => setActiveClient(null)} className="flex items-center gap-2 px-6 py-3 bg-rose-950 text-rose-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-900 transition-colors"><LogOut size={16} /> Sair</button>
          </header>
          <main className="flex-1 max-w-7xl w-full mx-auto p-12">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Minhas Automações</h2>
              <button onClick={() => handleOpenNamingModal('AUTOMATION')} className="px-8 py-4 bg-teal-600 text-white rounded-[24px] font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-teal-500/30 hover:bg-teal-700 transition-all">
                <Plus size={18} strokeWidth={3} /> Criar Novo Fluxo
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeClient.automations.length > 0 ? activeClient.automations.map(auto => (
                <div key={auto.id} className="group relative bg-slate-800 border-2 border-slate-700 hover:border-teal-500 rounded-[32px] p-8 transition-all hover:shadow-2xl hover:shadow-teal-500/20 hover:bg-slate-750 flex flex-col h-full">
                  <div className="w-14 h-14 bg-slate-700 rounded-2xl flex items-center justify-center text-teal-400 shadow-sm mb-6 group-hover:scale-110 transition-transform"><FolderOpen size={24} /></div>
                  <h3 className="text-xl font-black text-white mb-2 leading-tight">{auto.name}</h3>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
                    <div className="flex items-center gap-1.5"><Clock size={12} /> {new Date(auto.lastModified).toLocaleDateString()}</div>
                    <div className="flex items-center gap-1.5"><Zap size={12} /> {auto.steps.length} Blocos</div>
                  </div>
                  <div className="mt-auto flex gap-3 pt-6 border-t border-slate-700/50">
                    <button onClick={() => setActiveWorkflow(auto)} className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-teal-700 transition-colors">Abrir Editor</button>
                    <button onClick={() => handleOpenNamingModal('RENAME_AUTOMATION', auto.id, auto.name)} className="p-3 bg-slate-700 border border-slate-600 text-slate-400 hover:text-teal-400 rounded-xl transition-colors"><Pencil size={16} /></button>
                    <button onClick={() => deleteWorkflow(auto.id)} className="p-3 bg-slate-700 border border-slate-600 text-slate-400 hover:text-rose-400 rounded-xl transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-24 border-4 border-dashed border-slate-700 rounded-[40px] flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-slate-600"><Sparkles size={40} /></div>
                  <h3 className="font-black text-white text-xl uppercase tracking-tighter">Nenhum fluxo encontrado</h3>
                </div>
              )}
            </div>
          </main>
          <NameModal {...namingModal} onClose={() => setNamingModal(p => ({...p, isOpen: false}))} onConfirm={handleConfirmNaming} />
        </div>
      </div>
    );
  }

  const handleCreateSteps = async () => {
    if (!promptValue.trim()) return;
    setIsGenerating(true);
    try {
      const generated = await generateWorkflowFromPrompt(promptValue);
      const placed = generated.map((s, idx) => ({ ...s, position: { x: 100 + (idx * 400), y: 150 + (idx % 2 * 100) } }));
      saveCurrentWorkflow(placed);
      setPromptValue('');
    } catch (e: any) { console.error(e); alert(e?.message || 'Erro ao gerar fluxo. Verifique o console.'); }
    finally { setIsGenerating(false); }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-900 font-sans">
      <aside className="w-[420px] border-r border-slate-700 bg-slate-800 flex flex-col shadow-2xl z-30">
        <div className="p-8 border-b border-slate-700 bg-slate-800 text-white">
          <button onClick={() => setActiveWorkflow(null)} className="flex items-center gap-2 text-[10px] font-black text-teal-400 uppercase tracking-widest hover:translate-x-[-4px] transition-transform mb-4"><ArrowLeft size={14} /> Painel</button>
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"><Edit3 size={20} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tighter uppercase truncate leading-none text-white">{activeWorkflow.name}</h1>
                <button onClick={() => handleOpenNamingModal('RENAME_AUTOMATION', activeWorkflow.id, activeWorkflow.name)} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-teal-400 transition-all"><Pencil size={12} /></button>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">Cliente: {activeClient.name}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Wand2 size={14} className="text-teal-500" /> Designer de IA</label>
            <div className="relative group">
              <textarea value={promptValue} onChange={(e) => setPromptValue(e.target.value)} placeholder="Descreva a automação..." className="w-full min-h-[140px] p-5 bg-slate-700 border-2 border-slate-600 rounded-2xl focus:border-teal-600 focus:bg-slate-750 outline-none transition-all text-sm font-medium leading-relaxed pr-14 shadow-sm text-white placeholder-slate-400" />
              <button onClick={toggleRecording} className={`absolute right-4 bottom-4 p-3 rounded-xl transition-all ${isRecording ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}>{isRecording ? <MicOff size={18} /> : <Mic size={18} />}</button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleCreateSteps} disabled={isGenerating || !promptValue.trim()} className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-teal-600/25 hover:bg-teal-700 disabled:opacity-50 transition-all">
                {isGenerating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Gerando...</> : <><Sparkles size={16} /> Atualizar Fluxo</>}
              </button>
              <button onClick={() => {
                // add new step
                if (!activeWorkflow) return;
                const newStep = { id: Date.now().toString(), type: 'ACTION', title: 'Nova Etapa', description: '', params: {}, position: { x: 200, y: 200 } };
                saveCurrentWorkflow([...activeWorkflow.steps, newStep]);
              }} className="px-4 py-4 bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-slate-600 transition-all">+ Nova Etapa</button>
            </div>
            
            {/* Botão MCP - NOVO! */}
            <button 
              onClick={() => {
                console.log('🔌 Abrindo Modal MCP via botão...');
                setShowMCPModal(true);
              }}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-purple-600/25 hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-[1.02]"
            >
              <span className="text-lg">🔌</span> MCP Integration
            </button>
            <div className="pt-4 border-t border-slate-700">
              <div className="mt-3 flex gap-2">
                <button onClick={() => {
                  // add example API config to first step
                  if (!activeWorkflow || activeWorkflow.steps.length === 0) return alert('Nenhum passo disponivel');
                  const updated = activeWorkflow.steps.map((s,i) => i===0 ? { ...s, params: { ...s.params, api: { url: 'https://httpbin.org/get', method: 'GET', headers: [{ name: 'Accept', value: 'application/json' }], timeoutMs: 5000, auth: { type: 'bearer', secretRef: 'ADVBOX_KEY' }, responseMapping: [{ jsonPath: 'url', outputKey: 'url' }] } } } : s);
                  saveCurrentWorkflow(updated);
                  alert('Exemplo de conexão adicionado ao primeiro passo. Abra o passo e clique em Testar.');
                }} className="px-3 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700">Aplicar exemplo de API</button>
                <button onClick={() => { setApiErrors(0); alert('Contador de erros reiniciado'); }} className="px-3 py-2 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600">Resetar Erros</button>
              </div>
            </div>
          </div>
        </div>
      </aside>
      <main 
        ref={canvasRef}
        className={`flex-1 relative overflow-hidden bg-slate-950 ${isPanning || isSpacePressed ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handlePointerDown}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
      >
        <div className="absolute inset-0 dotted-bg opacity-20" style={{ transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`, transformOrigin: '0 0' }} />
        <div className="absolute inset-0" style={{ transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`, transformOrigin: '0 0' }}>
          <svg className="absolute inset-0 pointer-events-none w-[5000px] h-[5000px]">
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L8,4 L0,8 z" fill="#3b82f6" />
              </marker>
              <marker id="arrow-black" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L8,4 L0,8 z" fill="#374151" />
              </marker>
            </defs>

            {activeWorkflow.groups?.map(g => (
              <g key={g.id}>
                <rect x={g.x} y={g.y} width={g.width} height={g.height} rx={16} ry={16} fill={g.color || '#ffffff'} stroke={g.color ? '#f59e0b' : '#e6e6e6'} strokeWidth={2} opacity={0.25} />
                <text x={g.x + 12} y={g.y + 22} className="text-[12px] font-bold text-slate-700">{g.name}</text>
              </g>
            ))}

            {activeWorkflow.steps.map((step) => {
              const nextSteps = Array.isArray(step.nextSteps) ? step.nextSteps : [];
              const NODE_WIDTH = isPreview ? 260 : 360;
              const NODE_HEIGHT = isPreview ? 180 : 240;

              return nextSteps.map(nextId => {
                const target = activeWorkflow.steps.find(s => s.id === nextId);
                if (!target) return null;

                const startX = step.position.x + NODE_WIDTH; // right edge
                const startY = step.position.y + NODE_HEIGHT / 2;
                const endX = target.position.x; // left edge
                const endY = target.position.y + NODE_HEIGHT / 2;
                const dx = Math.max(80, Math.abs(endX - startX) / 2);

                const p0 = { x: startX, y: startY };
                const p1 = { x: startX + dx, y: startY };
                const p2 = { x: endX - dx, y: endY };
                const p3 = { x: endX, y: endY };

                // midpoint on cubic bezier t=0.5
                const t = 0.5;
                const cx = Math.pow(1 - t, 3) * p0.x + 3 * Math.pow(1 - t, 2) * t * p1.x + 3 * (1 - t) * Math.pow(t, 2) * p2.x + Math.pow(t, 3) * p3.x;
                const cy = Math.pow(1 - t, 3) * p0.y + 3 * Math.pow(1 - t, 2) * t * p1.y + 3 * (1 - t) * Math.pow(t, 2) * p2.y + Math.pow(t, 3) * p3.y;

                const srcType = step.type as StepType;
                const styles: Record<string, any> = {
                  TRIGGER: { color: '#10b981', dash: '' },
                  ACTION: { color: '#3b82f6', dash: '' },
                  DATA: { color: '#6366f1', dash: '' },
                  LOGIC: { color: '#f59e0b', dash: '4 6' },
                  ERROR_HANDLER: { color: '#fb7185', dash: '4 6' }
                };

                const s = styles[srcType] || styles.ACTION;
                const isActive = activeStepId === step.id || activeStepId === target.id;

                const d = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;

                const label = (step.params && step.params.label) || 'Entrada → Saída';
                const labelWidth = Math.max(80, Math.min(220, String(label).length * 7));

                return (
                  <g key={`${step.id}-${target.id}`}> 
                    <path d={d} stroke={isActive ? '#3b82f6' : s.color} strokeWidth={isActive ? 3 : 2} fill="none" strokeDasharray={s.dash} markerEnd={`url(#arrow)`} />
                    {/* end circle */}
                    <circle cx={p3.x} cy={p3.y} r={5} fill={s.color} />
                    {/* label background */}
                    <rect x={cx - labelWidth / 2} y={cy - 14} rx={8} ry={8} width={labelWidth} height={20} fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.05)" />
                    <text x={cx} y={cy} textAnchor="middle" alignmentBaseline="middle" className="text-[11px] font-bold" fill="#374151">{label}</text>
                  </g>
                );

              });
            })}
          </svg>
          {/* Selection rect (grouping) - rendered between svg and nodes */}
          {selectionRect && (
            <div style={{ position: 'absolute', left: selectionRect.x, top: selectionRect.y, width: selectionRect.width, height: selectionRect.height, border: '2px dashed rgba(245,158,11,0.8)', background: 'rgba(245,158,11,0.06)', borderRadius: 10, pointerEvents: 'none' }} />
          )}

          {activeWorkflow.steps.map((step, idx) => (
            <NodeCard
              key={step.id}
              step={step}
              isActive={activeStepId === step.id}
              isPanningMode={isSpacePressed || isPanning}
              isPreview={isPreview}
              isLocked={!unlockedSteps.has(step.id)}
              onMove={(id, x, y) => moveStep(id, x, y)}
              onDelete={(id) => saveCurrentWorkflow(activeWorkflow.steps.filter(x => x.id !== id))}
              onEdit={setEditingStepId}
              onApiError={incrementApiErrors}
              onUpdate={(updated) => saveCurrentWorkflow(activeWorkflow.steps.map(s => s.id === updated.id ? updated : s))}
              onComplete={(id) => {
                // mark completed and unlock next
                const updated = activeWorkflow.steps.map(s => s.id === id ? { ...s, isComplete: true, title: s.title || '' } : s);
                saveCurrentWorkflow(updated);
                const next = activeWorkflow.steps[idx+1];
                if (next) {
                  setUnlockedSteps(prev => new Set(prev).add(next.id));
                  setActiveStepId(next.id);
                }
              }}
            />
          ))}
        </div>
        {activeWorkflow.steps.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700 shadow-2xl rounded-[32px] p-10 w-full max-w-lg text-center space-y-4">
              <div className="w-16 h-16 bg-teal-950 text-teal-400 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles size={28} />
              </div>
              <h3 className="text-2xl font-black text-white">Comece descrevendo sua automação</h3>
              <p className="text-slate-400 text-sm">Use o painel à esquerda para gerar o fluxo. Você pode editar cada nó depois.</p>
              <button onClick={handleCreateSteps} disabled={isGenerating || !promptValue.trim()} className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-teal-600/25 hover:bg-teal-700 disabled:opacity-50 transition-all">
                <Sparkles size={14} /> Gerar Fluxo
              </button>
            </div>
          </div>
        )}
        {isGenerating && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-3 bg-slate-800 shadow-xl rounded-2xl px-6 py-4 border border-slate-700">
              <div className="w-4 h-4 border-2 border-teal-800 border-t-teal-500 rounded-full animate-spin" />
              <span className="text-sm font-bold text-white">Gerando fluxo...</span>
            </div>
          </div>
        )}
        <div className="absolute top-6 left-6 bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-2xl px-4 py-3 shadow-xl text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {isGroupingMode ? (<span>Modo de Agrupamento: arraste para selecionar nós • clique novamente para cancelar</span>) : (<span>Dicas: segure <span className="text-teal-400">Space</span> para mover • <span className="text-purple-400">Botão Direito</span> para menu MCP 🔌</span>)}
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-800/90 backdrop-blur-xl px-8 py-4 rounded-3xl shadow-2xl border border-slate-700 z-40">
           <button onClick={() => setIsTesting(true)} disabled={activeWorkflow.steps.length === 0} className="px-8 py-3.5 bg-teal-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-teal-700 transition-all disabled:opacity-30"><Play size={16} fill="currentColor" /> Simular Fluxo</button>
           <div className="flex gap-2 border-l border-slate-700 pl-4">
             <button onClick={() => setViewTransform(p => ({...p, scale: Math.min(p.scale + 0.1, 1.5)}))} className="p-3 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-teal-400"><ZoomIn size={20}/></button>
             <button onClick={() => setViewTransform(p => ({...p, scale: Math.max(p.scale - 0.1, 0.3)}))} className="p-3 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-teal-400"><ZoomOut size={20}/></button>
             <button onClick={fitToWorkflow} className="p-3 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-teal-400"><RotateCcw size={20}/></button>
             <button onClick={() => { setIsPreview(p => !p); if (!isPreview) { fitToWorkflow(); } }} title={isPreview ? 'Sair do preview' : 'Entrar em modo de apresentação'} className={`p-3 rounded-xl transition-colors ${isPreview ? 'bg-teal-600 text-white' : 'hover:bg-slate-700 text-slate-400 hover:text-teal-400'}`}>
               {isPreview ? <><EyeOff size={18} /> </> : <><Eye size={18} /> </> }
             </button>
             <button onClick={() => setIsGroupingMode(g => !g)} title={isGroupingMode ? 'Cancelar agrupamento' : 'Agrupar nós (arraste)'} className={`p-3 rounded-xl transition-colors ${isGroupingMode ? 'bg-amber-400 text-white' : 'hover:bg-slate-700 text-slate-400 hover:text-amber-500'}`}>
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>
             </button>
             <button onClick={async () => {
               // export canvas as PNG (dynamic import to avoid Vite resolution errors if package missing)
               if (!canvasRef.current) return;
               try {
                 const node = canvasRef.current as HTMLElement;
                 const htmlToImage = await import(/* @vite-ignore */ 'html-to-image');
                 const _toPng = (htmlToImage && (htmlToImage.toPng || htmlToImage.default?.toPng));
                 if (!_toPng) throw new Error('html-to-image não disponibiliza toPng');
                 const dataUrl = await _toPng(node, { cacheBust: true, backgroundColor: '#ffffff' });
                 const link = document.createElement('a');
                 link.download = `${activeWorkflow.name.replace(/\s+/g,'_') || 'autoflow'}_flow.png`;
                 link.href = dataUrl;
                 link.click();
               } catch (err) {
                 console.error('Export error', err);
                 alert('Erro ao exportar imagem. Verifique se a dependência "html-to-image" está instalada (execute `npm install html-to-image`).');
               }
             }} title="Exportar screenshot" className="p-3 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-teal-400"><Download size={20} /></button>

             {/* Export buttons: Generic Patch v1, ChatGuru and chat-ia */}
             <button onClick={async () => {
               if (!activeWorkflow) return alert('Abra uma automação primeiro');
               const patch = exportGenericPatch(activeWorkflow, { name: activeWorkflow.name, locale: 'pt-BR' });
               const blob = new Blob([JSON.stringify(patch, null, 2)], { type: 'application/json' });
               const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${(activeWorkflow.name || 'patch').replace(/\s+/g,'_')}_autoflow_patch_v1.json`; a.click();
             }} title="Exportar Patch Genérico (JSON)" className="p-3 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-indigo-400">Patch Genérico</button>

             <button onClick={async () => {
               if (!activeWorkflow) return alert('Abra uma automação primeiro');
               const botId = window.prompt('Informe bot_id para o ChatGuru (ex: my-bot)') || '';
               const generic = exportGenericPatch(activeWorkflow, { name: activeWorkflow.name, locale: 'pt-BR' });
               const patch = compileToChatGuru(generic, botId || '');
               const v = validateChatGuruPatch(patch);
               if (!v.valid) return alert('Patch inválido: ' + v.errors.join('\n'));
               // download
               const blob = new Blob([JSON.stringify(patch, null, 2)], { type: 'application/json' });
               const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${(activeWorkflow.name || 'patch').replace(/\s+/g,'_')}_chatguru_patch.json`; a.click();
             }} title="Exportar ChatGuru (JSON)" className="p-3 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-green-400">Export ChatGuru</button>

             <button onClick={async () => {
               if (!activeWorkflow) return alert('Abra uma automação primeiro');
               const generic = exportGenericPatch(activeWorkflow, { name: activeWorkflow.name, locale: 'pt-BR' });
               const doc = compileToChatIA(generic);
               const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
               const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${(activeWorkflow.name || 'automation').replace(/\s+/g,'_')}_chatia_doc.json`; a.click();
               // copy to clipboard as convenience
               try { await navigator.clipboard.writeText(JSON.stringify(doc, null, 2)); } catch (e) {}
               alert('Exportado chat-ia (arquivo e copiado para clipboard)');
             }} title="Exportar chat-ia (JSON)" className="p-3 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-purple-400">Export chat-ia</button>

             <button onClick={async () => {
               if (!activeWorkflow) return alert('Abra uma automação primeiro');
               const botId = window.prompt('Informe bot_id para o ChatGuru (ex: my-bot)') || '';
               const generic = exportGenericPatch(activeWorkflow, { name: activeWorkflow.name, locale: 'pt-BR' });
               const patch = compileToChatGuru(generic, botId || '');
               const v = validateChatGuruPatch(patch);
               if (!v.valid) return alert('Patch inválido: ' + v.errors.join('\n'));
               try {
                 const client = new ChatGuruClient();
                 await client.apply(botId || '', patch, 'draft');
                 alert('Patch enviado ao ChatGuru com sucesso (modo draft)');
               } catch (err:any) {
                 console.error(err);
                 alert('Erro ao publicar no ChatGuru: ' + (err?.message || String(err)));
               }
             }} title="Publicar no ChatGuru" className="p-3 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-teal-400">Publicar</button>
           </div>
        </div>

        {/* Menu de Contexto MCP */}
        {contextMenu.visible && (
          <>
            {/* Overlay para fechar ao clicar fora */}
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9998
              }}
              onClick={() => {
                console.log('Fechando menu por overlay');
                setContextMenu({ ...contextMenu, visible: false });
              }}
            />
            
            {/* Menu */}
            <div
              style={{
                position: 'fixed',
                left: contextMenu.x,
                top: contextMenu.y,
                zIndex: 9999
              }}
              className="bg-slate-800 border-2 border-teal-500 rounded-xl shadow-2xl overflow-hidden min-w-[220px] animate-in fade-in duration-100"
            >
              <div className="p-1.5">
                <div className="text-[10px] text-teal-400 px-3 py-2 font-bold uppercase tracking-wider bg-slate-900/50 rounded-lg mb-1">
                  ✨ Adicionar Node
                </div>
              
              <button
                onClick={() => {
                  if (!activeWorkflow) return;
                  const newStep: WorkflowStep = {
                    id: Date.now().toString(),
                    type: StepType.TRIGGER,
                    title: 'Novo Gatilho',
                    description: '',
                    params: {},
                    position: {
                      x: contextMenu.canvasX ? snapToGrid(contextMenu.canvasX) : 200,
                      y: contextMenu.canvasY ? snapToGrid(contextMenu.canvasY) : 200
                    }
                  };
                  saveCurrentWorkflow([...activeWorkflow.steps, newStep]);
                  setContextMenu({ ...contextMenu, visible: false });
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-700 text-white text-sm flex items-center gap-2 rounded"
              >
                <span>⚡</span> Gatilho
              </button>
              
              <button
                onClick={() => {
                  if (!activeWorkflow) return;
                  const newStep: WorkflowStep = {
                    id: Date.now().toString(),
                    type: StepType.ACTION,
                    title: 'Nova Ação',
                    description: '',
                    params: {},
                    position: {
                      x: contextMenu.canvasX ? snapToGrid(contextMenu.canvasX) : 200,
                      y: contextMenu.canvasY ? snapToGrid(contextMenu.canvasY) : 200
                    }
                  };
                  saveCurrentWorkflow([...activeWorkflow.steps, newStep]);
                  setContextMenu({ ...contextMenu, visible: false });
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-700 text-white text-sm flex items-center gap-2 rounded"
              >
                <span>⚙️</span> Ação
              </button>
              
              <button
                onClick={() => {
                  if (!activeWorkflow) return;
                  const newStep: WorkflowStep = {
                    id: Date.now().toString(),
                    type: StepType.DATA,
                    title: 'Novo Dado',
                    description: '',
                    params: {},
                    position: {
                      x: contextMenu.canvasX ? snapToGrid(contextMenu.canvasX) : 200,
                      y: contextMenu.canvasY ? snapToGrid(contextMenu.canvasY) : 200
                    }
                  };
                  saveCurrentWorkflow([...activeWorkflow.steps, newStep]);
                  setContextMenu({ ...contextMenu, visible: false });
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-700 text-white text-sm flex items-center gap-2 rounded"
              >
                <span>📊</span> Dados
              </button>
              
              <button
                onClick={() => {
                  if (!activeWorkflow) return;
                  const newStep: WorkflowStep = {
                    id: Date.now().toString(),
                    type: StepType.LOGIC,
                    title: 'Nova Lógica',
                    description: '',
                    params: {},
                    position: {
                      x: contextMenu.canvasX ? snapToGrid(contextMenu.canvasX) : 200,
                      y: contextMenu.canvasY ? snapToGrid(contextMenu.canvasY) : 200
                    }
                  };
                  saveCurrentWorkflow([...activeWorkflow.steps, newStep]);
                  setContextMenu({ ...contextMenu, visible: false });
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-700 text-white text-sm flex items-center gap-2 rounded"
              >
                <span>🧠</span> Lógica
              </button>

              <div className="border-t border-slate-700 my-1.5"></div>

              {/* Opção MCP - DESTACADA */}
              <button
                onClick={() => {
                  console.log('🔌 Abrindo Modal MCP...');
                  setShowMCPModal(true);
                  setContextMenu({ ...contextMenu, visible: false });
                }}
                className="w-full text-left px-3 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm flex items-center gap-2 font-bold rounded shadow-lg transition-all transform hover:scale-105"
              >
                <span className="text-lg">🔌</span> MCP Integration
              </button>
              </div>
            </div>
          </>
        )}
      </main>
      
      {/* Modal MCP */}
      <MCPSelectorModal
        isOpen={showMCPModal}
        onClose={() => setShowMCPModal(false)}
        onSelect={handleAddMCPNode}
      />
      
      <NameModal {...namingModal} onClose={() => setNamingModal(p => ({...p, isOpen: false}))} onConfirm={handleConfirmNaming} />
      {isTesting && <TestChat steps={activeWorkflow.steps} onClose={() => setIsTesting(false)} onStepActive={setActiveStepId} onApiError={incrementApiErrors} />}
      {editingStepId && <EditorModal step={activeWorkflow.steps.find(s => s.id === editingStepId)!} onClose={() => setEditingStepId(null)} onSave={(updated) => { saveCurrentWorkflow(activeWorkflow.steps.map(x => x.id === updated.id ? updated : x)); setEditingStepId(null); }} />}
    </div>
  );
};

export default App;
