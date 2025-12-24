
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Wand2, Play, Sparkles, ZoomIn, ZoomOut, RotateCcw, Zap, Trash2, 
  Save, History, Mic, MicOff, Users, Plus, Search, ChevronRight, 
  LogOut, Clock, Edit3, FolderOpen, Pencil, ArrowLeft
} from 'lucide-react';
import { WorkflowStep, StepType, Client, Workflow } from './types';
import NodeCard from './components/NodeCard';
import EditorModal from './components/EditorModal';
import TestChat from './components/TestChat';
import NameModal from './components/NameModal';
import { generateWorkflowFromPrompt } from './services/geminiService';
import { getOpenAI } from './services/openaiClient';

const App: React.FC = () => {
  // Estados de Navegação e Dados
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
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
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

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const isMiddleClick = e.button === 1;
    if (!isSpacePressed && !isMiddleClick && (e.target as HTMLElement).closest('.NodeCard')) return;
    if (isSpacePressed) e.preventDefault();
    setIsPanning(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    if (!isPanning) return;

    const handleMove = (e: PointerEvent) => {
      setViewTransform(prev => ({
        ...prev,
        x: prev.x + (e.clientX - lastMousePos.current.x),
        y: prev.y + (e.clientY - lastMousePos.current.y)
      }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
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
      setClients(JSON.parse(savedData));
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
    const { type, id } = namingModal;
    
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
    else if (type === 'AUTOMATION' && activeClient) {
      const newWorkflow: Workflow = {
        id: Date.now().toString(),
        name,
        lastModified: Date.now(),
        steps: []
      };
      const updatedClient = {
        ...activeClient,
        automations: [...activeClient.automations, newWorkflow]
      };
      const updatedClients = clients.map(c => c.id === activeClient.id ? updatedClient : c);
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
            const audioFile = new File([audioBlob], 'gravacao.webm', { type: 'audio/webm' });
            const openai = getOpenAI();
            const res = await openai.audio.transcriptions.create({
              file: audioFile,
              model: 'whisper-1'
            });
            setPromptValue(p => p + (p ? " " : "") + (res.text || ''));
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
  if (!activeClient) {
    const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-4xl space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/20 text-white mx-auto mb-6 rotate-3">
              <Zap size={40} fill="currentColor" />
            </div>
            <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 uppercase">AutoFlow <span className="text-blue-600 not-italic">Enterprise</span></h1>
            <p className="text-slate-500 font-medium text-lg">Gerenciamento de fluxos inteligentes para PMEs.</p>
          </div>
          <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 space-y-8">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={24} />
              <input 
                type="text" placeholder="Buscar cliente..." 
                className="w-full pl-16 pr-6 py-6 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-3xl outline-none text-xl font-bold transition-all shadow-inner"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredClients.map(client => (
                <button key={client.id} onClick={() => setActiveClient(client)} className="group flex items-center justify-between p-6 bg-white border-2 border-slate-50 hover:border-blue-500 rounded-3xl transition-all hover:shadow-xl text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all"><Users size={24} /></div>
                    <div>
                      <h3 className="font-black text-slate-900 text-lg group-hover:text-blue-600">{client.name}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{client.automations.length} Automações</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />
                </button>
              ))}
              <button onClick={() => handleOpenNamingModal('CLIENT')} className="flex items-center justify-center p-6 bg-blue-50 border-2 border-dashed border-blue-200 hover:border-blue-500 rounded-3xl transition-all group">
                <div className="flex items-center gap-3 text-blue-600 font-black uppercase text-sm tracking-widest"><Plus size={20} /> Novo Cliente</div>
              </button>
            </div>
          </div>
        </div>
        <NameModal {...namingModal} onClose={() => setNamingModal(p => ({...p, isOpen: false}))} onConfirm={handleConfirmNaming} />
      </div>
    );
  }

  if (!activeWorkflow) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <button onClick={() => setActiveClient(null)} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-colors"><ArrowLeft size={24} /></button>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900">{activeClient.name}</h1>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mt-1 block w-fit">Dash de Gestão</span>
            </div>
          </div>
          <button onClick={() => setActiveClient(null)} className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-colors"><LogOut size={16} /> Sair</button>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto p-12">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Minhas Automações</h2>
            <button onClick={() => handleOpenNamingModal('AUTOMATION')} className="px-8 py-4 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all">
              <Plus size={18} strokeWidth={3} /> Criar Novo Fluxo
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeClient.automations.length > 0 ? activeClient.automations.map(auto => (
              <div key={auto.id} className="group relative bg-slate-50 border-2 border-transparent hover:border-blue-200 rounded-[32px] p-8 transition-all hover:shadow-2xl hover:bg-white flex flex-col h-full">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm mb-6 group-hover:scale-110 transition-transform"><FolderOpen size={24} /></div>
                <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">{auto.name}</h3>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
                  <div className="flex items-center gap-1.5"><Clock size={12} /> {new Date(auto.lastModified).toLocaleDateString()}</div>
                  <div className="flex items-center gap-1.5"><Zap size={12} /> {auto.steps.length} Blocos</div>
                </div>
                <div className="mt-auto flex gap-3 pt-6 border-t border-slate-200/50">
                  <button onClick={() => setActiveWorkflow(auto)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-colors">Abrir Editor</button>
                  <button onClick={() => handleOpenNamingModal('RENAME_AUTOMATION', auto.id, auto.name)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-500 rounded-xl transition-colors"><Pencil size={16} /></button>
                  <button onClick={() => deleteWorkflow(auto.id)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 rounded-xl transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-24 border-4 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300"><Sparkles size={40} /></div>
                <h3 className="font-black text-slate-900 text-xl uppercase tracking-tighter">Nenhum fluxo encontrado</h3>
              </div>
            )}
          </div>
        </main>
        <NameModal {...namingModal} onClose={() => setNamingModal(p => ({...p, isOpen: false}))} onConfirm={handleConfirmNaming} />
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
    } catch (e) { console.error(e); }
    finally { setIsGenerating(false); }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans">
      <aside className="w-[420px] border-r border-slate-200 bg-white flex flex-col shadow-2xl z-30">
        <div className="p-8 border-b border-slate-50 bg-white text-slate-900">
          <button onClick={() => setActiveWorkflow(null)} className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:translate-x-[-4px] transition-transform mb-4"><ArrowLeft size={14} /> Painel</button>
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"><Edit3 size={20} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tighter uppercase truncate leading-none">{activeWorkflow.name}</h1>
                <button onClick={() => handleOpenNamingModal('RENAME_AUTOMATION', activeWorkflow.id, activeWorkflow.name)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-all"><Pencil size={12} /></button>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">Cliente: {activeClient.name}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Wand2 size={14} className="text-blue-500" /> Designer de IA</label>
            <div className="relative group">
              <textarea value={promptValue} onChange={(e) => setPromptValue(e.target.value)} placeholder="Descreva a automação..." className="w-full min-h-[140px] p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-600 focus:bg-white outline-none transition-all text-sm font-medium leading-relaxed pr-14 shadow-sm" />
              <button onClick={toggleRecording} className={`absolute right-4 bottom-4 p-3 rounded-xl transition-all ${isRecording ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{isRecording ? <MicOff size={18} /> : <Mic size={18} />}</button>
            </div>
            <button onClick={handleCreateSteps} disabled={isGenerating || !promptValue.trim()} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-50 transition-all">
              {isGenerating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Gerando...</> : <><Sparkles size={16} /> Atualizar Fluxo</>}
            </button>
          </div>
        </div>
      </aside>
      <main 
        ref={canvasRef}
        className={`flex-1 relative overflow-hidden bg-slate-100/30 ${isPanning || isSpacePressed ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handlePointerDown}
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
      >
        <div className="absolute inset-0 dotted-bg opacity-20" style={{ transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`, transformOrigin: '0 0' }} />
        <div className="absolute inset-0" style={{ transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`, transformOrigin: '0 0' }}>
          <svg className="absolute inset-0 pointer-events-none w-[5000px] h-[5000px]">
            {activeWorkflow.steps.map((step) => {
              const nextSteps = Array.isArray(step.nextSteps) ? step.nextSteps : [];
              return nextSteps.map(nextId => {
              const target = activeWorkflow.steps.find(s => s.id === nextId);
              if (!target) return null;
              const startX = step.position.x + 360, startY = step.position.y + 115, endX = target.position.x, endY = target.position.y + 115;
              const isActive = activeStepId === step.id || activeStepId === target.id;
              return <path key={`${step.id}-${target.id}`} d={`M ${startX} ${startY} C ${startX + 100} ${startY}, ${endX - 100} ${endY}, ${endX} ${endY}`} stroke={isActive ? "#3b82f6" : "#cbd5e1"} strokeWidth={isActive ? "3" : "2"} fill="none" className={isActive ? 'flow-line-active' : ''} />;
            });
            })}
          </svg>
          {activeWorkflow.steps.map((step) => (
            <NodeCard
              key={step.id}
              step={step}
              isActive={activeStepId === step.id}
              isPanningMode={isSpacePressed || isPanning}
              onMove={(id, x, y) => saveCurrentWorkflow(activeWorkflow.steps.map(s => s.id === id ? {...s, position: {x, y}} : s))}
              onDelete={(id) => saveCurrentWorkflow(activeWorkflow.steps.filter(x => x.id !== id))}
              onEdit={setEditingStepId}
            />
          ))}
        </div>
        {activeWorkflow.steps.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-xl border border-white shadow-2xl rounded-[32px] p-10 w-full max-w-lg text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles size={28} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Comece descrevendo sua automação</h3>
              <p className="text-slate-500 text-sm">Use o painel à esquerda para gerar o fluxo. Você pode editar cada nó depois.</p>
              <button onClick={handleCreateSteps} disabled={isGenerating || !promptValue.trim()} className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-50 transition-all">
                <Sparkles size={14} /> Gerar Fluxo
              </button>
            </div>
          </div>
        )}
        {isGenerating && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-3 bg-white shadow-xl rounded-2xl px-6 py-4 border border-slate-100">
              <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-sm font-bold text-slate-700">Gerando fluxo...</span>
            </div>
          </div>
        )}
        <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-xl border border-white rounded-2xl px-4 py-3 shadow-xl text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Dicas: segure <span className="text-slate-700">Space</span> para mover • role para zoom
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/90 backdrop-blur-xl px-8 py-4 rounded-3xl shadow-2xl border border-white z-40">
           <button onClick={() => setIsTesting(true)} disabled={activeWorkflow.steps.length === 0} className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-black transition-all disabled:opacity-30"><Play size={16} fill="currentColor" /> Simular Fluxo</button>
           <div className="flex gap-2 border-l border-slate-200 pl-4">
             <button onClick={() => setViewTransform(p => ({...p, scale: Math.min(p.scale + 0.1, 1.5)}))} className="p-3 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-blue-600"><ZoomIn size={20}/></button>
             <button onClick={() => setViewTransform(p => ({...p, scale: Math.max(p.scale - 0.1, 0.3)}))} className="p-3 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-blue-600"><ZoomOut size={20}/></button>
             <button onClick={fitToWorkflow} className="p-3 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-blue-600"><RotateCcw size={20}/></button>
           </div>
        </div>
      </main>
      <NameModal {...namingModal} onClose={() => setNamingModal(p => ({...p, isOpen: false}))} onConfirm={handleConfirmNaming} />
      {isTesting && <TestChat steps={activeWorkflow.steps} onClose={() => setIsTesting(false)} onStepActive={setActiveStepId} />}
      {editingStepId && <EditorModal step={activeWorkflow.steps.find(s => s.id === editingStepId)!} onClose={() => setEditingStepId(null)} onSave={(updated) => { saveCurrentWorkflow(activeWorkflow.steps.map(x => x.id === updated.id ? updated : x)); setEditingStepId(null); }} />}
    </div>
  );
};

export default App;
