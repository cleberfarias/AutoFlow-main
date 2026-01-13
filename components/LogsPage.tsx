import React, { useState, useEffect } from 'react';
import { 
  FileText, AlertCircle, CheckCircle2, Info, AlertTriangle,
  Search, Filter, Download, RefreshCw, Clock, User, 
  Zap, Database, MessageSquare, GitBranch, Eye, Trash2
} from 'lucide-react';
import { logger, LogEntry } from '../services/logger';

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Carregar logs e subscrever para atualizações
  useEffect(() => {
    // Carregar logs iniciais
    setLogs(logger.getLogs());

    // Subscrever para atualizações em tempo real
    const unsubscribe = logger.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });

    return unsubscribe;
  }, []);

  // Simular alguns logs iniciais se não houver nenhum
  useEffect(() => {
    if (logs.length === 0) {
      logger.info('Sistema inicializado', {
        action: 'system.init',
        user: 'Sistema',
        details: 'AutoFlow iniciado com sucesso'
      });
      logger.success('Workflows carregados', {
        action: 'workflows.load',
        user: 'Sistema',
        details: 'Todos os workflows foram carregados da memória'
      });
    }
  }, []);

  const mockLogs: LogEntry[] = [
    {
      id: '1',
      timestamp: '2026-01-13T16:35:42',
      level: 'success',
      message: 'Workflow executado com sucesso',
      workflow: 'Atendimento Cliente VIP',
      user: 'João Silva',
      action: 'workflow.execute',
      duration: 1.2,
      details: 'Todas as 12 etapas foram concluídas sem erros',
      metadata: { stepsCompleted: 12, clientId: 'CLI-001' }
    },
    {
      id: '2',
      timestamp: '2026-01-13T16:34:15',
      level: 'info',
      message: 'Nova versão criada',
      workflow: 'Funil de Vendas',
      user: 'Maria Santos',
      action: 'version.create',
      details: 'Versão v1.5.3 criada com tag "hotfix"',
      metadata: { version: 'v1.5.3', tag: 'hotfix' }
    },
    {
      id: '3',
      timestamp: '2026-01-13T16:33:28',
      level: 'warning',
      message: 'Tempo de resposta acima do esperado',
      workflow: 'Suporte Técnico N1',
      user: 'Sistema',
      action: 'performance.warning',
      duration: 4.8,
      details: 'A etapa de roteamento AI levou 4.8s (limite: 3s)',
      metadata: { expectedDuration: 3, actualDuration: 4.8 }
    },
    {
      id: '4',
      timestamp: '2026-01-13T16:32:03',
      level: 'error',
      message: 'Falha na integração com API externa',
      workflow: 'Carrinho Abandonado',
      user: 'Sistema',
      action: 'api.error',
      details: 'Timeout ao conectar com gateway de pagamento (30s)',
      metadata: { endpoint: '/api/payments', statusCode: 504 }
    },
    {
      id: '5',
      timestamp: '2026-01-13T16:31:45',
      level: 'success',
      message: 'Template aplicado com sucesso',
      workflow: 'Pesquisa de Satisfação',
      user: 'Ana Paula',
      action: 'template.apply',
      details: 'Template "NPS Padrão" aplicado ao workflow',
      metadata: { templateId: 'TPL-005', templateName: 'NPS Padrão' }
    },
    {
      id: '6',
      timestamp: '2026-01-13T16:30:12',
      level: 'info',
      message: 'Workflow iniciado por trigger',
      workflow: 'Atendimento Cliente VIP',
      user: 'Sistema',
      action: 'workflow.trigger',
      details: 'Trigger: Mensagem WhatsApp recebida',
      metadata: { triggerType: 'whatsapp', phone: '+5511999999999' }
    },
    {
      id: '7',
      timestamp: '2026-01-13T16:29:37',
      level: 'warning',
      message: 'Limite de API se aproximando',
      user: 'Sistema',
      action: 'quota.warning',
      details: 'OpenAI API: 85% do limite mensal atingido',
      metadata: { service: 'OpenAI', usage: 85, limit: 100 }
    },
    {
      id: '8',
      timestamp: '2026-01-13T16:28:55',
      level: 'success',
      message: 'Backup automático concluído',
      user: 'Sistema',
      action: 'backup.complete',
      duration: 0.8,
      details: 'Backup de 15 workflows e 234 execuções salvo',
      metadata: { workflows: 15, executions: 234, size: '2.3MB' }
    },
    {
      id: '9',
      timestamp: '2026-01-13T16:27:21',
      level: 'info',
      message: 'Novo usuário conectado',
      user: 'Pedro Costa',
      action: 'user.login',
      details: 'Login via Google OAuth',
      metadata: { method: 'oauth', provider: 'google' }
    },
    {
      id: '10',
      timestamp: '2026-01-13T16:26:08',
      level: 'error',
      message: 'Validação de dados falhou',
      workflow: 'Funil de Vendas',
      user: 'Carlos Oliveira',
      action: 'validation.error',
      details: 'Campo "email" com formato inválido',
      metadata: { field: 'email', value: 'invalid-email', rule: 'email_format' }
    },
    {
      id: '11',
      timestamp: '2026-01-13T16:25:42',
      level: 'success',
      message: 'Regra de AI Routing criada',
      workflow: 'Suporte Técnico N1',
      user: 'Fernanda Lima',
      action: 'ai_routing.create',
      details: 'Nova regra "Prioridade Urgente" com GPT-4o',
      metadata: { ruleName: 'Prioridade Urgente', model: 'gpt-4o' }
    },
    {
      id: '12',
      timestamp: '2026-01-13T16:24:19',
      level: 'info',
      message: 'Sincronização MCP concluída',
      user: 'Sistema',
      action: 'mcp.sync',
      duration: 2.1,
      details: 'Sincronizados 8 serviços MCP',
      metadata: { services: ['stripe', 'sendgrid', 'twilio', 'hubspot', 'zendesk', 'google-calendar', 'docusign', 'mongodb'] }
    }
  ];

  // Usar logs reais se houver, senão usar mockLogs para demonstração
  const displayLogs = logs.length > 0 ? logs : mockLogs;

  const levels = [
    { id: 'all', label: 'Todos', color: 'slate', count: displayLogs.length },
    { id: 'info', label: 'Info', color: 'blue', count: displayLogs.filter(l => l.level === 'info').length },
    { id: 'success', label: 'Sucesso', color: 'emerald', count: displayLogs.filter(l => l.level === 'success').length },
    { id: 'warning', label: 'Aviso', color: 'amber', count: displayLogs.filter(l => l.level === 'warning').length },
    { id: 'error', label: 'Erro', color: 'rose', count: displayLogs.filter(l => l.level === 'error').length }
  ];

  const filteredLogs = displayLogs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.workflow?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.details?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const stats = {
    total: displayLogs.length,
    info: displayLogs.filter(l => l.level === 'info').length,
    success: displayLogs.filter(l => l.level === 'success').length,
    warnings: displayLogs.filter(l => l.level === 'warning').length,
    errors: displayLogs.filter(l => l.level === 'error').length
  };

  // Função para exportar logs
  const handleExport = (format: 'json' | 'csv' = 'json') => {
    const data = logger.exportLogs(format);
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autoflow-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    logger.info('Logs exportados', {
      action: 'logs.export',
      user: 'Usuário',
      details: `Logs exportados em formato ${format.toUpperCase()}`,
      metadata: { format, count: displayLogs.length }
    });
  };

  // Função para limpar logs
  const handleClear = () => {
    if (confirm('Tem certeza que deseja limpar todos os logs? Esta ação não pode ser desfeita.')) {
      logger.clear();
      logger.info('Logs limpos', {
        action: 'logs.clear',
        user: 'Usuário',
        details: 'Todos os logs foram removidos'
      });
    }
  };

  const getLevelIcon = (level: string) => {
    const icons = {
      info: Info,
      success: CheckCircle2,
      warning: AlertTriangle,
      error: AlertCircle
    };
    return icons[level as keyof typeof icons] || Info;
  };

  const getLevelColor = (level: string) => {
    const colors = {
      info: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      warning: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      error: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    };
    return colors[level as keyof typeof colors] || colors.info;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    return date.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
              <FileText size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Logs</h1>
              <p className="text-slate-400">Monitoramento e auditoria de atividades do sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                autoRefresh 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              <RefreshCw size={18} className={autoRefresh ? 'animate-spin' : ''} />
              Auto-refresh
            </button>
            <button 
              onClick={() => handleExport('json')}
              className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
            >
              <Download size={20} />
              Exportar
            </button>
            <button 
              onClick={handleClear}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
            >
              <Trash2 size={20} />
              Limpar
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-slate-500/10 rounded-lg">
                <FileText size={20} className="text-slate-400" />
              </div>
              <span className="text-slate-400 text-sm">Total</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-slate-400 mt-1">Registros</div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Info size={20} className="text-blue-400" />
              </div>
              <span className="text-slate-400 text-sm">Info</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.info}</div>
            <div className="text-sm text-blue-400 mt-1">{((stats.info/stats.total)*100).toFixed(0)}%</div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle2 size={20} className="text-emerald-400" />
              </div>
              <span className="text-slate-400 text-sm">Sucesso</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.success}</div>
            <div className="text-sm text-emerald-400 mt-1">{((stats.success/stats.total)*100).toFixed(0)}%</div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <AlertTriangle size={20} className="text-amber-400" />
              </div>
              <span className="text-slate-400 text-sm">Avisos</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.warnings}</div>
            <div className="text-sm text-amber-400 mt-1">{((stats.warnings/stats.total)*100).toFixed(0)}%</div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <AlertCircle size={20} className="text-rose-400" />
              </div>
              <span className="text-slate-400 text-sm">Erros</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.errors}</div>
            <div className="text-sm text-rose-400 mt-1">{((stats.errors/stats.total)*100).toFixed(0)}%</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar em logs (mensagem, workflow, ação, detalhes)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <button className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
              <Filter size={20} className="text-slate-300" />
            </button>
          </div>

          {/* Level Filters */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm mr-2">Nível:</span>
            {levels.map(level => (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedLevel === level.id
                    ? `bg-${level.color}-500 text-white`
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                style={selectedLevel === level.id ? {
                  backgroundColor: level.id === 'all' ? '#475569' : 
                                 level.id === 'info' ? '#3b82f6' :
                                 level.id === 'success' ? '#10b981' :
                                 level.id === 'warning' ? '#f59e0b' : '#f43f5e'
                } : undefined}
              >
                {level.label} ({level.count})
              </button>
            ))}
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Clock size={20} className="text-cyan-400" />
              Logs Recentes
              <span className="text-sm text-slate-400 ml-2">({filteredLogs.length} resultados)</span>
            </h2>
          </div>

          <div className="divide-y divide-slate-700 max-h-[600px] overflow-y-auto">
            {filteredLogs.map(log => {
              const LevelIcon = getLevelIcon(log.level);
              return (
                <div key={log.id} className="p-6 hover:bg-slate-750 transition-colors group">
                  <div className="flex items-start gap-4">
                    {/* Level Icon */}
                    <div className={`p-2 rounded-lg border ${getLevelColor(log.level)}`}>
                      <LevelIcon size={20} />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white font-semibold mb-1">{log.message}</h3>
                          <p className="text-sm text-slate-400">{log.details}</p>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-sm text-slate-400 mt-3">
                        {log.workflow && (
                          <div className="flex items-center gap-1">
                            <GitBranch size={14} />
                            <span>{log.workflow}</span>
                          </div>
                        )}
                        {log.user && (
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            <span>{log.user}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Zap size={14} />
                          <span className="font-mono text-xs">{log.action}</span>
                        </div>
                        {log.duration && (
                          <div className="flex items-center gap-1 text-cyan-400">
                            <Clock size={14} />
                            <span>{log.duration}s</span>
                          </div>
                        )}
                      </div>

                      {/* Metadata badges */}
                      {log.metadata && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {Object.entries(log.metadata).slice(0, 3).map(([key, value]) => (
                            <span key={key} className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded font-mono">
                              {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Ver detalhes"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {filteredLogs.length === 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-16 text-center">
            <FileText size={64} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum log encontrado</h3>
            <p className="text-slate-400 mb-6">
              Tente ajustar seus filtros ou buscar por outros termos.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLevel('all');
              }}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-500/20 rounded-xl">
              <FileText size={24} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Sistema de Logs</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">
                Todos os eventos do sistema são registrados automaticamente para auditoria e debugging. 
                Os logs incluem execuções de workflows, erros, avisos, alterações de configuração e 
                atividades dos usuários. Você pode exportar logs para análise externa.
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>• Retenção: 90 dias</span>
                <span>• Auto-refresh: Tempo real</span>
                <span>• Exportação: CSV/JSON</span>
                <span>• Busca avançada</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-3xl w-full max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Detalhes do Log</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Mensagem</label>
                <div className="text-white font-semibold">{selectedLog.message}</div>
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-1 block">Detalhes</label>
                <div className="text-slate-300">{selectedLog.details}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm mb-1 block">Nível</label>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${getLevelColor(selectedLog.level)}`}>
                    {React.createElement(getLevelIcon(selectedLog.level), { size: 16 })}
                    {selectedLog.level}
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-sm mb-1 block">Ação</label>
                  <div className="text-white font-mono text-sm">{selectedLog.action}</div>
                </div>
                {selectedLog.workflow && (
                  <div>
                    <label className="text-slate-400 text-sm mb-1 block">Workflow</label>
                    <div className="text-white">{selectedLog.workflow}</div>
                  </div>
                )}
                {selectedLog.user && (
                  <div>
                    <label className="text-slate-400 text-sm mb-1 block">Usuário</label>
                    <div className="text-white">{selectedLog.user}</div>
                  </div>
                )}
                <div>
                  <label className="text-slate-400 text-sm mb-1 block">Timestamp</label>
                  <div className="text-white">
                    {new Date(selectedLog.timestamp).toLocaleString('pt-BR')}
                  </div>
                </div>
                {selectedLog.duration && (
                  <div>
                    <label className="text-slate-400 text-sm mb-1 block">Duração</label>
                    <div className="text-cyan-400">{selectedLog.duration}s</div>
                  </div>
                )}
              </div>
              {selectedLog.metadata && (
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">Metadata</label>
                  <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm text-slate-300 overflow-x-auto">
{JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-6 flex gap-3">
              <button
                onClick={() => setSelectedLog(null)}
                className="flex-1 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Fechar
              </button>
              <button 
                onClick={() => {
                  if (selectedLog) {
                    const data = JSON.stringify(selectedLog, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `log-${selectedLog.id}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }
                }}
                className="flex items-center gap-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
              >
                <Download size={18} />
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
