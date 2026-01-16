import React, { useEffect, useState } from 'react';
import VariablePicker from '../components/Integrations/VariablePicker';

type Binding = { type: 'literal'; value: any } | { type: 'var'; path: string };

type Props = {
  schema?: any;
  value?: Record<string, any>;
  onChange: (v: Record<string, any>) => void;
  availableVars?: { path: string; label?: string }[];
};

function asBinding(v: any): Binding {
  if (v && typeof v === 'object' && (v.type === 'var' || v.type === 'literal')) return v;
  return { type: 'literal', value: v };
}

export default function SchemaForm({ schema, value = {}, onChange, availableVars = [] }: Props) {
  const [internal, setInternal] = useState<Record<string, any>>({});

  useEffect(() => {
    // initialize from value or defaults
    const props = (schema && schema.properties) ? Object.keys(schema.properties) : [];
    const init: Record<string, any> = {};
    props.forEach((p: string) => {
      const v = value[p];
      init[p] = asBinding(v);
    });
    setInternal(init);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema]);

  function setField(key: string, binding: Binding) {
    const next = { ...internal, [key]: binding };
    setInternal(next);
    // convert to external representation: keep bindings as-is
    const out: Record<string, any> = {};
    Object.keys(next).forEach(k => { out[k] = next[k]; });
    onChange(out);
  }

  if (!schema || !schema.properties) return <div className="text-sm text-slate-400">Nenhum campo para configurar.</div>;

  return (
    <div className="space-y-3">
      {Object.entries(schema.properties).map(([key, def]: any) => {
        const binding: Binding = internal[key] || { type: 'literal', value: '' };
        const isVar = binding.type === 'var';
        const display = isVar ? `{{${binding.path}}}` : (binding.value ?? '');

        const renderInput = () => {
          const t = def.type;
          if (def.enum) {
            return (
              <select value={isVar ? display : binding.value} onChange={e => setField(key, { type: 'literal', value: e.target.value })} className="w-full rounded px-2 py-1 bg-slate-800">
                <option value="">--</option>
                {def.enum.map((v: any) => <option key={v} value={v}>{String(v)}</option>)}
              </select>
            );
          }
          if (def.format === 'date-time') {
            return <input type="datetime-local" value={isVar ? '' : binding.value || ''} onChange={e=>setField(key, { type: 'literal', value: e.target.value })} className="w-full rounded px-2 py-1 bg-slate-800" />;
          }
          if (t === 'string') {
            if ((def.widget||'').toLowerCase() === 'textarea' || (def.maxLength && def.maxLength > 200)) {
              return <textarea value={isVar ? '' : binding.value || ''} onChange={e=>setField(key, { type: 'literal', value: e.target.value })} className="w-full rounded px-2 py-1 bg-slate-800 h-24" />;
            }
            return <input value={isVar ? '' : binding.value || ''} onChange={e=>setField(key, { type: 'literal', value: e.target.value })} className="w-full rounded px-2 py-1 bg-slate-800" />;
          }
          if (t === 'number' || t === 'integer') {
            return <input type="number" value={isVar ? '' : binding.value || ''} onChange={e=>setField(key, { type: 'literal', value: e.target.value ? Number(e.target.value) : '' })} className="w-full rounded px-2 py-1 bg-slate-800" />;
          }
          if (t === 'boolean') {
            return (
              <select value={isVar ? '' : (binding.value ? 'true' : 'false')} onChange={e=>setField(key, { type: 'literal', value: e.target.value === 'true' })} className="w-full rounded px-2 py-1 bg-slate-800">
                <option value="">--</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            );
          }
          // fallback
          return <input value={isVar ? '' : binding.value || ''} onChange={e=>setField(key, { type: 'literal', value: e.target.value })} className="w-full rounded px-2 py-1 bg-slate-800" />;
        };

        return (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-sm font-medium">{def.title || key}{schema.required && schema.required.includes(key) ? ' *' : ''}</label>
            <div className="flex gap-2">
              <div className="flex-1">{renderInput()}</div>
              <div className="w-36 flex items-center justify-end gap-2">
                <div className="text-xs text-slate-400 truncate">{isVar ? `Variável: ${binding.path}` : ''}</div>
                <VariablePicker availableVars={availableVars} onSelect={(path)=>setField(key, { type: 'var', path })} />
              </div>
            </div>
            {def.description && <div className="text-xs text-slate-400">{def.description}</div>}
          </div>
        );
      })}
    </div>
  );
}
