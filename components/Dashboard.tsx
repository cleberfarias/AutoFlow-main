import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Clock, Zap, BarChart3 } from 'lucide-react';

interface DashboardProps {
  clients: any[];
  workflows: any[];
  onCreateWorkflow?: () => void;
}

export default function Dashboard({ clients, workflows, onCreateWorkflow }: DashboardProps) {
  const [stats, setStats] = useState({
    totalWorkflows: 0,
    executionsToday: 0,
    averageCost: 0,
    automationRate: 0,
  });

  useEffect(() => {
    // Calcular estatísticas baseado nos dados
    setStats({
      totalWorkflows: workflows?.length || 0,
      executionsToday: Math.floor(Math.random() * 5000),
      averageCost: Math.floor(Math.random() * 500),
      automationRate: Math.floor(Math.random() * 30) + 70,
    });
  }, [workflows]);

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Gerencie seus workflows e integrações</p>
        </div>
        <button
          onClick={onCreateWorkflow}
          className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all font-semibold shadow-lg shadow-teal-600/30"
        >
          <Plus size={20} /> Novo Workflow
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            icon: Zap,
            label: 'Workflows Ativos',
            value: stats.totalWorkflows,
            change: '+2 esta semana',
            color: 'from-blue-600 to-blue-400',
          },
          {
            icon: Clock,
            label: 'Execuções Hoje',
            value: stats.executionsToday.toLocaleString('pt-BR'),
            change: '+15%',
            color: 'from-cyan-600 to-cyan-400',
          },
          {
            icon: BarChart3,
            label: 'Custo IA (mês)',
            value: `R$ ${stats.averageCost}`,
            change: '-23%',
            color: 'from-emerald-600 to-emerald-400',
          },
          {
            icon: TrendingUp,
            label: 'Taxa Automação',
            value: `${stats.automationRate}%`,
            change: '+12%',
            color: 'from-purple-600 to-purple-400',
          },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-all group"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="text-white" size={24} />
              </div>
              <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
              <p className="text-xs text-green-400 font-semibold">{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* Workflows Section */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Workflows Recentes</h2>
          <button className="text-teal-400 hover:text-teal-300 text-sm font-semibold">
            Ver todos →
          </button>
        </div>

        <div className="divide-y divide-slate-700">
          {workflows && workflows.length > 0 ? (
            workflows.slice(0, 5).map((workflow, idx) => (
              <div
                key={idx}
                className="px-6 py-4 hover:bg-slate-700/50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-teal-600/20 rounded-lg flex items-center justify-center text-teal-400">
                    <Zap size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{workflow.name || 'Workflow sem nome'}</p>
                    <p className="text-xs text-slate-400">
                      {workflow.steps?.length || 0} etapas • Criado há 2 dias
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center px-3 py-1 bg-green-600/20 text-green-400 text-xs font-semibold rounded-full">
                    ● Ativo
                  </span>
                  <span className="text-slate-400 text-sm font-semibold">98.5%</span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-slate-400 mb-4">Nenhum workflow criado ainda</p>
              <button
                onClick={onCreateWorkflow}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all text-sm font-semibold"
              >
                <Plus size={16} /> Criar Primeiro Workflow
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Estatísticas de Uso</h3>
          <div className="space-y-4">
            {[
              { label: 'Requisições API', value: '12.5K', trend: '+8%' },
              { label: 'Tempo médio', value: '150ms', trend: '-5%' },
              { label: 'Taxa sucesso', value: '98.5%', trend: '+2%' },
            ].map((stat, idx) => (
              <div key={idx} className="flex items-center justify-between pb-4 border-b border-slate-700 last:border-0">
                <span className="text-slate-300">{stat.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{stat.value}</span>
                  <span className="text-xs text-green-400">{stat.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Ações Rápidas</h3>
          <div className="space-y-3">
            <button className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-colors text-left">
              📊 Ver Relatório Completo
            </button>
            <button className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-colors text-left">
              🔄 Sincronizar Integrações
            </button>
            <button className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-colors text-left">
              ⚙️ Configurar Notificações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
