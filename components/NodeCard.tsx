
import React, { useRef, useState } from 'react';
import { StepType, WorkflowStep } from '../types';
import { Settings, Trash2, Database, Zap, ArrowRight, Globe, Filter, AlertTriangle } from 'lucide-react';

interface NodeCardProps {
  step: WorkflowStep;
  isActive?: boolean;
  isPanningMode?: boolean;
  isPreview?: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
}

const NodeCard: React.FC<NodeCardProps> = ({ step, isActive, isPanningMode, isPreview, onEdit, onDelete, onMove }) => {
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
  }[step.type] || ArrowRight;

  const pos = step.position || { x: 0, y: 0 };

  const baseClasses = `NodeCard absolute bg-white rounded-[28px] border-[1.5px] transition-all p-0 select-none flex flex-col ${theme.border} ${theme.shadow}`;
  const sizeClasses = isPreview ? 'w-[260px] scale-95 opacity-95' : 'w-[360px]';
  const dragClasses = isDragging ? 'z-[100] scale-[1.03] cursor-grabbing' : 'z-10';

  return (
    <div
      className={`${baseClasses} ${sizeClasses} ${dragClasses}`}
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={handleMouseDown}
    >
      {/* Hide connector handles in preview mode */}
      {!isPreview && <div className={`node-handle handle-in ${theme.border}`} />}
      {!isPreview && <div className={`node-handle handle-out ${theme.border}`} />}

      <div className={`p-6 ${isPreview ? 'p-4' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 ${theme.accent} rounded-2xl flex items-center justify-center shadow-lg ${isPreview ? 'w-10 h-10' : ''}`}>
              <Icon size={isPreview ? 16 : 18} className="text-white" fill={step.type === StepType.TRIGGER ? 'currentColor' : 'none'} />
            </div>
            <div>
              <div className="flex items-center justify-start gap-4 mb-2">
                <div className={`w-9 h-9 ${theme.accent} rounded-full flex items-center justify-center shadow-sm`}>
                  <Icon size={16} className="text-white" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{step.type}</span>
              </div>
              <h3 className={`text-slate-900 font-extrabold ${isPreview ? 'text-sm' : 'text-base'} leading-tight`}>{step.title || 'Sem título'}</h3>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => onEdit(step.id)} className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors"><Settings size={16} /></button>
            <button onClick={() => onDelete(step.id)} className="p-2 rounded-xl hover:bg-rose-50 text-rose-300 transition-colors"><Trash2 size={16} /></button>
          </div>
        </div>
       
        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
          <div className="px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">{step.params?.inputs?.[0] || 'Entrada'}</div>
          <ArrowRight size={12} />
          <div className="px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 text-blue-500">{step.params?.outputs?.[0] || 'Saída'}</div>
        </div>
      </div>

      {step.params?.url && (
        <div className={`bg-[#0f172a] p-5 rounded-b-[27px] mx-[1px] mb-[1px] ${isPreview ? 'p-3' : ''}`}>
          <div className="font-mono text-[11px] text-blue-300/80 break-all leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
            {step.params.url}
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeCard;
