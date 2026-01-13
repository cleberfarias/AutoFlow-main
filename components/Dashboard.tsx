import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Clock, Zap, BarChart3 } from 'lucide-react';

interface DashboardProps {
  clients: any[];
  workflows: any[];
  onCreateWorkflow?: () => void;
}

// Função para calcular dias desde criação
function getDaysAgo(timestamp: number): string {
  const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 7) return `Há ${days} dias`;
  if (days < 30) return `Há ${Math.floor(days / 7)} semanas`;
  return `Há ${Math.floor(days / 30)} meses`;
}

// Função para calcular estatísticas reais
function calculateStats(workflows: any[]) {
  const totalWorkflows = workflows.length;
  
  // Contar total de nós em todos os workflows
  const totalSteps = workflows.reduce((sum, w) => sum + (w.steps?.length || 0), 0);
  
  // Contar nós MCP (integrações)
  const mcpSteps = workflows.reduce((sum, w) => {
    const mcpCount = w.steps?.filter((s: any) => s.type === 'MCP').length || 0;
    return sum + mcpCount;
  }, 0);
  
  // Contar workflows com API configurada
  const workflowsWithAPI = workflows.filter(w => 
    w.steps?.some((s: any) => s.params?.api?.url)
  ).length;
  
  // Calcular workflows recentes (últimos 7 dias)
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const recentWorkflows = workflows.filter(w => 
    w.lastModified && w.lastModified > sevenDaysAgo
  ).length;
  
  // Taxa de automação = workflows com integrações / total
  const automationRate = totalWorkflows > 0 
    ? Math.round((workflowsWithAPI / totalWorkflows) * 100) 
    : 0;
  
  // Custo estimado (R$0.002 por step em média - GPT-4 pricing aproximado)
  const estimatedCost = totalSteps * 0.002;
  
  return {
    totalWorkflows,
    totalSteps,
    mcpSteps,
    recentWorkflows,
    automationRate,
    estimatedCost: Math.round(estimatedCost * 100) / 100,
    workflowsWithAPI,
  };
}

export default function Dashboard({ clients, workflows, onCreateWorkflow }: DashboardProps) {
  const [stats, setStats] = useState({
    totalWorkflows: 0,
    totalSteps: 0,
    mcpSteps: 0,
    recentWorkflows: 0,
    automationRate: 0,
    estimatedCost: 0,
    workflowsWithAPI: 0,
  });

  useEffect(() => {
    const calculated = calculateStats(workflows || []);
    setStats(calculated);
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
            label: 'Workflows Criados',
            value: stats.totalWorkflows,
            change: stats.recentWorkflows > 0 ? `+${stats.recentWorkflows} esta semana` : 'Nenhum recente',
            color: 'from-blue-600 to-blue-400',
            changeColor: stats.recentWorkflows > 0 ? 'text-green-400' : 'text-slate-500',
          },
          {
            icon: Clock,
            label: 'Total de Nós',
            value: stats.totalSteps.toLocaleString('pt-BR'),
            change: `${stats.mcpSteps} integrações MCP`,
            color: 'from-cyan-600 to-cyan-400',
            changeColor: 'text-cyan-400',
          },
          {
            icon: BarChart3,
            label: 'Custo Estimado/mês',
            value: `R$ ${stats.estimatedCost.toFixed(2)}`,
            change: `${stats.totalSteps} steps × R$0.002`,
            color: 'from-emerald-600 to-emerald-400',
            changeColor: 'text-emerald-400',
          },
          {
            icon: TrendingUp,
            label: 'Taxa Automação',
            value: `${stats.automationRate}%`,
            change: `${stats.workflowsWithAPI} com API`,
            color: 'from-purple-600 to-purple-400',
            changeColor: 'text-purple-400',
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
              <p className={`text-xs font-semibold ${stat.changeColor || 'text-green-400'}`}>{stat.change}</p>
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
                      {workflow.steps?.length || 0} nós • {getDaysAgo(workflow.lastModified || Date.now())}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {workflow.steps?.some((s: any) => s.params?.api?.url || s.type === 'MCP') ? (
                    <span className="inline-flex items-center px-3 py-1 bg-teal-600/20 text-teal-400 text-xs font-semibold rounded-full">
                      ● Integrado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 bg-slate-600/20 text-slate-400 text-xs font-semibold rounded-full">
                      ○ Draft
                    </span>
                  )}
                  <span className="text-slate-400 text-sm font-semibold">{workflow.steps?.length || 0} steps</span>
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
          <h3 className="text-lg font-bold text-white mb-4">Resumo do Projeto</h3>
          <div className="space-y-4">
            {[
              { label: 'Total de Clientes', value: clients.length.toString(), trend: 'ativos' },
              { label: 'Workflows Totais', value: workflows.length.toString(), trend: `${stats.workflowsWithAPI} com API` },
              { label: 'Integrações MCP', value: stats.mcpSteps.toString(), trend: 'nós externos' },
            ].map((stat, idx) => (
              <div key={idx} className="flex items-center justify-between pb-4 border-b border-slate-700 last:border-0">
                <span className="text-slate-300">{stat.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{stat.value}</span>
                  <span className="text-xs text-slate-500">{stat.trend}</span>
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
