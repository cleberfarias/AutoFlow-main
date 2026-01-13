import React, { useState } from 'react';
import { Zap, Brain, GitBranch, TrendingUp, Settings, Plus, Edit2, Trash2, Play } from 'lucide-react';

interface RoutingRule {
  id: string;
  name: string;
  type: 'ai' | 'traditional';
  description: string;
  model?: string;
  usageCount: number;
  successRate: number;
  avgResponseTime: number;
  isActive: boolean;
}

export default function AIRoutingPage() {
  const [rules, setRules] = useState<RoutingRule[]>([
    {
      id: '1',
      name: 'Suporte Premium',
      type: 'ai',
      description: 'Roteia clientes VIP automaticamente para atendentes sênior',
      model: 'gpt-4o',
      usageCount: 156,
      successRate: 94.5,
      avgResponseTime: 1.2,
      isActive: true
    },
    {
      id: '2',
      name: 'Urgência Alta',
      type: 'traditional',
      description: 'Identifica tickets urgentes com base em palavras-chave',
      usageCount: 89,
      successRate: 87.3,
      avgResponseTime: 0.3,
      isActive: true
    },
    {
      id: '3',
      name: 'Classificação de Produtos',
      type: 'ai',
      description: 'Direciona dúvidas para especialistas do produto correto',
      model: 'gpt-4o-mini',
      usageCount: 234,
      successRate: 91.2,
      avgResponseTime: 0.8,
      isActive: false
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const stats = {
    totalRules: rules.length,
    activeRules: rules.filter(r => r.isActive).length,
    totalRouted: rules.reduce((sum, r) => sum + r.usageCount, 0),
    avgSuccessRate: rules.reduce((sum, r) => sum + r.successRate, 0) / rules.length || 0
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl">
              <Zap size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">AI Routing</h1>
              <p className="text-slate-400">Gerencie regras de roteamento inteligente</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-fuchsia-500/20 transition-all"
          >
            <Plus size={20} />
            Nova Regra
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <GitBranch size={20} className="text-blue-400" />
              </div>
              <span className="text-slate-400 text-sm">Total de Regras</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalRules}</div>
            <div className="text-sm text-emerald-400 mt-1">{stats.activeRules} ativas</div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp size={20} className="text-purple-400" />
              </div>
              <span className="text-slate-400 text-sm">Roteamentos</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalRouted}</div>
            <div className="text-sm text-slate-400 mt-1">Total processado</div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Brain size={20} className="text-emerald-400" />
              </div>
              <span className="text-slate-400 text-sm">Taxa de Sucesso</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.avgSuccessRate.toFixed(1)}%</div>
            <div className="text-sm text-emerald-400 mt-1">Média geral</div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-fuchsia-500/10 rounded-lg">
                <Zap size={20} className="text-fuchsia-400" />
              </div>
              <span className="text-slate-400 text-sm">Regras IA</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {rules.filter(r => r.type === 'ai').length}
            </div>
            <div className="text-sm text-slate-400 mt-1">Com LLM</div>
          </div>
        </div>

        {/* Rules List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Regras de Roteamento</h2>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
                Todos
              </button>
              <button className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
                Ativos
              </button>
              <button className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
                Inativos
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-700">
            {rules.map(rule => (
              <div key={rule.id} className="p-6 hover:bg-slate-750 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        rule.type === 'ai' 
                          ? 'bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20' 
                          : 'bg-blue-500/20'
                      }`}>
                        {rule.type === 'ai' ? (
                          <Brain size={20} className="text-fuchsia-400" />
                        ) : (
                          <GitBranch size={20} className="text-blue-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{rule.name}</h3>
                        <p className="text-sm text-slate-400">{rule.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {rule.isActive ? (
                          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
                            Ativo
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-slate-600/50 text-slate-400 text-xs font-medium rounded-full">
                            Inativo
                          </span>
                        )}
                        {rule.type === 'ai' && (
                          <span className="px-3 py-1 bg-fuchsia-500/20 text-fuchsia-400 text-xs font-medium rounded-full">
                            {rule.model}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mt-4">
                      <div>
                        <div className="text-slate-400 text-xs mb-1">Usos</div>
                        <div className="text-white font-semibold">{rule.usageCount}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs mb-1">Taxa de Sucesso</div>
                        <div className="text-emerald-400 font-semibold">{rule.successRate}%</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs mb-1">Tempo Médio</div>
                        <div className="text-blue-400 font-semibold">{rule.avgResponseTime}s</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-6">
                    <button
                      className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                      title="Testar regra"
                    >
                      <Play size={18} />
                    </button>
                    <button
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-gradient-to-r from-fuchsia-500/10 to-purple-500/10 border border-fuchsia-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-fuchsia-500/20 rounded-xl">
              <Brain size={24} className="text-fuchsia-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Como funcionam as Regras de IA?</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">
                As regras de AI Routing utilizam modelos de linguagem (LLM) para tomar decisões inteligentes 
                baseadas no contexto completo da conversa, não apenas em palavras-chave. Isso permite roteamento 
                muito mais preciso e adaptável.
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>• Análise semântica avançada</span>
                <span>• Aprendizado contínuo</span>
                <span>• Múltiplos modelos OpenAI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">Nova Regra de Roteamento</h2>
            <p className="text-slate-400 mb-6">
              Para criar regras de roteamento, vá para a página <strong>Workflows</strong> e adicione 
              um nó <strong>AI Routing</strong> ao seu fluxo.
            </p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
