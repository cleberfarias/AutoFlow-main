import React from 'react';
import { X } from 'lucide-react';
import type { WorkflowStep } from '../types';

interface LegendPanelProps {
  steps: WorkflowStep[];
  onClose: () => void;
}

const LegendPanel: React.FC<LegendPanelProps> = ({ steps, onClose }) => {
  return (
    <div className="fixed right-0 top-0 h-full w-[380px] bg-white shadow-2xl border-l border-slate-100 z-50">
      <div className="p-6 flex items-start justify-between border-b border-slate-100">
        <div>
          <h3 className="text-lg font-black">Legenda do Fluxo</h3>
          <p className="text-sm text-slate-500">O que cada bloco faz e para onde aponta</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-md hover:bg-slate-50"><X size={18} /></button>
      </div>

      <div className="p-6 overflow-y-auto h-[calc(100%-88px)] space-y-4">
        {steps.map(step => (
          <div key={step.id} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{step.type}</div>
                <h4 className="font-extrabold text-slate-900 mt-1 truncate max-w-[220px]">{step.title}</h4>
              </div>
              <div className="text-xs text-slate-400">ID: {step.id}</div>
            </div>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">{step.description }</p>
            <div className="mt-3 text-[12px] text-slate-500 font-bold">Próximos passos:</div>
            <div className="flex gap-2 flex-wrap mt-2">
              {(step.nextSteps || []).map(ns => (
                <div key={ns} className="px-3 py-1 bg-white rounded border border-slate-100 text-slate-600 text-[12px]">{ns}</div>
              ))}
              {!(step.nextSteps || []).length && <div className="text-[12px] text-slate-400">—</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LegendPanel;
