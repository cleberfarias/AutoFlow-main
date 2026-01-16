import React, { useState } from 'react';
import { Workflow, Plus, Search, Filter, MoreVertical, Play, Edit, Trash2, User, ChevronDown, ChevronRight } from 'lucide-react';

interface WorkflowsPageProps {
  clients?: any[];
  workflows: any[];
  onSelectWorkflow?: (workflow: any) => void;
  onCreateWorkflow?: () => void;
  onDeleteWorkflow?: (id: string) => void;
  onExecuteWorkflow?: (id: string) => void;
}

export default function WorkflowsPage({
  clients = [],
  workflows,
  onSelectWorkflow,
  onCreateWorkflow,
  onDeleteWorkflow,
  onExecuteWorkflow,
}: WorkflowsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [hoveredWorkflow, setHoveredWorkflow] = useState<string | null>(null);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set(clients.map(c => c.id)));

  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  };

  // Group workflows by client
  const workflowsByClient = clients.map(client => ({
    client,
    workflows: client.automations || []
  }));

  // Filter
  const filteredData = workflowsByClient
    .map(({ client, workflows: clientWorkflows }) => ({
      client,
      workflows: clientWorkflows.filter((w: any) => {
        const matchesSearch = w.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || w.status === filterStatus;
        return matchesSearch && matchesFilter;
      })
    }))
    .filter(({ workflows: clientWorkflows }) => searchTerm ? clientWorkflows.length > 0 : true);

  const totalWorkflows = filteredData.reduce((sum, { workflows: w }) => sum + w.length, 0);

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Workflows</h1>
          <p className="text-slate-400">Gerencie todos os seus workflows organizados por cliente</p>
        </div>
        <button
          onClick={onCreateWorkflow}
          className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all font-semibold shadow-lg shadow-teal-600/30"
        >
          <Plus size={20} /> Novo Workflow
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Procurar workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-teal-600 focus:outline-none transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white hover:border-slate-600 transition-colors">
          <Filter size={20} /> Filtros
        </button>
      </div>

      {/* Clients and Workflows */}
      <div className="space-y-6">
        {filteredData.length > 0 ? (
          filteredData.map(({ client, workflows: clientWorkflows }) => (
            <div key={client.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              {/* Client Header */}
              <button
                onClick={() => toggleClient(client.id)}
                className="w-full px-6 py-4 bg-slate-800 hover:bg-slate-750 border-b border-slate-700 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-600/20 rounded-lg flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                    <User size={24} />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-bold text-white">{client.name}</h2>
                    <p className="text-sm text-slate-400">
                      {clientWorkflows.length} workflow{clientWorkflows.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-400">
                    {expandedClients.has(client.id) ? 'Ocultar' : 'Mostrar'}
                  </span>
                  {expandedClients.has(client.id) ? (
                    <ChevronDown size={20} className="text-teal-400" />
                  ) : (
                    <ChevronRight size={20} className="text-slate-400" />
                  )}
                </div>
              </button>

              {/* Workflows Grid */}
              {expandedClients.has(client.id) && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {clientWorkflows.length > 0 ? (
                    clientWorkflows.map((workflow: any, idx: number) => (
                      <div
                        key={workflow.id || idx}
                        className="bg-slate-750 rounded-xl border border-slate-700 overflow-hidden hover:border-teal-600 transition-all hover:shadow-lg hover:shadow-teal-600/20 group"
                        onMouseEnter={() => setHoveredWorkflow(workflow.id || idx)}
                        onMouseLeave={() => setHoveredWorkflow(null)}
                      >
                        {/* Card Header */}
                        <div className="h-24 bg-gradient-to-br from-teal-600 to-cyan-600 p-4 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                              <Workflow className="text-white" size={24} />
                            </div>
                            <div>
                              <h3 className="font-bold text-white truncate">{workflow.name || 'Workflow sem nome'}</h3>
                              <p className="text-xs text-white/70">{workflow.steps?.length || 0} etapas</p>
                            </div>
                          </div>
                          {hoveredWorkflow === (workflow.id || idx) && (
                            <button className="p-1 bg-white/20 rounded hover:bg-white/30 transition-colors">
                              <MoreVertical size={16} className="text-white" />
                            </button>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-4">
                          <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                            {workflow.description || 'Sem descrição'}
                          </p>

                          <div className="flex items-center gap-2 mb-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                              workflow.status === 'active' || workflow.status === undefined
                                ? 'bg-green-600/20 text-green-400'
                                : 'bg-slate-700/50 text-slate-400'
                            }`}>
                              ● {workflow.status === 'active' || !workflow.status ? 'Ativo' : 'Inativo'}
                            </span>
                            {workflow.lastModified && (
                              <span className="text-xs text-slate-400">
                                {new Date(workflow.lastModified).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => onExecuteWorkflow?.(workflow.id || idx)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors"
                            >
                              <Play size={16} /> Executar
                            </button>
                            <button
                              onClick={() => onSelectWorkflow?.(workflow)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-colors"
                            >
                              <Edit size={16} /> Editar
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Excluir workflow "${workflow.name}"?`)) {
                                  onDeleteWorkflow?.(workflow.id || idx);
                                }
                              }}
                              className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-8 text-center">
                      <p className="text-slate-400">Nenhum workflow para este cliente</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-800 rounded-xl border border-slate-700">
            <Workflow className="text-slate-600 mb-4" size={48} />
            <p className="text-slate-400 mb-4 text-lg">
              {searchTerm ? 'Nenhum workflow encontrado' : 'Nenhum cliente ou workflow criado ainda'}
            </p>
            <button
              onClick={onCreateWorkflow}
              className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all font-semibold"
            >
              <Plus size={20} /> Criar Primeiro Workflow
            </button>
          </div>
        )}
      </div>

      {/* Total Count */}
      {filteredData.length > 0 && (
        <div className="mt-8 text-center text-slate-400">
          <p>
            {filteredData.length} cliente{filteredData.length !== 1 ? 's' : ''} • {totalWorkflows} workflow{totalWorkflows !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
