import React, { useState } from 'react';
import { GitBranch, Plus, Trash2, Sparkles, Settings, X } from 'lucide-react';
import { WorkflowStep } from '../types';

interface AIRoutingNodeProps {
  step: WorkflowStep;
  onUpdate: (updated: WorkflowStep) => void;
  onClose: () => void;
}

interface RoutingRule {
  id: string;
  condition: string;
  description: string;
  nextStepId?: string;
  useAI: boolean;
  aiPrompt?: string;
}

export default function AIRoutingNode({ step, onUpdate, onClose }: AIRoutingNodeProps) {
  const [rules, setRules] = useState<RoutingRule[]>(
    step.params?.routingRules || [
      { id: '1', condition: '', description: 'Rota padrão', useAI: false }
    ]
  );
  
  const [aiModel, setAiModel] = useState(step.params?.aiModel || 'gpt-4o-mini');
  const [fallbackRoute, setFallbackRoute] = useState(step.params?.fallbackRoute || 'continue');
  const [confidenceThreshold, setConfidenceThreshold] = useState(step.params?.confidenceThreshold || 0.7);

  const addRule = () => {
    const newRule: RoutingRule = {
      id: Date.now().toString(),
      condition: '',
      description: `Rota ${rules.length + 1}`,
      useAI: false
    };
    setRules([...rules, newRule]);
  };

  const removeRule = (id: string) => {
    if (rules.length > 1) {
      setRules(rules.filter(r => r.id !== id));
    }
  };

  const updateRule = (id: string, updates: Partial<RoutingRule>) => {
    setRules(rules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleSave = () => {
    const updated = {
      ...step,
      params: {
        ...step.params,
        routingRules: rules,
        aiModel,
        fallbackRoute,
        confidenceThreshold
      }
    };
    onUpdate(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border-2 border-teal-500/30">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-750">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <GitBranch className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Routing</h2>
              <p className="text-sm text-slate-400">Roteamento inteligente baseado em IA</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
          
          {/* Configurações Globais */}
          <div className="bg-slate-750 rounded-xl p-5 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Settings size={18} className="text-teal-400" />
              Configurações do AI Routing
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Modelo de IA
                </label>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                >
                  <option value="gpt-4o-mini">GPT-4O Mini (Rápido)</option>
                  <option value="gpt-4o">GPT-4O (Preciso)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Econômico)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Confiança Mínima
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
                <p className="text-[10px] text-slate-500 mt-1">{(confidenceThreshold * 100).toFixed(0)}% de confiança</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Rota Fallback
                </label>
                <select
                  value={fallbackRoute}
                  onChange={(e) => setFallbackRoute(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                >
                  <option value="continue">Continuar Fluxo</option>
                  <option value="end">Encerrar</option>
                  <option value="human">Transferir para Humano</option>
                  <option value="default">Rota Padrão</option>
                </select>
              </div>
            </div>
          </div>

          {/* Regras de Roteamento */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" />
                Regras de Roteamento
              </h3>
              <button
                onClick={addRule}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-sm transition-colors"
              >
                <Plus size={16} /> Nova Rota
              </button>
            </div>

            <div className="space-y-4">
              {rules.map((rule, idx) => (
                <div key={rule.id} className="bg-slate-750 rounded-xl p-5 border-2 border-slate-700 hover:border-slate-600 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        value={rule.description}
                        onChange={(e) => updateRule(rule.id, { description: e.target.value })}
                        placeholder="Descrição da rota"
                        className="bg-transparent border-none text-white font-semibold text-lg outline-none focus:text-teal-400 transition-colors"
                      />
                    </div>
                    {rules.length > 1 && (
                      <button
                        onClick={() => removeRule(rule.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Toggle AI */}
                  <div className="mb-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.useAI}
                        onChange={(e) => updateRule(rule.id, { useAI: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-600 text-teal-600 focus:ring-teal-500 focus:ring-offset-slate-800"
                      />
                      <span className="text-sm font-semibold text-slate-300">
                        Usar IA para decidir esta rota
                      </span>
                      {rule.useAI && (
                        <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs font-bold rounded-full">
                          AI-POWERED
                        </span>
                      )}
                    </label>
                  </div>

                  {rule.useAI ? (
                    // Prompt para IA
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                        Prompt para IA
                      </label>
                      <textarea
                        value={rule.aiPrompt || ''}
                        onChange={(e) => updateRule(rule.id, { aiPrompt: e.target.value })}
                        placeholder="Ex: Analise a mensagem do usuário e retorne 'sim' se mencionar problemas técnicos, 'não' caso contrário"
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all resize-none font-mono"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        💡 A IA analisará o contexto e decidirá se deve seguir esta rota
                      </p>
                    </div>
                  ) : (
                    // Condição tradicional
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                        Condição (JavaScript)
                      </label>
                      <input
                        type="text"
                        value={rule.condition}
                        onChange={(e) => updateRule(rule.id, { condition: e.target.value })}
                        placeholder="Ex: message.includes('urgente') || priority === 'high'"
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all font-mono"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        💡 Use variáveis do contexto: message, user, intent, etc.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <h4 className="text-sm font-bold text-blue-400 mb-2">Como funciona o AI Routing?</h4>
            <ul className="text-xs text-slate-300 space-y-1.5">
              <li>• <strong>Regras tradicionais:</strong> Avaliadas por ordem, primeira que der match executa</li>
              <li>• <strong>Regras com IA:</strong> LLM analisa contexto e decide se a rota se aplica</li>
              <li>• <strong>Confiança:</strong> IA só escolhe rota se confiança {'>'} threshold definido</li>
              <li>• <strong>Fallback:</strong> Se nenhuma rota der match, usa a rota fallback configurada</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700 bg-slate-750">
          <div className="text-xs text-slate-400">
            {rules.filter(r => r.useAI).length} rotas com IA • {rules.length} rotas totais
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg transition-all"
            >
              Salvar Configuração
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
