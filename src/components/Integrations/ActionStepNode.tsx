import React, { useState } from 'react';
import manifest from '../../integrations/manifest';
import SchemaForm from '../../utils/schemaForm';
import { WorkflowStep } from '../../../types';

type Props = {
  node: WorkflowStep;
  availableVars?: { path: string; label?: string }[];
};

function resolveBinding(binding: any, ctx: Record<string, any>) {
  if (!binding) return null;
  if (binding.type === 'literal') return binding.value;
  if (binding.type === 'var') return ctx[binding.path] ?? `{{${binding.path}}}`;
  return binding;
}

export default function ActionStepNode({ node, availableVars = [] }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const actionDef = node.params?.action;
  const toolName = actionDef?.toolName;
  const service = actionDef?.service;
  const argsMapping = actionDef?.argsMapping || {};

  const toolDef = manifest.tools.find(t => t.name === toolName) || manifest.tools.find(t => t.serviceId === service && t.name === actionDef?.action);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    // build mock context
    const mockCtx: Record<string, any> = {
      'contact.name': 'João Silva',
      'contact.phone': '+5511999999999',
      'message.text': 'Olá, preciso agendar',
      'flow.lastIntent': 'agendamento'
    };

    // resolve args
    const resolved: Record<string, any> = {};
    for (const k of Object.keys(argsMapping)) {
      resolved[k] = resolveBinding(argsMapping[k], mockCtx);
    }

    // mock response
    await new Promise(r => setTimeout(r, 300));
    const mockResponse = { ok: true, tool: toolName, resolved };
    setTestResult({ request: resolved, response: mockResponse, timeMs: 300 });
    setTesting(false);
  }

  return (
    <div className="bg-slate-900 text-white rounded p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold">Executar Ação</div>
          <div className="text-sm text-slate-400">{actionDef?.action} — {service}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleTest} className="px-3 py-1 bg-emerald-600 rounded" disabled={testing}>{testing ? 'Testando...' : 'Testar'}</button>
          <button onClick={()=>setShowAdvanced(s=>!s)} className="px-3 py-1 bg-slate-700 rounded">{showAdvanced ? 'Fechar JSON' : 'Avançado (JSON)'}</button>
        </div>
      </div>

      <div className="mt-3">
        {toolDef?.inputSchema ? (
          <SchemaForm schema={toolDef.inputSchema} value={argsMapping} onChange={() => {}} availableVars={availableVars} />
        ) : (
          <div className="text-slate-400 text-sm">Nenhum schema disponível para esta ação.</div>
        )}
      </div>

      {showAdvanced && (
        <pre className="mt-3 p-2 bg-slate-800 rounded text-xs overflow-auto">{JSON.stringify(actionDef, null, 2)}</pre>
      )}

      {testResult && (
        <div className="mt-3 bg-slate-800 p-2 rounded">
          <div className="text-xs text-slate-400">Request</div>
          <pre className="text-sm">{JSON.stringify(testResult.request, null, 2)}</pre>
          <div className="text-xs text-slate-400 mt-2">Response</div>
          <pre className="text-sm">{JSON.stringify(testResult.response, null, 2)}</pre>
          <div className="text-xs text-slate-400 mt-2">Tempo: {testResult.timeMs}ms</div>
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import manifest from '../../integrations/manifest';

type Props = { node: any; onUpdate?: (n:any)=>void; onEdit?: (n:any)=>void; onDelete?: ()=>void };

export default function ActionStepNode({ node, onUpdate, onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(true);
  const [resp, setResp] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const action = manifest.actions.find(a=> a.id === node.params?.mcp?.action);
  const service = manifest.services.find(s=> s.id === node.params?.mcp?.service);

  async function testAction(){
    setLoading(true);
    setResp(null);
    setError(null);
    try {
      const start = Date.now();
      const toolName = node.params?.mcp?.toolName || node.params?.mcp?.action;
      const args = node.params?.mcp?.params || {};
      const payload = { toolName, args, mockContext: { contact: { name: 'João Silva', phone: '+551199999999' }, message: { text: 'Olá' } } };

      const r = await fetch('/api/tools/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const json = await r.json().catch(()=>null);
      const durationMs = Date.now() - start;

      if (!r.ok) {
        setError(json?.error || `HTTP ${r.status}`);
      } else {
        const sample = json?.response || json;
        setResp({ request: payload, response: sample, durationMs });
        // persist sample into node so VariablePicker can read real outputs
        const next = {
          ...node,
          params: {
            ...(node.params || {}),
            mcp: {
              ...(node.params?.mcp || {}),
              outputSample: sample
            }
          }
        };
        if (onUpdate) onUpdate(next);
        else if (onEdit) onEdit(next);
      }
    } catch (e:any) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function onFieldChange(k:any, v:any){
    const next = { 
      ...node, 
      params: {
        ...(node.params || {}),
        mcp: {
          ...(node.params?.mcp || {}),
          params: { ...(node.params?.mcp?.params || {}), [k]: v }
        }
      }
    };
    if (onUpdate) onUpdate(next);
    else if (onEdit) onEdit(next);
  }

  return (
    <div className="bg-slate-800 p-4 rounded border border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold">Executar Ação</div>
          <div className="text-xs text-slate-400">{action?.title} — {service?.title}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>testAction()} disabled={loading} className="px-3 py-1 bg-teal-600 rounded text-xs disabled:opacity-60">
            {loading ? 'Testando...' : 'Testar'}
          </button>
          <button onClick={()=>setOpen(o=>!o)} className="px-2 py-1 bg-slate-700 rounded text-xs">{open? 'Fechar':'Abrir'}</button>
        </div>
      </div>
      {open && (
        <div className="mt-3">
          <div className="text-sm text-slate-300 mb-2">Campos</div>
          {Object.keys(node.params?.mcp?.params || {}).length === 0 && (
            <div className="text-xs text-slate-400">Sem campos configurados</div>
          )}
          {Object.entries(node.params?.mcp?.params || {}).map(([k,v])=> (
            <div key={k} className="flex items-center gap-2 mb-2">
              <div className="w-40 text-slate-300 text-sm">{k}</div>
              <input value={typeof v === 'object' ? JSON.stringify(v) : String(v || '')} onChange={e=> onFieldChange(k, e.target.value)} className="flex-1 px-2 py-1 rounded bg-slate-700 text-white" />
            </div>
          ))}

          {error && (
            <div className="mt-3 bg-rose-900 p-3 rounded">
              <div className="text-xs text-rose-200">Erro</div>
              <pre className="text-xs text-rose-100 bg-rose-800 p-2 rounded">{error}</pre>
            </div>
          )}

          {resp && (
            <div className="mt-3 bg-slate-900 p-3 rounded">
              <div className="text-xs text-slate-400">Request</div>
              <pre className="text-xs text-slate-200 bg-slate-800 p-2 rounded">{JSON.stringify(resp.request,null,2)}</pre>
              <div className="text-xs text-slate-400 mt-2">Response</div>
              <pre className="text-xs text-slate-200 bg-slate-800 p-2 rounded">{JSON.stringify(resp.response,null,2)}</pre>
              <div className="text-xs text-slate-400 mt-2">Tempo: {resp.durationMs} ms</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
