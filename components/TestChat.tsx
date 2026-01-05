
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Terminal, Globe, Activity, TerminalSquare, AlertCircle, Cpu, ChevronRight, Hash, Mic, MicOff } from 'lucide-react';
import { WorkflowStep, StepType } from '../types';
// OpenAI usage removed from browser. Backend endpoints (/api/autoflow/simulate, /api/autoflow/transcribe) should be used instead.
import { findNextAvailableSlot, findConflictingAppointments } from '../services/availability';
import { findAvailabilityAction, createAppointmentAction } from '../services/simulatorActions';
import type { Appointment, AvailabilityWindow, Service, Professional } from '../types';
import { AppointmentStatus } from '../types';

interface TestChatProps {
  steps: WorkflowStep[];
  onClose: () => void;
  onStepActive: (id: string | null) => void;
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
}

const TestChat: React.FC<TestChatProps> = ({ steps, onClose, onStepActive }) => {
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

    startSimulation();
  }, []);

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
    try {
      // prefer server-side transcription
      const fd = new FormData();
      fd.append('file', audioBlob, 'audio.webm');
      const res = await fetch('/api/autoflow/transcribe', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        const transcription = data?.text;
        if (transcription) {
          setInput(transcription);
          handleSend(transcription);
        }
        return;
      }
    } catch (err) {
      console.warn('/api/autoflow/transcribe not available', err);
    }
    // fallback
    setInput('');
    setMessages(prev => [...prev, { role: 'assistant', content: 'Transcrição não disponível no navegador.' }]);
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

    // Try server-side simulator
    try {
      const res = await fetch('/api/autoflow/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'start', steps, triggerId: trigger.id })
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data?.raw || '{}';
        const parsed = parseJson(raw) || data || {};
        // apply potential action emulation locally (same as previous behavior)
        if (parsed.actionName === 'findAvailability') {
          const r = findAvailabilityAction(availabilityList, appointmentsList, servicesList, parsed.actionPayload || {});
          if (r) parsed.newVariables = { ...(parsed.newVariables || {}), suggestedStart: r.suggestedStart, suggestedEnd: r.suggestedEnd };
        }
        if (parsed.actionName === 'createAppointment') {
          const p = parsed.actionPayload || {};
          if (p.start && p.end) {
            const appt = createAppointmentAction(appointmentsList, p);
            setAppointmentsList(prev => [...prev, appt]);
            parsed.newVariables = { ...(parsed.newVariables || {}), lastAppointmentId: appt.id };
          }
        }

        setVariables(prev => ({ ...prev, ...(parsed.newVariables || {}) }));
        setMessages([{ role: 'assistant', content: parsed.userMessage || 'Fluxo iniciado', stepId: parsed.stepId, techLog: { action: parsed.actionName, description: parsed.actionDescription } }]);
        setChatHistory([{ role: 'assistant', content: JSON.stringify(parsed) }]);
        setIsTyping(false);
        return;
      }
    } catch (err) {
      console.warn('/api/autoflow/simulate not available', err);
    }

    // Local simple fallback
    setMessages([{ role: 'assistant', content: `Olá! O fluxo "${trigger.title}" foi iniciado.` }]);
    setChatHistory([{ role: 'assistant', content: `{"userMessage":"Olá!","stepId":"${trigger.id}"}` }]);
    setIsTyping(false);
  };

  const handleSend = async (overrideInput?: string) => {
    const userMsg = overrideInput || input;
    if (!userMsg.trim() || isTyping) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    const newHistory = [...chatHistory, { role: 'user', content: userMsg }];

    // try server-side simulator
    try {
      const res = await fetch('/api/autoflow/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'message', steps, variables, history: newHistory, message: userMsg })
      });
      if (res.ok) {
        const data = await res.json();
        const parsed = parseJson(data?.raw || data?.response || '{}') || data || {};
        if (parsed.stepId) onStepActive(parsed.stepId);

        // actions local emulation
        if (parsed.actionName === 'findAvailability') {
          const r = findAvailabilityAction(availabilityList, appointmentsList, servicesList, parsed.actionPayload || {});
          if (r) parsed.newVariables = { ...(parsed.newVariables || {}), suggestedStart: r.suggestedStart, suggestedEnd: r.suggestedEnd };
        }
        if (parsed.actionName === 'createAppointment') {
          const p = parsed.actionPayload || {};
          if (p.start && p.end) {
            const appt = createAppointmentAction(appointmentsList, p);
            setAppointmentsList(prev => [...prev, appt]);
            parsed.newVariables = { ...(parsed.newVariables || {}), lastAppointmentId: appt.id };
          }
        }

        if (parsed.newVariables) setVariables(prev => ({ ...prev, ...parsed.newVariables }));
        setMessages(prev => [...prev, { role: 'assistant', content: parsed.userMessage || 'Resposta', stepId: parsed.stepId, techLog: { action: parsed.actionName, description: parsed.actionDescription } }]);
        setChatHistory([...newHistory, { role: 'assistant', content: JSON.stringify(parsed) }]);
        setIsTyping(false);
        return;
      }
    } catch (err) {
      console.warn('/api/autoflow/simulate not available', err);
    }

    // fallback local behavior: basic echo / simple step advance
    const next = steps.find(s => s.id === activeStepId) || steps[0];
    const resp = `Simulado: recebido "${userMsg}"${next ? `, passo atual: ${next.title}` : ''}`;
    setMessages(prev => [...prev, { role: 'assistant', content: resp }]);
    setIsTyping(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[520px] bg-white shadow-[-40px_0_100px_rgba(0,0,0,0.15)] z-[60] flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-500">
      <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu size={20} className="text-blue-400" />
          <div>
            <h2 className="font-black text-[10px] uppercase tracking-widest text-blue-400">Runtime Simulator v2</h2>
            <div className="flex items-center gap-2 mt-1">
               <div className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
               <span className="text-xs font-bold text-slate-300">{isRecording ? 'Escutando Áudio...' : 'Conversa Ativa'}</span>
            </div>
          </div>
        </div>
        <button onClick={() => { onStepActive(null); onClose(); }} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
      </div>

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

      {/* Quick POC controls for availability / appointment */}
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {error && (
          <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700">
            <AlertCircle size={20} />
            <p className="text-xs font-bold uppercase">{error}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-3`}>
            {msg.techLog && (
              <div className="w-[90%] bg-slate-900 rounded-2xl p-4 border border-white/5 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                 <div className="flex items-center gap-2 text-[9px] font-black text-blue-400 uppercase mb-2">
                   <TerminalSquare size={10} /> {msg.techLog.action}
                 </div>
                 <p className="text-[10px] text-slate-400 leading-relaxed italic">
                   {msg.techLog.description}
                 </p>
              </div>
            )}
            <div className={`max-w-[85%] p-5 rounded-[24px] text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
            }`}>
              {msg.content}
            </div>
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
