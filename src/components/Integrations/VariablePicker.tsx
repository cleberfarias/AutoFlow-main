import React, { useState } from 'react';

type VarItem = { path: string; label?: string };

type Props = {
  availableVars?: VarItem[];
  onSelect: (path: string) => void;
};

export default function VariablePicker({ availableVars = [], onSelect }: Props) {
  const [open, setOpen] = useState(false);

  const sample = availableVars.length ? availableVars : [
    { path: 'contact.name', label: 'Contato - Nome' },
    { path: 'contact.phone', label: 'Contato - Telefone' },
    { path: 'message.text', label: 'Mensagem - Texto' },
    { path: 'flow.lastIntent', label: 'Flow - Última intenção' }
  ];

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="px-2 py-1 bg-slate-700 rounded text-xs">{`{ }`}</button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded shadow p-2 z-50">
          <div className="text-xs text-slate-400 mb-2">Variáveis</div>
          <div className="space-y-1 max-h-40 overflow-auto">
            {sample.map(v => (
              <button key={v.path} onClick={() => { onSelect(v.path); setOpen(false); }} className="w-full text-left px-2 py-1 hover:bg-slate-800 rounded text-sm">{v.label || v.path}</button>
            ))}
          </div>
          <div className="text-right mt-2">
            <button onClick={() => setOpen(false)} className="text-xs text-slate-400">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useMemo, useState } from 'react';

type Var = { path: string; label?: string };
type Props = { onSelect: (path: string)=>void; availableVars?: Var[] };

type TreeNode = {
  name: string;
  fullPath: string;
  children?: Record<string, TreeNode>;
  leaf?: boolean;
};

function buildTree(vars: Var[]) {
  const root: TreeNode = { name: '', fullPath: '', children: {} };
  for (const v of vars) {
    const parts = v.path.split('.');
    let cur = root;
    let acc = '';
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      acc = acc ? `${acc}.${p}` : p;
      cur.children = cur.children || {};
      if (!cur.children[p]) cur.children[p] = { name: p, fullPath: acc, children: {} };
      cur = cur.children[p];
      if (i === parts.length - 1) cur.leaf = true;
    }
  }
  return root;
}

function TreeView({ node, onSelect, level = 0 }: { node: TreeNode; onSelect: (p:string)=>void; level?: number }) {
  const [open, setOpen] = useState(level < 1); // expand top-level by default
  const children = node.children ? Object.values(node.children) : [];
  return (
    <div className="text-sm">
      {node.name !== '' && (
        <div className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-700 ${level>0?'ml-2':''}`}>
          {children.length > 0 && (
            <button onClick={() => setOpen(o => !o)} className="w-5 h-5 text-xs bg-slate-700 rounded">{open? '−' : '+'}</button>
          )}
          <div className="flex-1 text-slate-200">{node.name}</div>
          {node.leaf && (
            <button onClick={() => onSelect(node.fullPath)} className="text-xs px-2 py-0.5 bg-teal-600 rounded">Selecionar</button>
          )}
        </div>
      )}
      {open && children.length > 0 && (
        <div className="ml-4">
          {children.map(ch => (
            <TreeView key={ch.fullPath} node={ch} onSelect={onSelect} level={level+1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function VariablePicker({ onSelect, availableVars = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const vars = useMemo(() => {
    if (!availableVars || availableVars.length === 0) return [
      { path: 'contact.name' }, { path: 'contact.phone' }, { path: 'message.text' }, { path: 'flow.lastIntent' }
    ];
    return availableVars;
  }, [availableVars]);

  const filtered = useMemo(() => {
    if (!filter) return vars;
    const q = filter.toLowerCase();
    return vars.filter(v => (v.path + ' ' + (v.label||'')).toLowerCase().includes(q));
  }, [vars, filter]);

  const tree = useMemo(() => buildTree(filtered), [filtered]);

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="w-9 h-9 rounded bg-slate-700 text-slate-200">{`{}`}</button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-900 text-white shadow rounded p-2 z-50 border border-slate-700">
          <input placeholder="Buscar variável..." value={filter} onChange={e=>setFilter(e.target.value)} className="w-full px-2 py-1 rounded bg-slate-800 mb-2 text-sm" />
          <div className="max-h-64 overflow-auto">
            <TreeView node={tree} onSelect={(p)=>{ onSelect(p); setOpen(false); setFilter(''); }} />
          </div>
        </div>
      )}
    </div>
  );
}
