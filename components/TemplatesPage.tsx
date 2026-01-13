import React, { useState, useEffect } from 'react';
import { 
  Layout, Zap, MessageSquare, ShoppingCart, HeadphonesIcon, 
  TrendingUp, Plus, Search, Filter, Star, Download, Eye, 
  Copy, Edit2, Trash2, Clock, Users, CheckCircle 
} from 'lucide-react';
import { templateManager, WorkflowTemplate } from '../services/templateManager';

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);

  // Carregar templates e subscrever para atualizações
  useEffect(() => {
    setTemplates(templateManager.getTemplates());
    
    const unsubscribe = templateManager.subscribe((updatedTemplates) => {
      setTemplates(updatedTemplates);
    });

    return unsubscribe;
  }, []);

  const handleApplyTemplate = (templateId: string) => {
    const steps = templateManager.applyTemplate(templateId, 'Usuário');
    if (steps) {
      alert('Template aplicado! Os passos foram copiados para uso.');
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Deletar este template?')) {
      const deleted = templateManager.deleteTemplate(templateId, 'Usuário');
      if (deleted) {
        alert('Template deletado com sucesso!');
      } else {
        alert('Não foi possível deletar este template do sistema.');
      }
    }
  };

  const handleDuplicateTemplate = (templateId: string) => {
    const duplicated = templateManager.duplicateTemplate(templateId, 'Usuário');
    if (duplicated) {
      alert(`Template duplicado como "${duplicated.name}"!`);
    }
  };

  const handleExportTemplates = () => {
    const data = templateManager.exportTemplates();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autoflow-templates-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const categories = [
    { id: 'all', label: 'Todos', count: templates.length },
    { id: 'atendimento', label: 'Atendimento', count: templates.filter(t => t.category === 'atendimento').length },
    { id: 'vendas', label: 'Vendas', count: templates.filter(t => t.category === 'vendas').length },
    { id: 'suporte', label: 'Suporte', count: templates.filter(t => t.category === 'suporte').length },
    { id: 'marketing', label: 'Marketing', count: templates.filter(t => t.category === 'marketing').length },
    { id: 'operacional', label: 'Operacional', count: templates.filter(t => t.category === 'operacional').length }
  ];

  const filteredTemplates = templateManager.getTemplates({
    category: selectedCategory,
    searchQuery: searchQuery
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      atendimento: 'from-blue-500 to-cyan-500',
      vendas: 'from-emerald-500 to-teal-500',
      suporte: 'from-purple-500 to-fuchsia-500',
      marketing: 'from-orange-500 to-amber-500',
      operacional: 'from-slate-500 to-zinc-500'
    };
    return colors[category as keyof typeof colors] || colors.operacional;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      atendimento: MessageSquare,
      vendas: TrendingUp,
      suporte: HeadphonesIcon,
      marketing: Zap,
      operacional: Layout
    };
    return icons[category as keyof typeof icons] || Layout;
  };

  const stats = templateManager.getStats();

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl">
              <Layout size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Templates</h1>
              <p className="text-slate-400">Workflows prontos para usar e personalizar</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportTemplates}
              className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
            >
              <Download size={20} />
              Exportar
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-teal-500/20 transition-all"
            >
              <Plus size={20} />
              Criar Template
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-teal-500/10 rounded-lg">
                <Layout size={20} className="text-teal-400" />
              </div>
              <span className="text-slate-400 text-sm">Templates</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.featuredTemplates}</div>
            <div className="text-sm text-teal-400 mt-1">em destaque</div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users size={20} className="text-blue-400" />
              </div>
              <span className="text-slate-400 text-sm">Usos Totais</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalUsage}</div>
            <div className="text-sm text-slate-400 mt-1">Todos os templates</div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Star size={20} className="text-amber-400" />
              </div>
              <span className="text-slate-400 text-sm">Avaliação Média</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.avgRating}</div>
            <div className="text-sm text-amber-400 mt-1">⭐ De 5.0</div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle size={20} className="text-emerald-400" />
              </div>
              <span className="text-slate-400 text-sm">Públicos</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.publicTemplates}</div>
            <div className="text-sm text-slate-400 mt-1">Disponíveis</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar templates por nome, descrição ou tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
            <button className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
              <Filter size={20} className="text-slate-300" />
            </button>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-3 gap-6">
          {filteredTemplates.map(template => {
            const Icon = getCategoryIcon(template.category);
            return (
              <div key={template.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-teal-500 transition-all group">
                {/* Header com gradiente */}
                <div className={`bg-gradient-to-r ${getCategoryColor(template.category)} p-6 relative`}>
                  {template.isFeatured && (
                    <div className="absolute top-3 right-3">
                      <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium flex items-center gap-1">
                        <Star size={12} fill="currentColor" />
                        Destaque
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Icon size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{template.name}</h3>
                      <div className="flex items-center gap-2 text-white/80 text-sm">
                        <span>{template.stepsCount} passos</span>
                        <span>•</span>
                        <span className="capitalize">{template.category}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    {template.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-slate-400 mb-4 pb-4 border-b border-slate-700">
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      <span>{template.usageCount} usos</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star size={16} fill="currentColor" />
                      <span>{template.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{new Date(template.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleApplyTemplate(template.id)}
                      className="flex items-center justify-center gap-1 px-2 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                      <Download size={14} />
                      Usar
                    </button>
                    <button
                      onClick={() => handleDuplicateTemplate(template.id)}
                      className="flex items-center justify-center gap-1 px-2 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors text-sm"
                      title="Duplicar"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="flex items-center justify-center gap-1 px-2 py-2 bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg font-medium transition-colors text-sm"
                      title="Deletar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors">
                      <Download size={16} />
                      Usar
                    </button>
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors">
                      <Eye size={16} />
                      Preview
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-16 text-center">
            <Layout size={64} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum template encontrado</h3>
            <p className="text-slate-400 mb-6">
              Tente ajustar seus filtros ou buscar por outros termos.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-500/20 rounded-xl">
              <Layout size={24} className="text-teal-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Como usar templates?</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">
                Templates são workflows pré-configurados que você pode usar como ponto de partida. 
                Basta clicar em "Usar" para criar uma cópia editável em seus workflows. Você pode 
                personalizá-los completamente de acordo com suas necessidades.
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>• Totalmente personalizáveis</span>
                <span>• Criados por especialistas</span>
                <span>• Atualizados regularmente</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">Criar Template</h2>
            <p className="text-slate-400 mb-6">
              Para criar um template, vá para a página <strong>Workflows</strong>, crie ou edite 
              um workflow e depois salve-o como template usando a opção no menu.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  // Aqui você poderia navegar para workflows
                }}
                className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
              >
                Ir para Workflows
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
