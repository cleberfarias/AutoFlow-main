/**
 * MCP Hub - Model Context Protocol Integrations
 * 
 * Central de gerenciamento de integrações MCP para o AutoFlow
 * Conecta com serviços externos: Advbox, Stripe, Google Calendar, DocuSign, etc.
 */

import React, { useState } from 'react';
import { 
  Check, X, Settings, ExternalLink, Key, RefreshCw, Shield, 
  Zap, Calendar, FileText, CreditCard, Scale, Mail, Database,
  Users, Bell, Globe, Lock, AlertTriangle, CheckCircle2, 
  XCircle, Clock, ArrowRight, Plus, Trash2
} from 'lucide-react';

// Tipos
interface MCPIntegration {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'legal' | 'payments' | 'calendar' | 'documents' | 'crm' | 'notifications' | 'other';
  status: 'connected' | 'disconnected' | 'error' | 'configuring';
  apiKeyRequired: boolean;
  webhooksSupported: boolean;
  lastSync?: string;
  config?: {
    apiKey?: string;
    webhookUrl?: string;
    [key: string]: any;
  };
  capabilities: string[];
  docsUrl?: string;
}

interface MCPHubProps {
  title?: string;
  description?: string;
}

const MCPHub: React.FC<MCPHubProps> = ({ 
  title = 'MCP Hub', 
  description = 'Gerencie todas as suas integrações de forma centralizada' 
}) => {
  // Estado das integrações
  const [integrations, setIntegrations] = useState<MCPIntegration[]>([
    {
      id: 'advbox',
      name: 'Advbox',
      description: 'Sistema de gestão jurídica. Integre processos, prazos e clientes.',
      icon: Scale,
      category: 'legal',
      status: 'disconnected',
      apiKeyRequired: true,
      webhooksSupported: true,
      capabilities: [
        'Listar processos',
        'Consultar prazos',
        'Gerenciar clientes',
        'Criar tarefas',
        'Receber webhooks de novos processos'
      ],
      docsUrl: 'https://docs.advbox.com.br/api'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Processamento de pagamentos online. Crie cobranças e gerencie assinaturas.',
      icon: CreditCard,
      category: 'payments',
      status: 'disconnected',
      apiKeyRequired: true,
      webhooksSupported: true,
      capabilities: [
        'Criar checkout sessions',
        'Gerenciar assinaturas',
        'Processar pagamentos',
        'Consultar transações',
        'Webhooks de eventos de pagamento'
      ],
      docsUrl: 'https://stripe.com/docs/api'
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Agende compromissos e gerencie eventos automaticamente.',
      icon: Calendar,
      category: 'calendar',
      status: 'disconnected',
      apiKeyRequired: true,
      webhooksSupported: true,
      capabilities: [
        'Criar eventos',
        'Listar compromissos',
        'Atualizar agendamentos',
        'Verificar disponibilidade',
        'Enviar convites'
      ],
      docsUrl: 'https://developers.google.com/calendar/api'
    },
    {
      id: 'docusign',
      name: 'DocuSign',
      description: 'Assinatura eletrônica de documentos. Envie e rastreie contratos.',
      icon: FileText,
      category: 'documents',
      status: 'disconnected',
      apiKeyRequired: true,
      webhooksSupported: true,
      capabilities: [
        'Enviar documentos para assinatura',
        'Consultar status de documentos',
        'Download de documentos assinados',
        'Gerenciar templates',
        'Notificações de assinatura'
      ],
      docsUrl: 'https://developers.docusign.com/'
    },
    {
      id: 'clicksign',
      name: 'Clicksign',
      description: 'Assinatura eletrônica brasileira com validade jurídica.',
      icon: FileText,
      category: 'documents',
      status: 'disconnected',
      apiKeyRequired: true,
      webhooksSupported: true,
      capabilities: [
        'Upload de documentos',
        'Criar signatários',
        'Acompanhar assinaturas',
        'Download de documentos',
        'Webhooks de conclusão'
      ],
      docsUrl: 'https://developers.clicksign.com/'
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'CRM e automação de marketing. Gerencie leads e contatos.',
      icon: Users,
      category: 'crm',
      status: 'disconnected',
      apiKeyRequired: true,
      webhooksSupported: true,
      capabilities: [
        'Criar e atualizar contatos',
        'Gerenciar deals',
        'Criar tarefas e lembretes',
        'Enviar emails',
        'Sincronizar dados de CRM'
      ],
      docsUrl: 'https://developers.hubspot.com/docs/api/overview'
    },
    {
      id: 'rd-station',
      name: 'RD Station',
      description: 'Marketing digital e automação para vendas.',
      icon: Zap,
      category: 'crm',
      status: 'disconnected',
      apiKeyRequired: true,
      webhooksSupported: true,
      capabilities: [
        'Capturar leads',
        'Enviar conversões',
        'Criar oportunidades',
        'Marcar eventos',
        'Atualizar campos customizados'
      ],
      docsUrl: 'https://developers.rdstation.com/'
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      description: 'Envio de emails transacionais e marketing.',
      icon: Mail,
      category: 'notifications',
      status: 'disconnected',
      apiKeyRequired: true,
      webhooksSupported: true,
      capabilities: [
        'Enviar emails',
        'Usar templates',
        'Rastrear aberturas e cliques',
        'Gerenciar listas',
        'Webhooks de eventos de email'
      ],
      docsUrl: 'https://docs.sendgrid.com/'
    },
    {
      id: 'twilio',
      name: 'Twilio',
      description: 'SMS, chamadas e comunicação programável.',
      icon: Bell,
      category: 'notifications',
      status: 'disconnected',
      apiKeyRequired: true,
      webhooksSupported: true,
      capabilities: [
        'Enviar SMS',
        'Fazer chamadas',
        'Receber mensagens',
        'WhatsApp Business API',
        'Verificação de telefone'
      ],
      docsUrl: 'https://www.twilio.com/docs'
    },
    {
      id: 'pagar-me',
      name: 'Pagar.me',
      description: 'Gateway de pagamento brasileiro.',
      icon: CreditCard,
      category: 'payments',
      status: 'disconnected',
      apiKeyRequired: true,
      webhooksSupported: true,
      capabilities: [
        'Processar pagamentos',
        'Criar cobranças',
        'Gerenciar planos',
        'Split de pagamentos',
        'Antifraude'
      ],
      docsUrl: 'https://docs.pagar.me/'
    },
    {
      id: 'zendesk',
      name: 'Zendesk',
      description: 'Plataforma de atendimento ao cliente e tickets.',
      icon: Users,
      category: 'crm',
      status: 'disconnected',
      apiKeyRequired: true,
      webhooksSupported: true,
      capabilities: [
        'Criar tickets',
        'Atualizar status',
        'Adicionar comentários',
        'Atribuir agentes',
        'Consultar histórico'
      ],
      docsUrl: 'https://developer.zendesk.com/'
    },
    {
      id: 'mongodb',
      name: 'MongoDB Atlas',
      description: 'Banco de dados NoSQL na nuvem.',
      icon: Database,
      category: 'other',
      status: 'disconnected',
      apiKeyRequired: true,
      webhooksSupported: false,
      capabilities: [
        'Consultar documentos',
        'Inserir dados',
        'Atualizar registros',
        'Agregações',
        'Full-text search'
      ],
      docsUrl: 'https://www.mongodb.com/docs/atlas/'
    }
  ]);

  const [selectedIntegration, setSelectedIntegration] = useState<MCPIntegration | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [filter, setFilter] = useState<'all' | MCPIntegration['category']>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Handlers
  const handleConnect = (integration: MCPIntegration) => {
    setSelectedIntegration(integration);
    setShowConfigModal(true);
  };

  const handleDisconnect = (integrationId: string) => {
    setIntegrations(prev => 
      prev.map(i => 
        i.id === integrationId 
          ? { ...i, status: 'disconnected', config: undefined } 
          : i
      )
    );
  };

  const handleSaveConfig = (config: any) => {
    if (selectedIntegration) {
      setIntegrations(prev =>
        prev.map(i =>
          i.id === selectedIntegration.id
            ? { 
                ...i, 
                status: 'connected', 
                config,
                lastSync: new Date().toISOString()
              }
            : i
        )
      );
      setShowConfigModal(false);
      setSelectedIntegration(null);
    }
  };

  const handleTestConnection = async (integration: MCPIntegration) => {
    // Simular teste de conexão
    setIntegrations(prev =>
      prev.map(i =>
        i.id === integration.id
          ? { ...i, status: 'configuring' }
          : i
      )
    );

    setTimeout(() => {
      setIntegrations(prev =>
        prev.map(i =>
          i.id === integration.id
            ? { ...i, status: 'connected', lastSync: new Date().toISOString() }
            : i
        )
      );
    }, 2000);
  };

  // Filtros
  const filteredIntegrations = integrations.filter(integration => {
    const matchesCategory = filter === 'all' || integration.category === filter;
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'Todas', count: integrations.length },
    { id: 'legal', label: 'Jurídico', count: integrations.filter(i => i.category === 'legal').length },
    { id: 'payments', label: 'Pagamentos', count: integrations.filter(i => i.category === 'payments').length },
    { id: 'calendar', label: 'Calendário', count: integrations.filter(i => i.category === 'calendar').length },
    { id: 'documents', label: 'Documentos', count: integrations.filter(i => i.category === 'documents').length },
    { id: 'crm', label: 'CRM', count: integrations.filter(i => i.category === 'crm').length },
    { id: 'notifications', label: 'Notificações', count: integrations.filter(i => i.category === 'notifications').length },
    { id: 'other', label: 'Outros', count: integrations.filter(i => i.category === 'other').length }
  ];

  const connectedCount = integrations.filter(i => i.status === 'connected').length;

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
          <p className="text-slate-400">{description}</p>
          
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
              <CheckCircle2 size={20} className="text-green-500" />
              <span className="text-white font-semibold">{connectedCount}</span>
              <span className="text-slate-400 text-sm">conectadas</span>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
              <Globe size={20} className="text-blue-500" />
              <span className="text-white font-semibold">{integrations.length}</span>
              <span className="text-slate-400 text-sm">disponíveis</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Buscar integrações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id as any)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  filter === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map(integration => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onTest={handleTestConnection}
            />
          ))}
        </div>

        {filteredIntegrations.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">Nenhuma integração encontrada</p>
            <p className="text-slate-500 text-sm mt-2">Tente ajustar os filtros</p>
          </div>
        )}

        {/* Config Modal */}
        {showConfigModal && selectedIntegration && (
          <ConfigModal
            integration={selectedIntegration}
            onClose={() => {
              setShowConfigModal(false);
              setSelectedIntegration(null);
            }}
            onSave={handleSaveConfig}
          />
        )}
      </div>
    </div>
  );
};

