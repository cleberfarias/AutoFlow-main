import React, { useState } from 'react';
import { 
  Layout, Zap, MessageSquare, ShoppingCart, HeadphonesIcon, 
  TrendingUp, Plus, Search, Filter, Star, Download, Eye, 
  Copy, Edit2, Trash2, Clock, Users, CheckCircle 
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'atendimento' | 'vendas' | 'suporte' | 'marketing' | 'operacional';
  icon: any;
  stepsCount: number;
  usageCount: number;
  rating: number;
  createdAt: string;
  author: string;
  tags: string[];
  isPublic: boolean;
  isFeatured: boolean;
}

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const templates: Template[] = [
    {
      id: '1',
      name: 'Atendimento Inicial',
      description: 'Template completo para primeiro contato com clientes, incluindo saudação, qualificação e direcionamento.',
      category: 'atendimento',
      icon: MessageSquare,
      stepsCount: 8,
      usageCount: 245,
      rating: 4.8,
      createdAt: '2026-01-10',
      author: 'Sistema',
      tags: ['whatsapp', 'saudação', 'qualificação'],
      isPublic: true,
      isFeatured: true
    },
    {
      id: '2',
      name: 'Funil de Vendas',
      description: 'Workflow otimizado para conversão de leads, com follow-up automático e scoring de interesse.',
      category: 'vendas',
      icon: TrendingUp,
      stepsCount: 12,
      usageCount: 189,
      rating: 4.9,
      createdAt: '2026-01-08',
      author: 'Sistema',
      tags: ['leads', 'conversão', 'follow-up', 'crm'],
      isPublic: true,
      isFeatured: true
    },
    {
      id: '3',
      name: 'Suporte Técnico',
      description: 'Triagem e roteamento inteligente de tickets de suporte com base em prioridade e categoria.',
      category: 'suporte',
      icon: HeadphonesIcon,
      stepsCount: 10,
      usageCount: 156,
      rating: 4.7,
      createdAt: '2026-01-05',
      author: 'Sistema',
      tags: ['tickets', 'prioridade', 'roteamento', 'sla'],
      isPublic: true,
      isFeatured: false
    },
    {
      id: '4',
      name: 'Carrinho Abandonado',
      description: 'Recuperação automática de carrinhos abandonados com lembretes personalizados e cupons de desconto.',
      category: 'vendas',
      icon: ShoppingCart,
      stepsCount: 6,
      usageCount: 134,
      rating: 4.6,
      createdAt: '2026-01-03',
      author: 'Sistema',
      tags: ['e-commerce', 'recuperação', 'cupons'],
      isPublic: true,
      isFeatured: false
    },
    {
      id: '5',
      name: 'Pesquisa de Satisfação',
      description: 'Coleta automática de feedback pós-atendimento com NPS e análise de sentimento.',
      category: 'atendimento',
      icon: Star,
      stepsCount: 5,
      usageCount: 98,
      rating: 4.5,
      createdAt: '2025-12-28',
      author: 'Sistema',
      tags: ['nps', 'feedback', 'satisfação'],
      isPublic: true,
      isFeatured: false
    },
    {
      id: '6',
      name: 'Campanhas Marketing',
      description: 'Automação completa de campanhas multicanal com segmentação e tracking de conversão.',
      category: 'marketing',
      icon: Zap,
      stepsCount: 15,
      usageCount: 87,
      rating: 4.8,
      createdAt: '2025-12-25',
      author: 'Sistema',
      tags: ['campanhas', 'multicanal', 'segmentação'],
      isPublic: true,
      isFeatured: true
    }
  ];

  const categories = [
    { id: 'all', label: 'Todos', count: templates.length },
    { id: 'atendimento', label: 'Atendimento', count: templates.filter(t => t.category === 'atendimento').length },
    { id: 'vendas', label: 'Vendas', count: templates.filter(t => t.category === 'vendas').length },
    { id: 'suporte', label: 'Suporte', count: templates.filter(t => t.category === 'suporte').length },
    { id: 'marketing', label: 'Marketing', count: templates.filter(t => t.category === 'marketing').length },
    { id: 'operacional', label: 'Operacional', count: templates.filter(t => t.category === 'operacional').length }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
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

  const stats = {
    totalTemplates: templates.length,
    totalUsage: templates.reduce((sum, t) => sum + t.usageCount, 0),
    avgRating: (templates.reduce((sum, t) => sum + t.rating, 0) / templates.length).toFixed(1),
    featured: templates.filter(t => t.isFeatured).length
  };

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
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-teal-500/20 transition-all"
          >
            <Plus size={20} />
            Criar Template
          </button>
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
            <div className="text-3xl font-bold text-white">{stats.totalTemplates}</div>
            <div className="text-sm text-teal-400 mt-1">{stats.featured} em destaque</div>
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
            <div className="text-3xl font-bold text-white">{templates.filter(t => t.isPublic).length}</div>
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
            const Icon = template.icon;
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
                      <span>{new Date(template.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* Actions */}
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
