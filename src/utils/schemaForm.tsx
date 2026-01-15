import React from 'react';
import VariablePicker from '../components/Integrations/VariablePicker';

type Props = {
  schema: any;
  value: any;
  onChange: (v:any)=>void;
};

export default function SchemaForm({ schema, value = {}, onChange }: Props) {
  if (!schema || !schema.properties) return <div className="text-sm text-slate-400">Sem campos</div>;
  const keys = Object.keys(schema.properties || {});
  return (
    <div className="space-y-3">
      {keys.map(k => {
        const prop = schema.properties[k];
        const val = value[k] ?? '';
        return (
          <div key={k} className="flex items-start gap-2">
            <div className="flex-1">
              <label className="text-sm text-slate-300 block mb-1 font-medium">{prop.title || k}</label>
              <input
                className="w-full px-3 py-2 rounded bg-slate-800 text-white border border-slate-700"
                value={typeof val === 'string' ? val : JSON.stringify(val)}
                onChange={e => onChange({ ...value, [k]: e.target.value })}
                placeholder={prop.placeholder || ''}
              />
            </div>
            <div className="w-10 mt-6">
              <VariablePicker onSelect={p=> onChange({ ...value, [k]: { type:'var', path: p } })} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
