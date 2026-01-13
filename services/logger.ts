// Logger Service - Sistema de logging centralizado

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  id?: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  workflow?: string;
  user?: string;
  action: string;
  details?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

class Logger {
  private logs: LogEntry[] = [];
  private subscribers: ((logs: LogEntry[]) => void)[] = [];
  private maxLogs = 1000; // Limite de logs em memória

  constructor() {
    // Carregar logs do localStorage
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('autoflow_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar logs do localStorage', error);
    }
  }

  private saveToStorage() {
    try {
      // Manter apenas os últimos maxLogs
      const logsToSave = this.logs.slice(-this.maxLogs);
      localStorage.setItem('autoflow_logs', JSON.stringify(logsToSave));
    } catch (error) {
      console.error('Erro ao salvar logs no localStorage', error);
    }
  }

  private notify() {
    this.subscribers.forEach(callback => callback([...this.logs]));
  }

  log(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
    const logEntry: LogEntry = {
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };

    this.logs.push(logEntry);
    
    // Manter limite de logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    this.saveToStorage();
    this.notify();

    // Log no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      const styles = {
        info: 'color: #3b82f6',
        success: 'color: #10b981',
        warning: 'color: #f59e0b',
        error: 'color: #f43f5e'
      };
      console.log(`%c[${entry.level.toUpperCase()}] ${entry.message}`, styles[entry.level], entry);
    }

    return logEntry;
  }

  info(message: string, options?: Partial<Omit<LogEntry, 'level' | 'message'>>) {
    return this.log({ level: 'info', message, action: options?.action || 'info', ...options });
  }

  success(message: string, options?: Partial<Omit<LogEntry, 'level' | 'message'>>) {
    return this.log({ level: 'success', message, action: options?.action || 'success', ...options });
  }

  warning(message: string, options?: Partial<Omit<LogEntry, 'level' | 'message'>>) {
    return this.log({ level: 'warning', message, action: options?.action || 'warning', ...options });
  }

  error(message: string, options?: Partial<Omit<LogEntry, 'level' | 'message'>>) {
    return this.log({ level: 'error', message, action: options?.action || 'error', ...options });
  }

  getLogs(): LogEntry[] {
    return [...this.logs].reverse(); // Mais recentes primeiro
  }

  subscribe(callback: (logs: LogEntry[]) => void) {
    this.subscribers.push(callback);
    // Retorna função de unsubscribe
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  clear() {
    this.logs = [];
    this.saveToStorage();
    this.notify();
  }

  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else {
      // CSV format
      const headers = ['timestamp', 'level', 'message', 'workflow', 'user', 'action', 'duration', 'details'];
      const rows = this.logs.map(log => 
        headers.map(h => {
          const value = log[h as keyof LogEntry];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value || '';
        }).join(',')
      );
      return [headers.join(','), ...rows].join('\n');
    }
  }

  // Métodos para ações específicas do sistema
  logWorkflowExecution(workflowName: string, user: string, success: boolean, duration: number, details?: string) {
    return this.log({
      level: success ? 'success' : 'error',
      message: success ? 'Workflow executado com sucesso' : 'Erro ao executar workflow',
      workflow: workflowName,
      user,
      action: 'workflow.execute',
      duration,
      details,
      metadata: { success, stepsCompleted: success ? 'all' : 'partial' }
    });
  }

  logVersionCreate(workflowName: string, version: string, user: string, tag?: string) {
    return this.info('Nova versão criada', {
      workflow: workflowName,
      user,
      action: 'version.create',
      details: `Versão ${version}${tag ? ` com tag "${tag}"` : ''} criada`,
      metadata: { version, tag }
    });
  }

  logTemplateApply(workflowName: string, templateName: string, user: string) {
    return this.success('Template aplicado com sucesso', {
      workflow: workflowName,
      user,
      action: 'template.apply',
      details: `Template "${templateName}" aplicado ao workflow`,
      metadata: { templateName }
    });
  }

  logAPIError(endpoint: string, statusCode: number, details?: string) {
    return this.error('Falha na integração com API externa', {
      action: 'api.error',
      details: details || `Erro ao conectar com ${endpoint}`,
      metadata: { endpoint, statusCode }
    });
  }

  logUserAction(action: string, user: string, details?: string) {
    return this.info(details || `Ação do usuário: ${action}`, {
      user,
      action: `user.${action}`,
      details
    });
  }

  logAIRouting(workflowName: string, ruleName: string, user: string, model: string) {
    return this.success('Regra de AI Routing criada', {
      workflow: workflowName,
      user,
      action: 'ai_routing.create',
      details: `Nova regra "${ruleName}" com ${model}`,
      metadata: { ruleName, model }
    });
  }

  logPerformanceWarning(workflowName: string, duration: number, expectedDuration: number) {
    return this.warning('Tempo de resposta acima do esperado', {
      workflow: workflowName,
      user: 'Sistema',
      action: 'performance.warning',
      duration,
      details: `A execução levou ${duration}s (limite: ${expectedDuration}s)`,
      metadata: { expectedDuration, actualDuration: duration }
    });
  }
}

// Singleton instance
export const logger = new Logger();

// Helper para medir tempo de execução
export async function withLogging<T>(
  fn: () => Promise<T>,
  logOptions: {
    workflow?: string;
    user?: string;
    action: string;
    successMessage: string;
    errorMessage: string;
  }
): Promise<T> {
  const startTime = performance.now();
  try {
    const result = await fn();
    const duration = (performance.now() - startTime) / 1000;
    logger.success(logOptions.successMessage, {
      workflow: logOptions.workflow,
      user: logOptions.user,
      action: logOptions.action,
      duration
    });
    return result;
  } catch (error) {
    const duration = (performance.now() - startTime) / 1000;
    logger.error(logOptions.errorMessage, {
      workflow: logOptions.workflow,
      user: logOptions.user,
      action: logOptions.action,
      duration,
      details: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
