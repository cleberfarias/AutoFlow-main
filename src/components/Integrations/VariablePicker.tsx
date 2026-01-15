import React, { useState } from 'react';

type Props = { onSelect: (path: string)=>void };

const SAMPLE_VARS = [
  { path: 'contact.name', label: 'contact.name' },
  { path: 'contact.phone', label: 'contact.phone' },
  { path: 'message.text', label: 'message.text' },
  { path: 'flow.lastIntent', label: 'flow.lastIntent' }
];

export default function VariablePicker({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={()=>setOpen(v=>!v)} className="w-9 h-9 rounded bg-slate-700 text-slate-200">{`{}`}</button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 shadow rounded p-2 z-50">
          <div className="text-xs text-slate-500 mb-2">Variáveis</div>
          {SAMPLE_VARS.map(v=> (
            <button key={v.path} onClick={()=>{ onSelect(v.path); setOpen(false); }} className="block w-full text-left px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">{v.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
