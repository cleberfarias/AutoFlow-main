import React, { useMemo, useState } from 'react';
import store from '../../store/integrationsStore';
import manifest from '../../integrations/manifest';
import SchemaForm from '../../utils/schemaForm';
import { StepType } from '../../../types';

type Props = { isOpen:boolean; onClose:()=>void; onAdd: (node:any)=>void };

export default function AddActionModal({ isOpen, onClose, onAdd }: Props) {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [formValue, setFormValue] = useState<any>({});

  const actions = useMemo(()=>{
    const q = query.toLowerCase();
    let list = manifest.actions;
    if (q) list = list.filter(a=> a.title.toLowerCase().includes(q) || (a.description||'').toLowerCase().includes(q));
    return list;
  },[query]);

  const categories = store.listCategories();

  function chooseAction(a:any){ setSelectedAction(a); setStep(2); }
  function chooseService(s:any){ setSelectedService(s); setStep(3); }

  function finish(){
    if(!selectedAction || !selectedService) return alert('Selecione ação e serviço');
    const toolDef = manifest.tools.find(t=> t.name === selectedAction.id && t.serviceId===selectedService.id) || manifest.tools.find(t=> t.serviceId===selectedService.id);
    const node = {
      id: `mcp-${Date.now()}`,
      type: StepType.MCP,
      title: `Executar Ação — ${selectedAction.title}`,
      description: selectedAction.description || '',
      params: {
        mcp: {
          service: selectedService.id,
          action: selectedAction.id,
          toolName: toolDef?.name || selectedAction.id,
          params: formValue
        }
      },
      position: { x: 400, y: 300 }
    };
    // push recent
    store.pushRecent(selectedService.id);
    onAdd(node);
    onClose();
  }

  if(!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="w-[900px] bg-slate-900 rounded p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Adicionar Ação (Integração)</h3>
          <button onClick={onClose} className="text-slate-400">Fechar</button>
        </div>
        <div className="mb-4">
          <input placeholder="O que você quer fazer? (ex: agendar, cobrar, enviar mensagem)" value={query} onChange={e=>setQuery(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" />
        </div>
        <div className="flex gap-6">
          <div className="w-1/2">
            {step===1 && (
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap mb-2">
                  {categories.map(c=> <span key={c} className="px-2 py-1 bg-slate-800 rounded text-xs">{c}</span>)}
                </div>
                {actions.map(a=> (
                  <button key={a.id} onClick={()=>chooseAction(a)} className="w-full text-left px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded mb-2">
                    <div className="font-semibold">{a.title}</div>
                    <div className="text-xs text-slate-400">{a.description}</div>
                  </button>
                ))}
              </div>
            )}
            {step===2 && selectedAction && (
              <div>
                <h4 className="font-bold mb-2">Escolha o serviço para: {selectedAction.title}</h4>
                <div className="space-y-2">
                  {manifest.services.filter(s=> selectedAction.serviceIds.includes(s.id)).map(s=> (
                    <div key={s.id} className="flex items-center justify-between bg-slate-800 p-3 rounded">
                      <div>
                        <div className="font-semibold">{s.title}</div>
                        <div className="text-xs text-slate-400">{s.category}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={()=>chooseService(s)} className="px-3 py-1 bg-teal-600 rounded">Escolher</button>
                        <button onClick={()=>store.toggleFavorite(s.id)} className="px-2 py-1 bg-slate-700 rounded text-xs">☆</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {step===3 && selectedService && (
              <div>
                <h4 className="font-bold mb-2">Configurar campos — {selectedService.title}</h4>
                <div className="mb-3">
                  <SchemaForm schema={manifest.tools.find(t=> t.serviceId===selectedService.id && t.name===selectedAction.id)?.inputSchema || manifest.tools.find(t=> t.serviceId===selectedService.id)?.inputSchema} value={formValue} onChange={setFormValue} />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={()=>setStep(2)} className="px-4 py-2 bg-slate-700 rounded">Voltar</button>
                  <button onClick={finish} className="px-4 py-2 bg-teal-600 rounded">Adicionar Ação ao Flow</button>
                </div>
              </div>
            )}
          </div>
          <div className="w-1/2 bg-slate-800 p-4 rounded">
            <div className="text-sm text-slate-400 mb-2">Preview / Ajuda</div>
            {selectedAction ? (
              <div>
                <div className="font-semibold">Ação: {selectedAction.title}</div>
                <div className="text-xs text-slate-400">{selectedAction.description}</div>
                <div className="mt-3">
                  <div className="text-xs text-slate-400 mb-1">Serviços suportados</div>
                  {selectedAction.serviceIds.map((id:string)=> {
                    const s = manifest.services.find(ss=> ss.id===id);
                    return <div key={id} className="px-2 py-1 bg-slate-700 rounded inline-block mr-2 mb-2">{s?.title}</div>;
                  })}
                </div>
              </div>
            ) : (
              <div className="text-slate-400">Escolha o que quer fazer primeiro. Você pode pesquisar por 'agendar', 'cobrar', 'ticket'.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
