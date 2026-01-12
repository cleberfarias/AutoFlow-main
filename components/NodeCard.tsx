
import React, { useRef, useState } from 'react';
import { StepType, WorkflowStep } from '../types';
import { Settings, Trash2, Database, Zap, ArrowRight, Globe, Filter, AlertTriangle } from 'lucide-react';

interface NodeCardProps {
  step: WorkflowStep;
  isActive?: boolean;
  isPanningMode?: boolean;
  isPreview?: boolean;
  isLocked?: boolean; // locked until previous steps are completed
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onComplete?: (id: string) => void; // called when node is confirmed/validated
  onApiError?: (n?: number) => void; // notify app of api errors
  onUpdate?: (updated: WorkflowStep) => void; // persist changes to step
}

const NodeCard: React.FC<NodeCardProps> = ({ step, isActive, isPanningMode, isPreview, isLocked=false, onEdit, onDelete, onMove, onComplete, onApiError, onUpdate }) => {
  const [isDragging, setIsDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPanningMode) return;
    // Impede que o clique no card inicie o movimento de arrastar da tela (canvas)
    e.stopPropagation();
    
    if ((e.target as HTMLElement).closest('button')) return;
    
    setIsDragging(true);
    offset.current = {
      x: e.clientX - (step.position?.x || 0),
      y: e.clientY - (step.position?.y || 0)
    };
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onMove(step.id, e.clientX - offset.current.x, e.clientY - offset.current.y);
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onMove, step.id]);

  const getTheme = () => {
    if (isActive) return { border: 'border-blue-500', shadow: 'shadow-[0_20px_50px_rgba(59,130,246,0.25)]', accent: 'bg-blue-600' };
    switch (step.type) {
      case StepType.TRIGGER: return { border: 'border-emerald-500', shadow: 'shadow-emerald-500/10', accent: 'bg-emerald-500' };
      case StepType.ACTION: return { border: 'border-blue-600', shadow: 'shadow-blue-600/10', accent: 'bg-blue-600' };
      case StepType.DATA: return { border: 'border-indigo-600', shadow: 'shadow-indigo-600/10', accent: 'bg-indigo-600' };
      case StepType.LOGIC: return { border: 'border-amber-500', shadow: 'shadow-amber-500/10', accent: 'bg-amber-500' };
      case StepType.ERROR_HANDLER: return { border: 'border-rose-500', shadow: 'shadow-rose-500/10', accent: 'bg-rose-500' };
      case StepType.MCP: {
        // Cores específicas por serviço MCP
        const service = step.params?.mcp?.service;
        const colors: Record<string, any> = {
          stripe: { border: 'border-[#635BFF]', shadow: 'shadow-[#635BFF]/10', accent: 'bg-[#635BFF]' },
          sendgrid: { border: 'border-[#1A82E2]', shadow: 'shadow-[#1A82E2]/10', accent: 'bg-[#1A82E2]' },
          twilio: { border: 'border-[#F22F46]', shadow: 'shadow-[#F22F46]/10', accent: 'bg-[#F22F46]' },
          hubspot: { border: 'border-[#FF7A59]', shadow: 'shadow-[#FF7A59]/10', accent: 'bg-[#FF7A59]' },
          zendesk: { border: 'border-[#03363D]', shadow: 'shadow-[#03363D]/10', accent: 'bg-[#03363D]' },
          'google-calendar': { border: 'border-[#4285F4]', shadow: 'shadow-[#4285F4]/10', accent: 'bg-[#4285F4]' },
          docusign: { border: 'border-[#FFD200]', shadow: 'shadow-[#FFD200]/10', accent: 'bg-[#FFD200]' },
          clicksign: { border: 'border-[#FF6B00]', shadow: 'shadow-[#FF6B00]/10', accent: 'bg-[#FF6B00]' },
          rdstation: { border: 'border-[#F15A24]', shadow: 'shadow-[#F15A24]/10', accent: 'bg-[#F15A24]' },
          pagarme: { border: 'border-[#65A300]', shadow: 'shadow-[#65A300]/10', accent: 'bg-[#65A300]' },
          advbox: { border: 'border-[#1E3A8A]', shadow: 'shadow-[#1E3A8A]/10', accent: 'bg-[#1E3A8A]' },
          mongodb: { border: 'border-[#00ED64]', shadow: 'shadow-[#00ED64]/10', accent: 'bg-[#00ED64]' }
        };
        return colors[service] || { border: 'border-purple-600', shadow: 'shadow-purple-600/10', accent: 'bg-purple-600' };
      }
      default: return { border: 'border-slate-200', shadow: 'shadow-slate-200/10', accent: 'bg-slate-400' };
    }
  };

  const theme = getTheme();
  const Icon = {
    [StepType.TRIGGER]: Zap,
    [StepType.ACTION]: ArrowRight,
    [StepType.DATA]: Database,
    [StepType.LOGIC]: Filter,
    [StepType.ERROR_HANDLER]: AlertTriangle,
    [StepType.MCP]: Globe, // Ícone padrão para MCP
  }[step.type] || ArrowRight;

  const pos = step.position || { x: 0, y: 0 };

  const baseClasses = `NodeCard absolute bg-white rounded-[28px] border-[1.5px] transition-all p-0 select-none flex flex-col ${theme.border} ${theme.shadow}`;
  const sizeClasses = isPreview ? 'w-[260px] scale-95 opacity-95' : 'w-[360px]';
  const dragClasses = isDragging ? 'z-[100] scale-[1.03] cursor-grabbing' : 'z-10';
  const lockedClasses = (isLocked && !isPreview) ? 'opacity-60 grayscale pointer-events-none' : '';


  // Guided UI state
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(step.title || '');
  const [description, setDescription] = useState(step.description || '');
  const [inputs, setInputs] = useState<string[]>(step.params?.inputs || []);
  const [outputs, setOutputs] = useState<string[]>(step.params?.outputs || []);
  const [condition, setCondition] = useState(step.params?.condition || '');
  const [isCompleteLocal, setIsCompleteLocal] = useState(!!step.isComplete);
  const [apiConnected, setApiConnected] = useState<boolean>(!!step.params?.api?.lastTestSuccess);

  React.useEffect(() => {
    setTitle(step.title || '');
    setDescription(step.description || '');
    setInputs(step.params?.inputs || []);
    setOutputs(step.params?.outputs || []);
    setCondition(step.params?.condition || '');
    setIsCompleteLocal(!!step.isComplete);
    setApiConnected(!!step.params?.api?.lastTestSuccess);
  }, [step]);

  // determine required fields by type (defaults unless provided)
  const requiredFields = step.requiredFields || (step.type === StepType.TRIGGER ? ['title'] : step.type === StepType.ACTION ? ['title','outputs'] : step.type === StepType.LOGIC ? ['title','condition'] : ['title']);

  const validate = () => {
    try {
      for (const f of requiredFields) {
        if (f === 'title' && !title.trim()) return false;
        if (f === 'outputs' && (!outputs || outputs.length === 0 || outputs.every(o => !o.trim()))) return false;
        if (f === 'condition' && !condition.trim()) return false;
      }
      return true;
    } catch { return false; }
  };

  // when valid, call onComplete and persist
  React.useEffect(() => {
    if (expanded && validate() && !isCompleteLocal) {
      setIsCompleteLocal(true);
      if (onComplete) onComplete(step.id);
      setExpanded(false);
    }
  }, [expanded, title, description, inputs, outputs, condition]);

  const toggleExpand = () => {
    if (isLocked) return; // can't open locked nodes
    setExpanded(e => !e);
  };

  return (
    <div
      className={`${baseClasses} ${sizeClasses} ${dragClasses} ${lockedClasses}`}
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={handleMouseDown}
    >
      {/* Hide connector handles in preview mode */}
      {!isPreview && <div className={`node-handle handle-in ${theme.border}`} />}
      {!isPreview && <div className={`node-handle handle-out ${theme.border}`} />}

      <div className={`p-6 ${isPreview ? 'p-4' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <div className={`flex items-center gap-3 ${lockedClasses}`} onClick={() => { if (!isLocked) toggleExpand(); }}>
            <div className={`w-11 h-11 ${theme.accent} rounded-2xl flex items-center justify-center shadow-lg ${isPreview ? 'w-10 h-10' : ''}`}>
              {step.type === StepType.MCP ? (
                // Emoji específico do serviço MCP
                <span className="text-2xl">
                  {step.params?.mcp?.service === 'stripe' && '💳'}
                  {step.params?.mcp?.service === 'sendgrid' && '📧'}
                  {step.params?.mcp?.service === 'twilio' && '📱'}
                  {step.params?.mcp?.service === 'hubspot' && '🎯'}
                  {step.params?.mcp?.service === 'zendesk' && '🎫'}
                  {step.params?.mcp?.service === 'google-calendar' && '📅'}
                  {step.params?.mcp?.service === 'docusign' && '📝'}
                  {step.params?.mcp?.service === 'clicksign' && '✍️'}
                  {step.params?.mcp?.service === 'rdstation' && '📊'}
                  {step.params?.mcp?.service === 'pagarme' && '💰'}
                  {step.params?.mcp?.service === 'advbox' && '⚖️'}
                  {step.params?.mcp?.service === 'mongodb' && '🍃'}
                  {!step.params?.mcp?.service && '🔌'}
                </span>
              ) : (
                <Icon size={isPreview ? 16 : 18} className="text-white" fill={step.type === StepType.TRIGGER ? 'currentColor' : 'none'} />
              )}
            </div>
            <div>
              <div className="flex items-center justify-start gap-4 mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {step.type === StepType.MCP ? '🔌 MCP' : step.type}
                </span>
                {step.params?.api && (
                  <div className="ml-2 px-2 py-1 rounded-md text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-100">API</div>
                )}
                {step.type === StepType.MCP && step.params?.mcp?.service && (
                  <div className="ml-2 px-2 py-1 rounded-md text-[10px] font-bold bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-100">
                    {step.params.mcp.service.toUpperCase()}
                  </div>
                )}
              </div>
              <h3 className={`text-slate-900 font-extrabold ${isPreview ? 'text-sm' : 'text-base'} leading-tight`}>{step.title || 'Sem título'}</h3>
              {step.type === StepType.MCP && step.description && (
                <p className="text-xs text-slate-500 mt-1">{step.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => onEdit(step.id)} className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors"><Settings size={16} /></button>
            <button onClick={() => onDelete(step.id)} className="p-2 rounded-xl hover:bg-rose-50 text-rose-300 transition-colors"><Trash2 size={16} /></button>
          </div>
        </div>
       
        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
          <div className="px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">{inputs?.[0] || 'Entrada'}</div>
          <ArrowRight size={12} />
          <div className="px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 text-blue-500">{outputs?.[0] || 'Saída'}</div>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">{step.helpText || (step.type === StepType.ACTION ? 'Especifique o que essa ação faz e quais saídas ela produz.' : step.type === StepType.TRIGGER ? 'O que inicia este fluxo? Ex: "Recebeu Mensagem".' : step.type === StepType.LOGIC ? 'Qual condição determina o caminho?' : 'Descreva este passo.')}</div>
            {isCompleteLocal ? (<div className="text-xs text-emerald-600 font-bold">Completo ✓</div>) : (isLocked ? (<div className="text-xs text-slate-300 font-bold">Bloqueado 🔒</div>) : (<div className="text-xs text-amber-500 font-bold">Aberto</div>))}
          </div>

          {/* Expandable details (prototype) */}
          {expanded && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500">Título <span className="text-rose-500">*</span></label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mt-1 p-3 rounded-lg border border-slate-100" />
              </div>

              {step.type === StepType.LOGIC && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500">Condição <span className="text-rose-500">*</span></label>
                  <input value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full mt-1 p-3 rounded-lg border border-slate-100" placeholder="ex: valor_total > 100" />
                </div>
              )}

              {step.type === StepType.ACTION && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500">Saídas (outputs) <span className="text-rose-500">*</span></label>
                  <div className="mt-1 flex flex-col gap-2">
                    {outputs.map((o, idx) => (
                      <input key={idx} value={o} onChange={(e) => setOutputs(outputs.map((v,i) => i===idx ? e.target.value : v))} className="w-full p-3 rounded-lg border border-slate-100" />
                    ))}
                    <button onClick={() => setOutputs(o => [...o, ''])} className="text-sm text-blue-600 font-bold">+ Adicionar saída</button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-500">Descrição</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full mt-1 p-3 rounded-lg border border-slate-100" />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">Campos obrigatórios: {requiredFields.join(', ')}</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setExpanded(false); }} className="px-3 py-2 rounded-lg border text-sm">Fechar</button>
                  <button onClick={() => { /* manual confirm fallback */
                    if (validate()) { setIsCompleteLocal(true); if (onComplete) onComplete(step.id); setExpanded(false); } else { alert('Preencha todos os campos obrigatórios.'); }
                  }} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm">Confirmar</button>
                </div>
              </div>
            </div>
          )}

        </div>

        {step.params?.api && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-sm font-bold text-slate-600">API: <span className="font-mono text-xs text-slate-500">{(step.params.api.url || '').replace(/^https?:\/\//,'')}</span></div>
            <div className="flex items-center gap-2">
              {apiConnected ? (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div className="text-sm text-emerald-600 font-bold">Conectado</div>
                  <button onClick={async () => {
                    try {
                      const res = await fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api: step.params.api, variables: {} }) });
                      const json = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        if (onApiError) onApiError(1);
                        throw new Error(json?.message || JSON.stringify(json));
                      }
                      alert('Resposta: ' + (typeof json.body === 'string' ? json.body : JSON.stringify(json.body)));
                    } catch (err: any) { if (onApiError) onApiError(1); alert('Erro ao testar API: ' + (err?.message || String(err))); }
                  }} className="px-3 py-2 bg-slate-100 rounded-xl text-sm">Retestar</button>
                  <button onClick={() => onEdit(step.id)} className="px-3 py-2 bg-white border border-slate-100 rounded-xl text-sm">Editar</button>
                </div>
              ) : (
                <>
                  <button onClick={async () => {
                    try {
                      const res = await fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api: step.params.api, variables: {} }) });
                      const json = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        if (onApiError) onApiError(1);
                        throw new Error(json?.message || JSON.stringify(json));
                      }
                      // persist connected state if parent supports onUpdate
                      if ((onUpdate as any) && typeof onUpdate === 'function') {
                        onUpdate({ ...step, params: { ...step.params, api: { ...step.params.api, lastTestSuccess: true } } });
                      }
                      setApiConnected(true);
                      alert('Resposta: ' + (typeof json.body === 'string' ? json.body : JSON.stringify(json.body)));
                    } catch (err: any) { if (onApiError) onApiError(1); alert('Erro ao testar API: ' + (err?.message || String(err))); }
                  }} className="px-3 py-2 bg-slate-100 rounded-xl text-sm">Testar API</button>
                  <button onClick={() => onEdit(step.id)} className="px-3 py-2 bg-white border border-slate-100 rounded-xl text-sm">Editar</button>
                </>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default NodeCard;
