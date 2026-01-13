import React, { useState } from 'react';
import { 
  GitBranch, Clock, User, Tag, RotateCcw, GitCommit, 
  ChevronRight, Eye, Download, Play, AlertCircle, CheckCircle2,
  Plus, Minus, Edit3, Trash2, Save, History
} from 'lucide-react';

interface Version {
  id: string;
  workflowName: string;
  version: string;
  tag?: string;
  description: string;
  author: string;
  timestamp: string;
  changes: {
    added: number;
    modified: number;
    removed: number;
  };
  status: 'active' | 'archived' | 'draft';
  isCurrent: boolean;
  stepsCount: number;
}

export default function VersionsPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('all');
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const versions: Version[] = [
    {
      id: '1',
      workflowName: 'Atendimento Cliente VIP',
      version: 'v2.3.1',
      tag: 'production',
      description: 'Otimização no tempo de resposta e adição de fallback para horário comercial',
      author: 'João Silva',
      timestamp: '2026-01-13T14:30:00',
      changes: { added: 2, modified: 3, removed: 0 },
      status: 'active',
      isCurrent: true,
      stepsCount: 12
    },
    {
      id: '2',
      workflowName: 'Atendimento Cliente VIP',
      version: 'v2.3.0',
      tag: 'staging',
      description: 'Integração com novo sistema de CRM e melhorias no roteamento',
      author: 'Maria Santos',
      timestamp: '2026-01-12T09:15:00',
      changes: { added: 5, modified: 2, removed: 1 },
      status: 'archived',
      isCurrent: false,
      stepsCount: 11
    },
    {
      id: '3',
      workflowName: 'Funil de Vendas',
      version: 'v1.5.2',
      tag: 'production',
      description: 'Correção de bug no cálculo de scoring e atualização de templates',
      author: 'Carlos Oliveira',
      timestamp: '2026-01-11T16:45:00',
      changes: { added: 0, modified: 4, removed: 0 },
      status: 'active',
      isCurrent: true,
      stepsCount: 15
    },
    {
      id: '4',
      workflowName: 'Funil de Vendas',
      version: 'v1.5.1',
      description: 'Ajuste fino nos critérios de qualificação de leads',
      author: 'Ana Paula',
      timestamp: '2026-01-10T11:20:00',
      changes: { added: 1, modified: 2, removed: 0 },
      status: 'archived',
      isCurrent: false,
      stepsCount: 15
    },
    {
      id: '5',
      workflowName: 'Suporte Técnico N1',
      version: 'v3.0.0',
      tag: 'production',
      description: 'Grande refatoração: novo sistema de priorização e AI Routing',
      author: 'Pedro Costa',
      timestamp: '2026-01-09T08:30:00',
      changes: { added: 8, modified: 5, removed: 3 },
      status: 'active',
      isCurrent: true,
      stepsCount: 18
    },
    {
      id: '6',
      workflowName: 'Suporte Técnico N1',
      version: 'v2.8.5',
      description: 'Última versão estável antes da refatoração v3.0',
      author: 'Pedro Costa',
      timestamp: '2026-01-05T14:00:00',
      changes: { added: 0, modified: 1, removed: 0 },
      status: 'archived',
      isCurrent: false,
      stepsCount: 13
    },
    {
      id: '7',
      workflowName: 'Carrinho Abandonado',
      version: 'v1.2.0-beta',
      tag: 'beta',
      description: 'Versão de teste com novos templates de recuperação',
      author: 'Fernanda Lima',
      timestamp: '2026-01-13T10:00:00',
      changes: { added: 3, modified: 1, removed: 0 },
      status: 'draft',
      isCurrent: false,
      stepsCount: 7
    }
  ];

  const workflows = ['all', ...Array.from(new Set(versions.map(v => v.workflowName)))];

  const filteredVersions = selectedWorkflow === 'all' 
    ? versions 
    : versions.filter(v => v.workflowName === selectedWorkflow);

  const stats = {
    totalVersions: versions.length,
    activeVersions: versions.filter(v => v.status === 'active').length,
    totalWorkflows: workflows.length - 1, // -1 para remover 'all'
    recentChanges: versions.filter(v => {
      const diff = Date.now() - new Date(v.timestamp).getTime();
      return diff < 24 * 60 * 60 * 1000; // últimas 24h
    }).length
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      archived: 'bg-slate-600/20 text-slate-400 border-slate-600/30',
      draft: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getTagColor = (tag?: string) => {
    if (!tag) return '';
    const colors = {
      production: 'bg-emerald-500/20 text-emerald-400',
      staging: 'bg-blue-500/20 text-blue-400',
      beta: 'bg-amber-500/20 text-amber-400',
      development: 'bg-purple-500/20 text-purple-400'
    };
    return colors[tag as keyof typeof colors] || 'bg-slate-500/20 text-slate-400';
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Há alguns minutos';
    if (hours < 24) return `Há ${hours} hora${hours > 1 ? 's' : ''}`;
    if (hours < 48) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
              <GitBranch size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Versões</h1>
              <p className="text-slate-400">Controle de versionamento e histórico de workflows</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors">
              <GitCommit size={20} />
              Comparar
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/20 transition-all">
              <Save size={20} />
              Nova Versão
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-violet-500/10 rounded-lg">
                <History size={20} className="text-violet-400" />
              </div>
              <span className="text-slate-400 text-sm">Total Versões</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalVersions}</div>
            <div className="text-sm text-violet-400 mt-1">Todos os workflows</div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle2 size={20} className="text-emerald-400" />
              </div>
              <span className="text-slate-400 text-sm">Ativas</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.activeVersions}</div>
            <div className="text-sm text-emerald-400 mt-1">Em produção</div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <GitBranch size={20} className="text-blue-400" />
              </div>
              <span className="text-slate-400 text-sm">Workflows</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalWorkflows}</div>
            <div className="text-sm text-slate-400 mt-1">Versionados</div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock size={20} className="text-amber-400" />
              </div>
              <span className="text-slate-400 text-sm">Últimas 24h</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.recentChanges}</div>
            <div className="text-sm text-amber-400 mt-1">Alterações</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <GitBranch size={20} className="text-slate-400" />
            <span className="text-white font-medium">Filtrar por Workflow</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {workflows.map(workflow => (
              <button
                key={workflow}
                onClick={() => setSelectedWorkflow(workflow)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedWorkflow === workflow
                    ? 'bg-violet-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {workflow === 'all' ? 'Todos' : workflow}
                <span className="ml-2 opacity-60">
                  ({workflow === 'all' ? versions.length : versions.filter(v => v.workflowName === workflow).length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Clock size={20} className="text-violet-400" />
              Timeline de Versões
            </h2>
          </div>

          <div className="p-6">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-700"></div>

              {/* Versions */}
              <div className="space-y-6">
                {filteredVersions.map((version, index) => (
                  <div key={version.id} className="relative pl-16">
                    {/* Timeline dot */}
                    <div className={`absolute left-3 top-3 w-6 h-6 rounded-full border-4 ${
                      version.isCurrent 
                        ? 'bg-violet-500 border-violet-400 shadow-lg shadow-violet-500/50' 
                        : 'bg-slate-800 border-slate-600'
                    }`}>
                      {version.isCurrent && (
                        <div className="absolute inset-0 rounded-full bg-violet-500 animate-ping opacity-75"></div>
                      )}
                    </div>

                    {/* Version card */}
                    <div className={`bg-slate-900 rounded-xl border transition-all hover:border-violet-500 ${
                      version.isCurrent ? 'border-violet-500' : 'border-slate-700'
                    }`}>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-white">{version.workflowName}</h3>
                              <span className="px-3 py-1 bg-violet-500/20 text-violet-400 text-sm font-mono rounded-full">
                                {version.version}
                              </span>
                              {version.tag && (
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getTagColor(version.tag)}`}>
                                  {version.tag}
                                </span>
                              )}
                              {version.isCurrent && (
                                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-full flex items-center gap-1">
                                  <CheckCircle2 size={14} />
                                  Atual
                                </span>
                              )}
                              <span className={`px-3 py-1 text-sm font-medium rounded-lg border ${getStatusColor(version.status)}`}>
                                {version.status === 'active' ? 'Ativa' : version.status === 'archived' ? 'Arquivada' : 'Rascunho'}
                              </span>
                            </div>
                            <p className="text-slate-300 mb-3">{version.description}</p>
                            
                            <div className="flex items-center gap-6 text-sm text-slate-400">
                              <div className="flex items-center gap-2">
                                <User size={16} />
                                <span>{version.author}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={16} />
                                <span>{formatDate(version.timestamp)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <GitCommit size={16} />
                                <span>{version.stepsCount} passos</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Visualizar"
                            >
                              <Eye size={18} />
                            </button>
                            {!version.isCurrent && (
                              <button
                                className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                title="Restaurar versão"
                              >
                                <RotateCcw size={18} />
                              </button>
                            )}
                            <button
                              className="p-2 text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Changes summary */}
                        {(version.changes.added > 0 || version.changes.modified > 0 || version.changes.removed > 0) && (
                          <div className="flex items-center gap-4 pt-4 border-t border-slate-700">
                            <span className="text-slate-400 text-sm">Alterações:</span>
                            {version.changes.added > 0 && (
                              <div className="flex items-center gap-1 text-emerald-400 text-sm">
                                <Plus size={14} />
                                <span>{version.changes.added} adicionado{version.changes.added > 1 ? 's' : ''}</span>
                              </div>
                            )}
                            {version.changes.modified > 0 && (
                              <div className="flex items-center gap-1 text-blue-400 text-sm">
                                <Edit3 size={14} />
                                <span>{version.changes.modified} modificado{version.changes.modified > 1 ? 's' : ''}</span>
                              </div>
                            )}
                            {version.changes.removed > 0 && (
                              <div className="flex items-center gap-1 text-rose-400 text-sm">
                                <Minus size={14} />
                                <span>{version.changes.removed} removido{version.changes.removed > 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-violet-500/20 rounded-xl">
              <GitBranch size={24} className="text-violet-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Controle de Versões</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">
                O sistema mantém um histórico completo de todas as alterações em seus workflows. 
                Você pode restaurar versões anteriores a qualquer momento, comparar alterações entre 
                versões e criar tags para marcos importantes (como releases de produção).
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>• Histórico ilimitado</span>
                <span>• Restauração instantânea</span>
                <span>• Comparação visual</span>
                <span>• Tags personalizadas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
