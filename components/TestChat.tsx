
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Terminal, Globe, Activity, TerminalSquare, AlertCircle, Cpu, ChevronRight, Hash, Mic, MicOff, Badge, HelpCircle } from 'lucide-react';
import { WorkflowStep, StepType } from '../types';
import { getOpenAI } from '../services/openaiClient';
import { findNextAvailableSlot, findConflictingAppointments } from '../services/availability';
import { findAvailabilityAction, createAppointmentAction } from '../services/simulatorActions';
import type { Appointment, AvailabilityWindow, Service, Professional } from '../types';
import { AppointmentStatus } from '../types';
// Support Router - Sistema de Hierarquia de IA
import { handleMessage as handleSupportMessage, getSessionStatus } from '../src/services/supportRouter';
import type { SupportUIResponse } from '../src/services/supportRouter';

interface TestChatProps {
  steps: WorkflowStep[];
  onClose: () => void;
  onStepActive: (id: string | null) => void;
  onApiError?: (n?: number) => void;
  // Novo: modo de operação do chat
  mode?: 'workflow' | 'support'; // 'workflow' = comportamento atual, 'support' = novo sistema de suporte
}

interface Message {
  role: 'assistant' | 'user';
  content: string;
  stepId?: string;
  techLog?: {
    action: string;
    description: string;
    payload?: any;
  };
  // Novos campos para suporte
  supportData?: {
    intent?: string;
    severity?: string;
    stage?: string;
    confidence?: number;
    checklist?: string[];
    action?: string;
  };
}

