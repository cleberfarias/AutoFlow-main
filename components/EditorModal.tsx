
import React, { useState } from 'react';
import { WorkflowStep, StepType } from '../types';
import { X, Save } from 'lucide-react';

interface EditorModalProps {
  step: WorkflowStep;
  onClose: () => void;
  onSave: (updatedStep: WorkflowStep) => void;
}

const EditorModal: React.FC<EditorModalProps> = ({ step, onClose, onSave }) => {
  const [formData, setFormData] = useState<WorkflowStep>({ 
    ...step, 
    params: step.params || {} 
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('param_')) {
      const paramKey = name.replace('param_', '');
      setFormData({
        ...formData,
        params: { ...formData.params, [paramKey]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value as any });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between p-8 border-b">
          <h2 className="text-2xl font-black tracking-tight">
            Configurar Nó
          </h2>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título do Nó</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descrição</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none font-medium text-slate-600 transition-all resize-none"
            />
          </div>

          <div className="pt-6 border-t mt-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Parâmetros Técnicos</h4>
            {Object.entries(formData.params || {}).map(([key, val]) => (
              !Array.isArray(val) && (
                <div key={key} className="mb-4">
                  <label className="block text-xs font-bold text-slate-500 mb-2 capitalize">{key}</label>
                  <input
                    type="text"
                    name={`param_${key}`}
                    value={val as string}
                    onChange={handleChange}
                    className="w-full px-5 py-3 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl outline-none font-mono text-xs"
                  />
                </div>
              )
            ))}
          </div>
        </div>

        <div className="bg-slate-50 p-8 flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-8 py-3 text-slate-400 hover:text-slate-600 font-black uppercase text-xs tracking-widest"
          >
            Cancelar
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-blue-500/20"
          >
            <Save size={18} />
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorModal;
