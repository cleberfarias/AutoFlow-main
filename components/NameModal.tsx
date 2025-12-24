
import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Tag } from 'lucide-react';

interface NameModalProps {
  title: string;
  placeholder: string;
  defaultValue?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

const NameModal: React.FC<NameModalProps> = ({ title, placeholder, defaultValue = '', isOpen, onClose, onConfirm }) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Tag size={20} />
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 pt-4 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome identificador</label>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && value.trim() && onConfirm(value.trim())}
              placeholder={placeholder}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 transition-all shadow-inner"
            />
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={() => value.trim() && onConfirm(value.trim())}
              disabled={!value.trim()}
              className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all"
            >
              <Check size={16} strokeWidth={3} /> Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NameModal;