const TestChat: React.FC<TestChatProps> = ({ steps, onClose, onStepActive, onApiError, mode = 'workflow' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [availabilityList, setAvailabilityList] = useState<AvailabilityWindow[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [professionalsList, setProfessionalsList] = useState<Professional[]>([]);
  
  // Novo: Estado para modo suporte
  const [currentChatId] = useState(() => `chat_${Date.now()}`); // ID único para esta sessão
  const [supportSessionData, setSupportSessionData] = useState<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const parseJson = (text: string) => {
    try {
      return JSON.parse(text);
    } catch {}
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const [selectedProfessional, setSelectedProfessional] = useState<string | undefined>(undefined);
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);

  useEffect(() => {
    // seed some demo data for POC
    setProfessionalsList([
      { id: 'p1', name: 'Maria', services: ['s1'], locationId: 'l1', availability: [] },
      { id: 'p2', name: 'João', services: ['s1'], locationId: 'l1', availability: [] }
    ]);

    setServicesList([
      { id: 's1', title: 'Limpeza de Pele', durationMinutes: 60, locationId: 'l1' }
    ]);

    setAvailabilityList([
      { professionalId: 'p1', start: '2025-12-26T09:00:00.000Z', end: '2025-12-26T17:00:00.000Z' },
      { professionalId: 'p2', start: '2025-12-26T09:00:00.000Z', end: '2025-12-26T12:00:00.000Z' }
    ]);

    // Inicializar baseado no modo
    if (mode === 'support') {
      // Modo suporte: mensagem de boas-vindas
      setMessages([{
        role: 'assistant',
        content: 'Olá! 👋 Sou o assistente de suporte do ChatGuru. Como posso ajudar você hoje?'
      }]);
    } else {
      // Modo workflow: inicializa simulação normal
      startSimulation();
    }
  }, [mode]);

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

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await transcribeAudio(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Erro ao acessar microfone:", err);
      }
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    const openai = getOpenAI();
    try {
      const audioFile = new File([audioBlob], 'gravacao.webm', { type: 'audio/webm' });
      const response = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1'
      });
      const transcription = response.text;
      if (transcription) {
        setInput(transcription);
        // Automaticaly trigger send if it's clear
        handleSend(transcription);
      }
    } catch (err) {
      console.error("Erro na transcrição:", err);
    }
  };



  const startSimulation = async () => {
    setIsTyping(true);
    const trigger = steps.find(s => s.type === StepType.TRIGGER) || steps[0];
    
    if (!trigger) {
      setError("Crie alguns blocos primeiro!");
      setIsTyping(false);
      return;
    }

    onStepActive(trigger.id);

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps, userMessage: 'Inicie a simulação.' })
      });
      if (!res.ok) throw new Error((await res.json().catch(()=>({}))).message || 'simulate_failed');
      const payload = await res.json();
      const data = payload?.result || {};

      // Se o assistant solicitou uma ação (DATA/ACTION), execute localmente como POC
      if (data.actionName) {
        if (data.actionName === 'findAvailability') {
          const res = findAvailabilityAction(availabilityList, appointmentsList, servicesList, data.actionPayload || {});
          if (res) {
            data.newVariables = { ...(data.newVariables || {}), suggestedStart: res.suggestedStart, suggestedEnd: res.suggestedEnd };
            data.actionDescription = `Encontrada vaga: ${res.suggestedStart} -> ${res.suggestedEnd}`;
          } else {
            data.actionDescription = 'Nenhuma janela disponível encontrada';
          }
        }

        if (data.actionName === 'createAppointment') {
          const payload = data.actionPayload || {};
          if (payload.start && payload.end) {
            const appt = createAppointmentAction(appointmentsList, payload);
            setAppointmentsList(prev => [...prev, appt]);
            data.newVariables = { ...(data.newVariables || {}), lastAppointmentId: appt.id, lastAppointmentStart: appt.start };
            data.actionDescription = `Agendamento criado ${appt.id} ${appt.start}`;
          } else {
            data.actionDescription = 'Payload incompleto para createAppointment';
          }
        }

        // New: call configured API on a node
        if (data.actionName === 'call_api') {
          const stepId = (data.actionPayload && data.actionPayload.stepId) || data.stepId;
          const step = steps.find(s => s.id === stepId);
          if (step && step.params?.api) {
            try {
              const apiPayload = step.params.api;
              const resp = await fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api: apiPayload, variables: { ...(data.actionPayload?.variables || {}), ...variables } }) });
              const json = await resp.json();
              if (!resp.ok) {
                data.actionDescription = `Erro na chamada externa: ${json?.message || json?.error || resp.status}`;
              } else {
                data.actionDescription = `Chamada externa OK (status ${json.status})`;
                data.newVariables = { ...(data.newVariables || {}), ...(json.outputs || {}) };
              }
            } catch (err) {
              data.actionDescription = `Erro ao executar API: ${err?.message || String(err)}`;
            }
          } else {
            data.actionDescription = 'API não configurada para o passo indicado';
          }
        }
      }

      setVariables(prev => ({ ...prev, ...(data.newVariables || {}) }));
      setMessages([{ 
        role: 'assistant', 
        content: data.userMessage, 
        stepId: data.stepId,
        techLog: { action: data.actionName, description: data.actionDescription }
      }]);
      setChatHistory([{ role: 'assistant', content: JSON.stringify(data) }]);

      // If the current step has an API configured, call it and map outputs
      try {
        const stepApi = (trigger && trigger.params && (trigger.params as any).api) || null;
        if (stepApi && stepApi.url) {
          const res = await fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api: stepApi, variables }) });
          const body = await res.json().catch(() => null);
          if (res.ok && body) {
            const out = body.outputs || {};
            // apply outputs to variables and show techLog
            setVariables(prev => ({ ...prev, ...out }));
            setMessages(prev => [...prev, { role: 'assistant', content: `Resultado da API: ${JSON.stringify(out)}`, techLog: { action: 'api_call', description: stepApi.url } }]);
          } else {
            if (onApiError) onApiError(1);
            setMessages(prev => [...prev, { role: 'assistant', content: `Erro ao chamar API: ${body?.message || 'unknown'}`, techLog: { action: 'api_call', description: stepApi.url } }]);
          }
        }
      } catch (err) {
        console.error('api call in startSimulation failed', err);
      }
    } catch (err: any) {
      console.error('startSimulation error', err);
      setError(err?.message || 'Erro ao iniciar simulação');
      setMessages([{ role: 'assistant', content: "Olá! O fluxo foi iniciado. Como posso te ajudar hoje?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const userMsg = overrideInput || input;
    if (!userMsg.trim() || isTyping) return;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    // NOVO: Se modo suporte, usar o supportRouter
    if (mode === 'support') {
      try {
        const response: SupportUIResponse = await handleSupportMessage(currentChatId, userMsg);
        
        // Atualizar dados da sessão
        const sessionStatus = getSessionStatus(currentChatId);
        setSupportSessionData(sessionStatus);

        // Criar mensagem do assistente
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.replyText,
          supportData: {
            intent: response.intent,
            severity: response.severity,
            stage: response.stageNext,
            confidence: response.confidence,
            checklist: response.checklist,
            action: response.action
          }
        };

        // Se tem checklist, adicionar ao conteúdo
        if (response.checklist && response.checklist.length > 0) {
          assistantMessage.content += '\n\n';
          // A checklist será renderizada separadamente no UI
        }

        setMessages(prev => [...prev, assistantMessage]);
        
        // Se transferiu para humano, avisar
        if (response.action === 'HANDOFF') {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: '🔔 Você foi transferido para a fila de atendimento humano. Um agente irá atendê-lo em breve.',
              supportData: {
                action: 'HANDOFF',
                stage: 'HUMAN'
              }
            }]);
          }, 1000);
        }

      } catch (error) {
        console.error('[TestChat] Erro no modo suporte:', error);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro. Por favor, tente novamente.'
        }]);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    // CÓDIGO ORIGINAL: modo workflow
    const newHistory = [...chatHistory, { role: 'user', content: userMsg }];

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps, userMessage: userMsg, variables, history: newHistory })
      });
      if (!res.ok) throw new Error((await res.json().catch(()=>({}))).message || 'simulate_failed');
      const payload = await res.json();
      const data = payload?.result || {};
      if (data.stepId) onStepActive(data.stepId);

      // If the step referenced by the assistant has API config, call proxy
      try {
        const step = steps.find(s => s.id === data.stepId);
        const stepApi = step?.params?.api || null;
        if (stepApi && stepApi.url) {
          const res = await fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api: stepApi, variables }) });
          const body = await res.json().catch(() => null);
          if (res.ok && body) {
            const out = body.outputs || {};
            if (out) setVariables(prev => ({ ...prev, ...out }));
            setMessages(prev => [...prev, { role: 'assistant', content: `Resultado da API: ${JSON.stringify(out)}`, techLog: { action: 'api_call', description: stepApi.url } }]);
          } else {
            setMessages(prev => [...prev, { role: 'assistant', content: `Erro ao chamar API: ${body?.message || 'unknown'}`, techLog: { action: 'api_call', description: stepApi.url } }]);
          }
        }
      } catch (err) {
        console.error('api proxy call failed', err);
      }

      // se veio uma ação, execute localmente como POC
      if (data.actionName) {
        if (data.actionName === 'findAvailability') {
          const res = findAvailabilityAction(availabilityList, appointmentsList, servicesList, data.actionPayload || {});
          if (res) {
            data.newVariables = { ...(data.newVariables || {}), suggestedStart: res.suggestedStart, suggestedEnd: res.suggestedEnd };
            data.actionDescription = `Encontrada vaga: ${res.suggestedStart} -> ${res.suggestedEnd}`;
          } else {
            data.actionDescription = 'Nenhuma janela disponível encontrada';
          }
        }

        if (data.actionName === 'createAppointment') {
          const payload = data.actionPayload || {};
          if (payload.start && payload.end) {
            const appt = createAppointmentAction(appointmentsList, payload);
            setAppointmentsList(prev => [...prev, appt]);
            data.newVariables = { ...(data.newVariables || {}), lastAppointmentId: appt.id, lastAppointmentStart: appt.start };
            data.actionDescription = `Agendamento criado ${appt.id} ${appt.start}`;
          } else {
            data.actionDescription = 'Payload incompleto para createAppointment';
          }
        }
      }

      if (data.newVariables) setVariables(prev => ({ ...prev, ...data.newVariables }));
      
      setMessages(prev => [...prev, { 
        role: 'assistant', content: data.userMessage, stepId: data.stepId,
        techLog: { action: data.actionName, description: data.actionDescription }
      }]);
      setChatHistory([...newHistory, { role: 'assistant', content: JSON.stringify(data) }]);
    } catch (err: any) {
      console.error('handleSend error', err);
      setError(err?.message || 'Erro na simulação');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[520px] bg-white shadow-[-40px_0_100px_rgba(0,0,0,0.15)] z-[60] flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-500">
      <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu size={20} className="text-blue-400" />
          <div>
            <h2 className="font-black text-[10px] uppercase tracking-widest text-blue-400">
              {mode === 'support' ? 'Suporte ChatGuru' : 'Runtime Simulator v2'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
               <div className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
               <span className="text-xs font-bold text-slate-300">{isRecording ? 'Escutando Áudio...' : 'Conversa Ativa'}</span>
            </div>
          </div>
        </div>
        <button onClick={() => { onStepActive(null); onClose(); }} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
      </div>

      {/* Barra de status da sessão - apenas no modo suporte */}
      {mode === 'support' && supportSessionData && (
        <div className="bg-slate-800 border-b border-white/5 px-4 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-white/10 shrink-0">
            <Activity size={10} className="text-blue-400" />
            <span className="text-[10px] font-bold text-slate-400">Stage:</span>
            <span className="text-[10px] font-mono text-white">{supportSessionData.stage}</span>
          </div>
          
          {supportSessionData.intent && (
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-white/10 shrink-0">
              <HelpCircle size={10} className="text-purple-400" />
              <span className="text-[10px] font-bold text-slate-400">Intent:</span>
              <span className="text-[10px] font-mono text-white">{supportSessionData.intent}</span>
            </div>
          )}

          {supportSessionData.severity && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shrink-0 ${
              supportSessionData.severity === 'HIGH' ? 'bg-rose-900/50 border-rose-500/30' :
              supportSessionData.severity === 'MEDIUM' ? 'bg-amber-900/50 border-amber-500/30' :
              'bg-emerald-900/50 border-emerald-500/30'
            }`}>
              <Badge size={10} className={
                supportSessionData.severity === 'HIGH' ? 'text-rose-400' :
                supportSessionData.severity === 'MEDIUM' ? 'text-amber-400' :
                'text-emerald-400'
              } />
              <span className="text-[10px] font-bold text-slate-400">Severity:</span>
              <span className="text-[10px] font-mono text-white">{supportSessionData.severity}</span>
            </div>
          )}

          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-white/10 shrink-0">
            <Terminal size={10} className="text-cyan-400" />
            <span className="text-[10px] font-bold text-slate-400">Confidence:</span>
            <span className="text-[10px] font-mono text-white">{(supportSessionData.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* Barra de variáveis - apenas no modo workflow */}
      {mode === 'workflow' && (
        <div className="bg-slate-800 border-b border-white/5 p-4 flex gap-3 overflow-x-auto no-scrollbar">
           {Object.entries(variables).length > 0 ? Object.entries(variables).map(([key, val]) => (
             <div key={key} className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-white/10 shrink-0">
               <Hash size={10} className="text-blue-400" />
               <span className="text-[10px] font-bold text-slate-400">{key}:</span>
               <span className="text-[10px] font-mono text-white">{String(val)}</span>
             </div>
           )) : (
             <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-2">
               <Activity size={10} /> Aguardando captura de dados...
             </div>
           )}
        </div>
      )}

      {/* Quick POC controls for availability / appointment - apenas no modo workflow */}
      {mode === 'workflow' && (
        <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-3">
          <select value={selectedProfessional} onChange={(e) => setSelectedProfessional(e.target.value || undefined)} className="px-3 py-2 border rounded-md text-sm">
            <option value="">Selecionar profissional</option>
            {professionalsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <select value={selectedService} onChange={(e) => setSelectedService(e.target.value || undefined)} className="px-3 py-2 border rounded-md text-sm">
            <option value="">Selecionar serviço</option>
            {servicesList.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>

          <button onClick={() => {
            const payload = { professionalId: selectedProfessional, serviceId: selectedService, fromISO: new Date().toISOString() };
            const res = findAvailabilityAction(availabilityList, appointmentsList, servicesList, payload);
            if (res) {
              setVariables(prev => ({ ...prev, suggestedStart: res.suggestedStart, suggestedEnd: res.suggestedEnd }));
              setMessages(prev => [...prev, { role: 'assistant', content: `Sugestão encontrada: ${res.suggestedStart} → ${res.suggestedEnd}`, techLog: { action: 'findAvailability', description: `Encontrada vaga: ${res.suggestedStart} -> ${res.suggestedEnd}` } }]);
            } else {
              setMessages(prev => [...prev, { role: 'assistant', content: `Nenhuma janela disponível.`, techLog: { action: 'findAvailability', description: 'Nenhuma janela disponível encontrada' } }]);
            }
          }} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm">Encontrar vaga</button>

          <button onClick={() => {
            const start = variables.suggestedStart;
            const end = variables.suggestedEnd;
            if (!start || !end) {
              setMessages(prev => [...prev, { role: 'assistant', content: 'Não há vaga sugerida para criar agendamento.', techLog: { action: 'createAppointment', description: 'sem sugestão' } }]);
              return;
            }
            const payload = { professionalId: selectedProfessional, serviceId: selectedService, start, end } as any;
            const appt = createAppointmentAction(appointmentsList, payload);
            setAppointmentsList(prev => [...prev, appt]);
            setVariables(prev => ({ ...prev, lastAppointmentId: appt.id, lastAppointmentStart: appt.start }));
            setMessages(prev => [...prev, { role: 'assistant', content: `Agendamento criado: ${appt.id} ${appt.start}`, techLog: { action: 'createAppointment', description: `Agendamento criado ${appt.id} ${appt.start}` } }]);
          }} className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm">Criar agendamento</button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {error && (
          <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700">
            <AlertCircle size={20} />
            <p className="text-xs font-bold uppercase">{error}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-3`}>
            {/* TechLog - apenas no modo workflow */}
            {msg.techLog && mode === 'workflow' && (
              <div className="w-[90%] bg-slate-900 rounded-2xl p-4 border border-white/5 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                 <div className="flex items-center gap-2 text-[9px] font-black text-blue-400 uppercase mb-2">
                   <TerminalSquare size={10} /> {msg.techLog.action}
                 </div>
                 <p className="text-[10px] text-slate-400 leading-relaxed italic">
                   {msg.techLog.description}
                 </p>
              </div>
            )}
            
            {/* Mensagem principal */}
            <div className={`max-w-[85%] p-5 rounded-[24px] text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
            }`}>
              {msg.content}
            </div>

            {/* Checklist - apenas no modo suporte quando existir */}
            {msg.supportData?.checklist && msg.supportData.checklist.length > 0 && (
              <div className="w-[85%] bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 shadow-md">
                <div className="flex items-center gap-2 mb-3 text-blue-700">
                  <ChevronRight size={16} className="font-bold" />
                  <span className="text-xs font-black uppercase tracking-wide">Passo a passo:</span>
                </div>
                <ol className="space-y-2">
                  {msg.supportData.checklist.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                        {idx + 1}
                      </div>
                      <span className="text-sm text-slate-700 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Badge de ação especial - modo suporte */}
            {msg.supportData?.action === 'HANDOFF' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-300 rounded-full">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-amber-700">Transferindo para atendimento humano...</span>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 p-4 bg-white border border-slate-100 rounded-2xl w-24 shadow-sm">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-slate-100">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua resposta..."
              className="w-full pl-6 pr-14 py-4 bg-slate-100 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-[20px] outline-none text-sm font-medium transition-all"
            />
            <button 
              onClick={() => handleSend()} 
              disabled={!input.trim() || isTyping} 
              className="absolute right-2 top-2 p-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-all disabled:opacity-30"
            >
              <Send size={18} />
            </button>
          </div>
          <button 
            onClick={toggleRecording}
            className={`p-4 rounded-full transition-all flex items-center justify-center ${isRecording ? 'bg-rose-500 text-white animate-pulse shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            title={isRecording ? "Parar gravação" : "Falar mensagem"}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestChat;
