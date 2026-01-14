/**
 * Zendesk MCP Integration
 * 
 * Help desk e suporte ao cliente
 * Docs: https://developer.zendesk.com/api-reference/
 */

export interface ZendeskConfig {
  subdomain: string; // Ex: 'mycompany' para mycompany.zendesk.com
  email: string; // Email do agente
  apiToken: string; // API Token
}

export interface ZendeskTicket {
  id?: number;
  url?: string;
  subject: string;
  description: string;
  status: 'new' | 'open' | 'pending' | 'hold' | 'solved' | 'closed';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  type?: 'problem' | 'incident' | 'question' | 'task';
  requester_id?: number;
  submitter_id?: number;
  assignee_id?: number;
  group_id?: number;
  tags?: string[];
  custom_fields?: Array<{ id: number; value: any }>;
  created_at?: string;
  updated_at?: string;
}

export interface ZendeskUser {
  id?: number;
  url?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'end-user' | 'agent' | 'admin';
  verified?: boolean;
  active?: boolean;
  locale?: string;
  time_zone?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  organization_id?: number;
}

export interface ZendeskComment {
  id?: number;
  type: 'Comment' | 'VoiceComment';
  body: string;
  html_body?: string;
  plain_body?: string;
  public: boolean;
  author_id?: number;
  attachments?: Array<{
    id?: number;
    file_name: string;
    content_url?: string;
    content_type?: string;
    size?: number;
  }>;
  created_at?: string;
}

export interface ZendeskOrganization {
  id?: number;
  name: string;
  domain_names?: string[];
  details?: string;
  notes?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export class ZendeskMCP {
  private config: ZendeskConfig;
  private baseUrl: string;
  private auth: string;

  constructor(config: ZendeskConfig) {
    this.config = config;
    this.baseUrl = `https://${config.subdomain}.zendesk.com/api/v2`;
    this.auth = Buffer.from(`${config.email}/token:${config.apiToken}`).toString('base64');
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Zendesk API Error: ${error.error || error.description || response.statusText}`);
    }

    return response.json();
  }

  // ========================================
  // TICKETS
  // ========================================

  /**
   * Cria ticket
   */
  async createTicket(ticket: ZendeskTicket & {
    requester?: { name: string; email: string };
  }): Promise<{ ticket: ZendeskTicket }> {
    return this.request('/tickets.json', {
      method: 'POST',
      body: JSON.stringify({ ticket })
    });
  }

  /**
   * Busca ticket
   */
  async getTicket(ticketId: number): Promise<{ ticket: ZendeskTicket }> {
    return this.request(`/tickets/${ticketId}.json`);
  }

  /**
   * Atualiza ticket
   */
  async updateTicket(ticketId: number, updates: Partial<ZendeskTicket>): Promise<{ ticket: ZendeskTicket }> {
    return this.request(`/tickets/${ticketId}.json`, {
      method: 'PUT',
      body: JSON.stringify({ ticket: updates })
    });
  }

  /**
   * Lista tickets
   */
  async listTickets(params?: {
    status?: string;
    sort_by?: 'created_at' | 'updated_at' | 'priority' | 'status';
    sort_order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
  }): Promise<{ tickets: ZendeskTicket[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/tickets.json?${query}`);
  }

  /**
   * Busca tickets
   */
  async searchTickets(query: string): Promise<{ results: ZendeskTicket[] }> {
    return this.request(`/search.json?query=type:ticket ${encodeURIComponent(query)}`);
  }

  /**
   * Adiciona comentário ao ticket
   */
  async addComment(ticketId: number, comment: {
    body: string;
    public?: boolean;
    uploads?: string[]; // Token de upload
  }): Promise<{ ticket: ZendeskTicket }> {
    return this.request(`/tickets/${ticketId}.json`, {
      method: 'PUT',
      body: JSON.stringify({
        ticket: {
          comment: {
            body: comment.body,
            public: comment.public ?? true,
            uploads: comment.uploads
          }
        }
      })
    });
  }

  /**
   * Lista comentários do ticket
   */
  async listComments(ticketId: number): Promise<{ comments: ZendeskComment[] }> {
    return this.request(`/tickets/${ticketId}/comments.json`);
  }

  /**
   * Marca ticket como resolvido
   */
  async resolveTicket(ticketId: number, comment?: string): Promise<{ ticket: ZendeskTicket }> {
    return this.updateTicket(ticketId, {
      status: 'solved',
      ...(comment && {
        comment: { body: comment, public: true } as any
      })
    });
  }

  // ========================================
  // USERS (USUÁRIOS)
  // ========================================

  /**
   * Cria usuário
   */
  async createUser(user: ZendeskUser): Promise<{ user: ZendeskUser }> {
    return this.request('/users.json', {
      method: 'POST',
      body: JSON.stringify({ user })
    });
  }

  /**
   * Busca usuário
   */
  async getUser(userId: number): Promise<{ user: ZendeskUser }> {
    return this.request(`/users/${userId}.json`);
  }

  /**
   * Busca usuário por email
   */
  async getUserByEmail(email: string): Promise<ZendeskUser | null> {
    const response = await this.request<{ users: ZendeskUser[] }>(
      `/users/search.json?query=${encodeURIComponent(email)}`
    );
    return response.users[0] || null;
  }

  /**
   * Atualiza usuário
   */
  async updateUser(userId: number, updates: Partial<ZendeskUser>): Promise<{ user: ZendeskUser }> {
    return this.request(`/users/${userId}.json`, {
      method: 'PUT',
      body: JSON.stringify({ user: updates })
    });
  }