// Integration Card Component
const IntegrationCard: React.FC<{
  integration: MCPIntegration;
  onConnect: (integration: MCPIntegration) => void;
  onDisconnect: (id: string) => void;
  onTest: (integration: MCPIntegration) => void;
}> = ({ integration, onConnect, onDisconnect, onTest }) => {
  const Icon = integration.icon;
  const isConnected = integration.status === 'connected';
  const isConfiguring = integration.status === 'configuring';
  const hasError = integration.status === 'error';

  const statusColors = {
    connected: 'text-green-500 bg-green-500/10 border-green-500/30',
    disconnected: 'text-slate-500 bg-slate-500/10 border-slate-500/30',
    error: 'text-red-500 bg-red-500/10 border-red-500/30',
    configuring: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30'
  };

  const statusIcons = {
    connected: CheckCircle2,
    disconnected: XCircle,
    error: AlertTriangle,
    configuring: RefreshCw
  };

  const StatusIcon = statusIcons[integration.status];

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-blue-500/50 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 group-hover:border-blue-500/50 transition-all">
            <Icon size={24} className="text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{integration.name}</h3>
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${statusColors[integration.status]}`}>
              <StatusIcon size={12} className={isConfiguring ? 'animate-spin' : ''} />
              <span className="capitalize">{integration.status === 'connected' ? 'Conectado' : 
                              integration.status === 'configuring' ? 'Configurando' :
                              integration.status === 'error' ? 'Erro' : 'Desconectado'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-slate-400 text-sm mb-4">{integration.description}</p>

      {/* Capabilities */}
      <div className="mb-4">
        <p className="text-xs text-slate-500 mb-2">Capacidades:</p>
        <div className="flex flex-wrap gap-1">
          {integration.capabilities.slice(0, 3).map((cap, i) => (
            <span key={i} className="text-xs bg-slate-900 text-slate-400 px-2 py-1 rounded">
              {cap}
            </span>
          ))}
          {integration.capabilities.length > 3 && (
            <span className="text-xs bg-slate-900 text-slate-400 px-2 py-1 rounded">
              +{integration.capabilities.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="flex items-center gap-3 mb-4 text-xs text-slate-500">
        {integration.apiKeyRequired && (
          <div className="flex items-center gap-1">
            <Key size={12} />
            <span>API Key</span>
          </div>
        )}
        {integration.webhooksSupported && (
          <div className="flex items-center gap-1">
            <Zap size={12} />
            <span>Webhooks</span>
          </div>
        )}
      </div>

      {/* Last Sync */}
      {isConnected && integration.lastSync && (
        <div className="flex items-center gap-1 text-xs text-slate-500 mb-4">
          <Clock size={12} />
          <span>Última sinc: {new Date(integration.lastSync).toLocaleString('pt-BR')}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {!isConnected && !isConfiguring && (
          <button
            onClick={() => onConnect(integration)}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Conectar
          </button>
        )}

        {isConnected && (
          <>
            <button
              onClick={() => onTest(integration)}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Testar
            </button>
            <button
              onClick={() => onDisconnect(integration.id)}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-semibold transition-all"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}

        {integration.docsUrl && (
          <a
            href={integration.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center"
            title="Ver documentação"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>
    </div>
  );
};

// Config Modal Component
const ConfigModal: React.FC<{
  integration: MCPIntegration;
  onClose: () => void;
  onSave: (config: any) => void;
}> = ({ integration, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState(integration.config?.apiKey || '');
  const [webhookUrl, setWebhookUrl] = useState(integration.config?.webhookUrl || '');
  const [environment, setEnvironment] = useState(integration.config?.environment || 'production');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      apiKey,
      webhookUrl: integration.webhooksSupported ? webhookUrl : undefined,
      environment
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
          <div className="flex items-center gap-3">
            {React.createElement(integration.icon, { size: 32, className: 'text-blue-500' })}
            <div>
              <h2 className="text-2xl font-bold text-white">Configurar {integration.name}</h2>
              <p className="text-slate-400 text-sm">{integration.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Environment */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Ambiente
            </label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="production">Produção</option>
              <option value="sandbox">Sandbox / Teste</option>
            </select>
          </div>

          {/* API Key */}
          {integration.apiKeyRequired && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                <div className="flex items-center gap-2">
                  <Key size={16} />
                  API Key / Token
                </div>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk_live_..."
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-2">
                Obtenha sua chave em: {' '}
                <a 
                  href={integration.docsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  {integration.docsUrl}
                </a>
              </p>
            </div>
          )}

          {/* Webhook URL */}
          {integration.webhooksSupported && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                <div className="flex items-center gap-2">
                  <Zap size={16} />
                  Webhook URL (opcional)
                </div>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://seu-dominio.com/webhooks/advbox"
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Configure este endpoint no painel do {integration.name} para receber eventos em tempo real
              </p>
            </div>
          )}

          {/* Capabilities Info */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Shield size={16} />
              O que esta integração pode fazer:
            </h3>
            <ul className="space-y-2">
              {integration.capabilities.map((cap, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Check size={20} />
              Salvar e Conectar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MCPHub;
