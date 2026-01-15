import React, { useState } from 'react';
import manifest from '../../integrations/manifest';

type Props = { node: any; onUpdate: (n:any)=>void };

export default function ActionStepNode({ node, onUpdate }: Props) {
  const [open, setOpen] = useState(true);
  const [mockResp, setMockResp] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const action = manifest.actions.find(a=> a.id === node.actionId);
  const service = manifest.services.find(s=> s.id === node.serviceId);

  async function testAction(){
    setLoading(true); setMockResp(null);
    const start = Date.now();
    // resolve args mapping (mock): replace variables with example values
    const resolved = {};
    for(const k of Object.keys(node.argsMapping || {})){
      const v = node.argsMapping[k];
      if (v && v.type === 'var') resolved[k] = `{{${v.path}}}`;
      else resolved[k] = v;
    }
    // fake response
    await new Promise(r=> setTimeout(r, 400));
    const resp = { ok: true, data: { example: 'result' }, durationMs: Date.now()-start, request: resolved };
    setMockResp(resp);
    setLoading(false);
  }

  function onFieldChange(k:any, v:any){
    const next = { ...node, argsMapping: { ...(node.argsMapping || {}), [k]: v } };
    onUpdate(next);
  }

  return (
    <div className="bg-slate-800 p-4 rounded border border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold">Executar Ação</div>
          <div className="text-xs text-slate-400">{action?.title} — {service?.title}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>testAction()} className="px-3 py-1 bg-teal-600 rounded text-xs">Testar</button>
          <button onClick={()=>setOpen(o=>!o)} className="px-2 py-1 bg-slate-700 rounded">{open? 'Fechar':'Abrir'}</button>
        </div>
      </div>
      {open && (
        <div className="mt-3">
          <div className="text-sm text-slate-300 mb-2">Campos</div>
          {Object.keys(node.argsMapping || {}).length === 0 && (
            <div className="text-xs text-slate-400">Sem campos configurados</div>
          )}
          {Object.entries(node.argsMapping || {}).map(([k,v])=> (
            <div key={k} className="flex items-center gap-2 mb-2">
              <div className="w-40 text-slate-300 text-sm">{k}</div>
              <input value={typeof v === 'object' ? JSON.stringify(v) : String(v)} onChange={e=> onFieldChange(k, e.target.value)} className="flex-1 px-2 py-1 rounded bg-slate-700 text-white" />
            </div>
          ))}

          {mockResp && (
            <div className="mt-3 bg-slate-900 p-3 rounded">
              <div className="text-xs text-slate-400">Request</div>
              <pre className="text-xs text-slate-200 bg-slate-800 p-2 rounded">{JSON.stringify(mockResp.request,null,2)}</pre>
              <div className="text-xs text-slate-400 mt-2">Response</div>
              <pre className="text-xs text-slate-200 bg-slate-800 p-2 rounded">{JSON.stringify(mockResp.data,null,2)}</pre>
              <div className="text-xs text-slate-400 mt-2">Tempo: {mockResp.durationMs} ms</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