  /**
   * Lista usuários
   */
  async listUsers(params?: {
    role?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ users: ZendeskUser[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/users.json?${query}`);
  }

  // ========================================
  // ORGANIZATIONS (ORGANIZAÇÕES)
  // ========================================

  /**
   * Cria organização
   */
  async createOrganization(org: ZendeskOrganization): Promise<{ organization: ZendeskOrganization }> {
    return this.request('/organizations.json', {
      method: 'POST',
      body: JSON.stringify({ organization: org })
    });
  }

  /**
   * Busca organização
   */
  async getOrganization(orgId: number): Promise<{ organization: ZendeskOrganization }> {
    return this.request(`/organizations/${orgId}.json`);
  }

  /**
   * Lista organizações
   */
  async listOrganizations(params?: {
    page?: number;
    per_page?: number;
  }): Promise<{ organizations: ZendeskOrganization[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/organizations.json?${query}`);
  }

  /**
   * Adiciona usuário a organização
   */
  async addUserToOrganization(userId: number, organizationId: number): Promise<{ user: ZendeskUser }> {
    return this.updateUser(userId, { organization_id: organizationId as any });
  }

  // ========================================
  // ATTACHMENTS (ANEXOS)
  // ========================================

  /**
   * Faz upload de arquivo
   */
  async uploadFile(params: {
    filename: string;
    content: Blob | BufferSource;
    contentType: string;
  }): Promise<{ upload: { token: string; attachment: any } }> {
    const body: BodyInit = params.content as BodyInit;

    const response = await fetch(
      `${this.baseUrl}/uploads.json?filename=${encodeURIComponent(params.filename)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Content-Type': params.contentType
        },
        body
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    return response.json();
  }

  // ========================================
  // MACROS (AUTOMAÇÕES)
  // ========================================

  /**
   * Lista macros
   */
  async listMacros(): Promise<{ macros: any[] }> {
    return this.request('/macros.json');
  }

  /**
   * Aplica macro a ticket
   */
  async applyMacro(ticketId: number, macroId: number): Promise<any> {
    return this.request(`/tickets/${ticketId}/macros/${macroId}/apply.json`);
  }

  // ========================================
  // WEBHOOKS
  // ========================================

  /**
   * Valida webhook do Zendesk
   */
  static validateWebhookSignature(params: {
    body: string;
    timestamp: string;
    signature: string;
    signingSecret: string;
  }): boolean {
    // Implementar validação HMAC-SHA256
    // const crypto = require('crypto');
    // const message = params.timestamp + params.body;
    // const hmac = crypto.createHmac('sha256', params.signingSecret);
    // const computed = hmac.update(message).digest('base64');
    // return computed === params.signature;
    return true;
  }

  /**
   * Processa evento de webhook
   */
  static processWebhookEvent(event: any): {
    type: string;
    ticketId?: number;
    userId?: number;
    data: any;
  } {
    return {
      type: event.type, // ticket_created, ticket_updated, comment_created, etc
      ticketId: event.ticket_id,
      userId: event.user_id,
      data: event
    };
  }

  // ========================================
  // TRIGGERS & AUTOMATIONS
  // ========================================

  /**
   * Lista triggers
   */
  async listTriggers(): Promise<{ triggers: any[] }> {
    return this.request('/triggers.json');
  }

  /**
   * Lista automações
   */
  async listAutomations(): Promise<{ automations: any[] }> {
    return this.request('/automations.json');
  }

  // ========================================
  // SATISFACTION RATINGS (PESQUISAS)
  // ========================================

  /**
   * Busca avaliações de satisfação
   */
  async getSatisfactionRatings(params?: {
    score?: 'good' | 'bad';
    start_time?: string; // ISO 8601
    end_time?: string;
  }): Promise<{ satisfaction_ratings: any[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/satisfaction_ratings.json?${query}`);
  }
}

// Exemplo de uso:
/*
const zendesk = new ZendeskMCP({
  subdomain: 'mycompany',
  email: 'agent@example.com',
  apiToken: 'your-api-token'
});

// Criar ticket
const ticket = await zendesk.createTicket({
  subject: 'Problema com login',
  description: 'Não consigo fazer login no sistema',
  status: 'new',
  priority: 'high',
  type: 'problem',
  requester: {
    name: 'João Silva',
    email: 'joao@example.com'
  },
  tags: ['login', 'urgent']
});

console.log('Ticket ID:', ticket.ticket.id);

// Adicionar comentário
await zendesk.addComment(ticket.ticket.id!, {
  body: 'Estamos investigando o problema.',
  public: true
});

// Buscar usuário
const user = await zendesk.getUserByEmail('joao@example.com');
if (user) {
  console.log('User ID:', user.id);
  
  // Criar organização
  const org = await zendesk.createOrganization({
    name: 'Acme Inc',
    domain_names: ['acme.com']
  });
  
  // Adicionar usuário à organização
  await zendesk.addUserToOrganization(user.id!, org.organization.id!);
}

// Resolver ticket
await zendesk.resolveTicket(ticket.ticket.id!, 'Problema resolvido. Tente novamente.');

// Buscar tickets abertos
const openTickets = await zendesk.searchTickets('status:open');
console.log('Tickets abertos:', openTickets.results.length);

// Upload de arquivo
const upload = await zendesk.uploadFile({
  filename: 'screenshot.png',
  content: imageBlob,
  contentType: 'image/png'
});

// Adicionar comentário com anexo
await zendesk.addComment(ticket.ticket.id!, {
  body: 'Segue screenshot do erro.',
  public: true,
  uploads: [upload.upload.token]
});
*/
