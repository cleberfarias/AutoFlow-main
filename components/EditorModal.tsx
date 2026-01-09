
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
            {Object.entries(formData.params || {}).filter(([k]) => k !== 'api').map(([key, val]) => (
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

            {/* API Integration config */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Integração API (opcional)</h4>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 mb-2">URL</label>
                <input type="text" value={(formData.params?.api as any)?.url || ''} onChange={(e) => setFormData({ ...formData, params: { ...formData.params, api: { ...(formData.params?.api || {}), url: e.target.value } } })} className="w-full px-5 py-3 bg-slate-50 rounded-xl" placeholder="https://api.advbox.com/status" />
              </div>

              <div className="mb-4 flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-2">Método</label>
                  <select value={(formData.params?.api as any)?.method || 'GET'} onChange={(e) => setFormData({ ...formData, params: { ...formData.params, api: { ...(formData.params?.api || {}), method: e.target.value } } })} className="w-full px-4 py-3 rounded-xl bg-slate-50">
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-2">Timeout (ms)</label>
                  <input type="number" value={(formData.params?.api as any)?.timeoutMs || 5000} onChange={(e) => setFormData({ ...formData, params: { ...formData.params, api: { ...(formData.params?.api || {}), timeoutMs: Number(e.target.value) } } })} className="w-full px-4 py-3 rounded-xl bg-slate-50" />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 mb-2">Headers (suporta {'{{SECRET:NAME}}'})</label>
                {(((formData.params?.api as any)?.headers) || []).map((h: any, idx: number) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input type="text" placeholder="Nome" value={h.name} onChange={(e) => {
                      const headers = [...(formData.params?.api?.headers || [])]; headers[idx] = { ...headers[idx], name: e.target.value }; setFormData({ ...formData, params: { ...formData.params, api: { ...(formData.params?.api || {}), headers } } });
                    }} className="w-1/3 px-3 py-2 rounded-xl bg-slate-50" />
                    <input type="text" placeholder="Valor" value={h.value} onChange={(e) => {
                      const headers = [...(formData.params?.api?.headers || [])]; headers[idx] = { ...headers[idx], value: e.target.value }; setFormData({ ...formData, params: { ...formData.params, api: { ...(formData.params?.api || {}), headers } } });
                    }} className="flex-1 px-3 py-2 rounded-xl bg-slate-50" />
                    <button onClick={() => { const headers = [...(formData.params?.api?.headers || [])]; headers.splice(idx,1); setFormData({ ...formData, params: { ...formData.params, api: { ...(formData.params?.api || {}), headers } } }); }} className="px-3 py-2 bg-rose-50 text-rose-500 rounded-xl">Remover</button>
                  </div>
                ))}
                <button onClick={() => { const headers = [...(formData.params?.api?.headers || [])]; headers.push({ name: '', value: '' }); setFormData({ ...formData, params: { ...formData.params, api: { ...(formData.params?.api || {}), headers } } }); }} className="text-sm text-blue-600 font-bold">+ Adicionar header</button>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 mb-2">Body Template (JSON) <span className="text-[10px] text-slate-400">{'suporta {{var}} e {{SECRET:NAME}}'}</span></label>
                <textarea value={(formData.params?.api as any)?.bodyTemplate || ''} onChange={(e) => setFormData({ ...formData, params: { ...formData.params, api: { ...(formData.params?.api || {}), bodyTemplate: e.target.value } } })} rows={6} className="w-full px-4 py-3 bg-slate-50 rounded-xl font-mono text-xs" placeholder='{"cpf":"{{cpf}}"}' />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 mb-2">Autenticação</label>
                <div className="flex gap-2 items-center">
                  <select value={(formData.params?.api as any)?.auth?.type || 'none'} onChange={(e) => setFormData({ ...formData, params: { ...formData.params, api: { ...(formData.params?.api || {}), auth: { ...(formData.params?.api?.auth || {}), type: e.target.value } } } })} className="px-4 py-2 rounded-xl bg-slate-50">
                    <option value="none">Sem autenticação</option>
                    <option value="bearer">Bearer Token (recomendado)</option>
                    <option value="apiKey">API Key</option>
                    <option value="basic">Basic</option>
                  </select>
                  <input type="text" placeholder="secretRef (ex: ADVBOX_KEY)" value={(formData.params?.api as any)?.auth?.secretRef || ''} onChange={(e) => setFormData({ ...formData, params: { ...formData.params, api: { ...(formData.params?.api || {}), auth: { ...(formData.params?.api?.auth || {}), secretRef: e.target.value } } } })} className="flex-1 px-3 py-2 rounded-xl bg-slate-50" />
                </div>
                <div className="text-[11px] text-slate-400 mt-2">Observação: insira o nome da variável de ambiente onde o segredo está salvo no servidor (ex: ADVBOX_KEY). O servidor substituirá <code>{'{{SECRET:ADVBOX_KEY}}'}</code> automaticamente ao executar a chamada.</div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 mb-2">Mapeamento de Resposta → Outputs</label>
                {(((formData.params?.api as any)?.responseMapping) || []).map((m: any, idx: number) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input type="text" placeholder="json.path (ex: data.status)" value={m.jsonPath} onChange={(e) => { const mapping = [...(formData.params?.api?.responseMapping || [])]; mapping[idx] = { ...mapping[idx], jsonPath: e.target.value }; setFormData({ ...formData, params: { ...formData.params, api: { ...(formData.params?.api || {}), responseMapping: mapping } } }); }} className="w-1/2 px-3 py-2 rounded-xl bg-slate-50" />
                    <input type="text" placeholder="output key (ex: andamento)" value={m.outputKey} onChange={(e) => { const mapping = [...(formData.params?.api?.responseMapping || [])]; mapping[idx] = { ...mapping[idx], outputKey: e.target.value }; setFormData({ ...formData, params: { ...formData.params, api: { ...(formData.params?.api || {}), responseMapping: mapping } } }); }} className="flex-1 px-3 py-2 rounded-xl bg-slate-50" />
                    <button onClick={() => { const mapping = [...(formData.params?.api?.responseMapping || [])]; mapping.splice(idx,1); setFormData({ ...formData, params: { ...formData.params, api: { ...(formData.params?.api || {}), responseMapping: mapping } } }); }} className="px-3 py-2 bg-rose-50 text-rose-500 rounded-xl">Remover</button>
                  </div>
                ))}
                <button onClick={() => { const mapping = [...(formData.params?.api?.responseMapping || [])]; mapping.push({ jsonPath: '', outputKey: '' }); setFormData({ ...formData, params: { ...formData.params, api: { ...(formData.params?.api || {}), responseMapping: mapping } } }); }} className="text-sm text-blue-600 font-bold">+ Adicionar mapeamento</button>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button onClick={async () => {
                  // Testar chamada via proxy
                  try {
                    const api = formData.params?.api as any;
                    if (!api || !api.url) throw new Error('Configure a URL primeiro');
                    const res = await fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api, variables: {} }) });
                    const json = await res.json();
                    if (!res.ok) throw new Error(json?.message || JSON.stringify(json));
                    // persist success flag and save
                    const updated = { ...formData, params: { ...formData.params, api: { ...(formData.params?.api || {}), lastTestSuccess: true } } } as WorkflowStep;
                    onSave(updated);
                    alert('Resposta de teste: ' + (typeof json.body === 'string' ? json.body : JSON.stringify(json.body)));
                  } catch (err: any) {
                    alert('Erro no teste: ' + (err?.message || String(err)));
                  }
                }} className="px-4 py-2 bg-slate-100 rounded-xl">Testar chamada</button>
              </div>
            </div>
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
