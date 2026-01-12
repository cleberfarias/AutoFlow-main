/**
 * Advbox MCP Integration
 * 
 * Sistema de gestão jurídica - Processos, prazos e clientes
 * Docs: https://docs.advbox.com.br/api
 */

export interface AdvboxConfig {
  apiKey: string;
  environment: 'production' | 'sandbox';
  webhookUrl?: string;
}

export interface AdvboxProcess {
  id: string;
  numero: string;
  cliente_id: string;
  assunto: string;
  vara: string;
  comarca: string;
  uf: string;
  status: string;
  data_distribuicao: string;
  valor_causa?: number;
}

export interface AdvboxDeadline {
  id: string;
  processo_id: string;
  tipo: string;
  data_prazo: string;
  dias_restantes: number;
  status: 'pendente' | 'cumprido' | 'vencido';
  observacao?: string;
}

export interface AdvboxClient {
  id: string;
  nome: string;
  cpf_cnpj: string;
  email?: string;
  telefone?: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
}

export class AdvboxMCP {
  private config: AdvboxConfig;
  private baseUrl: string;

  constructor(config: AdvboxConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'production'
      ? 'https://api.advbox.com.br/v1'
      : 'https://sandbox.api.advbox.com.br/v1';
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });

    if (!response.ok) {
      throw new Error(`Advbox API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ========================================
  // PROCESSOS
  // ========================================

  /**
   * Lista todos os processos
   */
  async listProcesses(params?: {
    cliente_id?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AdvboxProcess[]; total: number }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/processos?${query}`);
  }

  /**
   * Busca um processo específico
   */
  async getProcess(processId: string): Promise<AdvboxProcess> {
    return this.request(`/processos/${processId}`);
  }

  /**
   * Busca processo por número
   */
  async getProcessByNumber(numero: string): Promise<AdvboxProcess> {
    return this.request(`/processos/numero/${numero}`);
  }

  /**
   * Cria novo processo
   */
  async createProcess(data: Partial<AdvboxProcess>): Promise<AdvboxProcess> {
    return this.request('/processos', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Atualiza processo
   */
  async updateProcess(processId: string, data: Partial<AdvboxProcess>): Promise<AdvboxProcess> {
    return this.request(`/processos/${processId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // ========================================
  // PRAZOS
  // ========================================

  /**
   * Lista prazos próximos
   */
  async listDeadlines(params?: {
    processo_id?: string;
    status?: string;
    dias?: number; // próximos X dias
  }): Promise<{ data: AdvboxDeadline[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/prazos?${query}`);
  }

  /**
   * Cria novo prazo
   */
  async createDeadline(data: Partial<AdvboxDeadline>): Promise<AdvboxDeadline> {
    return this.request('/prazos', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Marca prazo como cumprido
   */
  async completeDeadline(deadlineId: string): Promise<AdvboxDeadline> {
    return this.request(`/prazos/${deadlineId}/cumprir`, {
      method: 'POST'
    });
  }

  // ========================================
  // CLIENTES
  // ========================================

  /**
   * Lista clientes
   */
  async listClients(params?: {
    search?: string;
    tipo?: 'pessoa_fisica' | 'pessoa_juridica';
    page?: number;
  }): Promise<{ data: AdvboxClient[]; total: number }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/clientes?${query}`);
  }

  /**
   * Busca cliente específico
   */
  async getClient(clientId: string): Promise<AdvboxClient> {
    return this.request(`/clientes/${clientId}`);
  }

  /**
   * Cria novo cliente
   */
  async createClient(data: Partial<AdvboxClient>): Promise<AdvboxClient> {
    return this.request('/clientes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Atualiza cliente
   */
  async updateClient(clientId: string, data: Partial<AdvboxClient>): Promise<AdvboxClient> {
    return this.request(`/clientes/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // ========================================
  // WEBHOOKS
  // ========================================

  /**
   * Valida assinatura do webhook
   */
  static validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // Implementar validação HMAC
    // const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    // return signature === expectedSignature;
    return true;
  }

  /**
   * Processa evento de webhook
   */
  static processWebhookEvent(event: any): {
    type: string;
    data: any;
  } {
    return {
      type: event.event_type,
      data: event.data
    };
  }
}

// Exemplo de uso:
/*
const advbox = new AdvboxMCP({
  apiKey: process.env.ADVBOX_API_KEY!,
  environment: 'production',
  webhookUrl: 'https://seu-dominio.com/webhooks/advbox'
});

// Listar processos de um cliente
const processos = await advbox.listProcesses({ cliente_id: '123' });

// Buscar prazos próximos (próximos 7 dias)
const prazos = await advbox.listDeadlines({ dias: 7, status: 'pendente' });

// Criar novo cliente
const cliente = await advbox.createClient({
  nome: 'João Silva',
  cpf_cnpj: '123.456.789-00',
  email: 'joao@example.com',
  tipo: 'pessoa_fisica'
});
*/
