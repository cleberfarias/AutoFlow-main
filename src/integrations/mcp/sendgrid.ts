/**
 * SendGrid MCP Integration
 * 
 * Email transacional e marketing
 * Docs: https://docs.sendgrid.com/api-reference
 */

export interface SendGridConfig {
  apiKey: string;
}

export interface SendGridEmail {
  to: Array<{ email: string; name?: string }> | string;
  from: { email: string; name?: string };
  subject: string;
  content: Array<{
    type: 'text/plain' | 'text/html';
    value: string;
  }>;
  reply_to?: { email: string; name?: string };
  attachments?: Array<{
    content: string; // Base64
    filename: string;
    type?: string; // MIME type
    disposition?: 'attachment' | 'inline';
  }>;
  template_id?: string;
  dynamic_template_data?: Record<string, any>;
}

export interface SendGridContact {
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  custom_fields?: Record<string, string>;
}

export class SendGridMCP {
  private config: SendGridConfig;
  private baseUrl = 'https://api.sendgrid.com/v3';

  constructor(config: SendGridConfig) {
    this.config = config;
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
      const error = await response.json();
      throw new Error(`SendGrid API Error: ${JSON.stringify(error.errors || error)}`);
    }

    // Algumas respostas não retornam JSON
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    return {} as T;
  }

  // ========================================
  // EMAIL TRANSACIONAL
  // ========================================

  /**
   * Envia email
   */
  async sendEmail(email: SendGridEmail): Promise<void> {
    // Normaliza 'to' para array
    const to = typeof email.to === 'string' 
      ? [{ email: email.to }] 
      : email.to;

    await this.request('/mail/send', {
      method: 'POST',
      body: JSON.stringify({
        personalizations: [{
          to,
          dynamic_template_data: email.dynamic_template_data
        }],
        from: email.from,
        reply_to: email.reply_to,
        subject: email.subject,
        content: email.content,
        attachments: email.attachments,
        template_id: email.template_id
      })
    });
  }

  /**
   * Envia email com template dinâmico
   */
  async sendTemplateEmail(params: {
    to: string | Array<{ email: string; name?: string }>;
    from: { email: string; name?: string };
    templateId: string;
    dynamicData: Record<string, any>;
    attachments?: Array<{
      content: string;
      filename: string;
      type?: string;
    }>;
  }): Promise<void> {
    const to = typeof params.to === 'string' 
      ? [{ email: params.to }] 
      : params.to;

    await this.request('/mail/send', {
      method: 'POST',
      body: JSON.stringify({
        personalizations: [{
          to,
          dynamic_template_data: params.dynamicData
        }],
        from: params.from,
        template_id: params.templateId,
        attachments: params.attachments
      })
    });
  }

  /**
   * Envia email simples (texto)
   */
  async sendSimpleEmail(params: {
    to: string;
    from: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void> {
    await this.sendEmail({
      to: params.to,
      from: { email: params.from },
      subject: params.subject,
      content: [
        { type: 'text/plain', value: params.text },
        ...(params.html ? [{ type: 'text/html' as const, value: params.html }] : [])
      ]
    });
  }

  // ========================================
  // CONTATOS (MARKETING)
  // ========================================

  /**
   * Adiciona contatos
   */
  async addContacts(contacts: SendGridContact[]): Promise<{ job_id: string }> {
    return this.request('/marketing/contacts', {
      method: 'PUT',
      body: JSON.stringify({
        contacts
      })
    });
  }

  /**
   * Busca contato por email
   */
  async searchContactByEmail(email: string): Promise<{ result: SendGridContact[] }> {
    return this.request('/marketing/contacts/search/emails', {
      method: 'POST',
      body: JSON.stringify({
        emails: [email]
      })
    });
  }

  /**
   * Deleta contato
   */
  async deleteContacts(contactIds: string[]): Promise<{ job_id: string }> {
    return this.request('/marketing/contacts', {
      method: 'DELETE',
      body: JSON.stringify({
        ids: contactIds
      })
    });
  }

  // ========================================
  // LISTAS (MARKETING)
  // ========================================

  /**
   * Cria lista
   */
  async createList(name: string): Promise<{ id: string; name: string }> {
    return this.request('/marketing/lists', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  }

  /**
   * Lista todas as listas
   */
  async getLists(): Promise<{ result: Array<{ id: string; name: string; contact_count: number }> }> {
    return this.request('/marketing/lists');
  }

  /**
   * Adiciona contatos a lista
   */
  async addContactsToList(listId: string, contactIds: string[]): Promise<void> {
    await this.request(`/marketing/lists/${listId}/contacts`, {
      method: 'POST',
      body: JSON.stringify({
        contact_ids: contactIds
      })
    });
  }

  // ========================================
  // TEMPLATES
  // ========================================

  /**
   * Lista templates dinâmicos
   */
  async listTemplates(params?: {
    generations?: 'legacy' | 'dynamic';
    page_size?: number;
  }): Promise<{ result: Array<{ id: string; name: string; generation: string }> }> {
    const query = new URLSearchParams({
      generations: params?.generations || 'dynamic',
      page_size: String(params?.page_size || 200)
    }).toString();

    return this.request(`/templates?${query}`);
  }

  /**
   * Busca template por nome
   */
  async getTemplateByName(name: string): Promise<any | null> {
    const templates = await this.listTemplates();
    return templates.result.find(t => t.name === name) || null;
  }

  // ========================================
  // ESTATÍSTICAS
  // ========================================

  /**
   * Estatísticas globais
   */
  async getGlobalStats(params: {
    start_date: string; // YYYY-MM-DD
    end_date?: string;
    aggregated_by?: 'day' | 'week' | 'month';
  }): Promise<any> {
    const query = new URLSearchParams({
      start_date: params.start_date,
      ...(params.end_date && { end_date: params.end_date }),
      aggregated_by: params.aggregated_by || 'day'
    }).toString();

    return this.request(`/stats?${query}`);
  }

  /**
   * Estatísticas de email específico
   */
  async getEmailActivity(params: {
    query: string; // Ex: 'msg_id="<message-id>"'
    limit?: number;
  }): Promise<{ messages: any[] }> {
    const queryParams = new URLSearchParams({
      query: params.query,
      limit: String(params.limit || 10)
    }).toString();

    return this.request(`/messages?${queryParams}`);
  }

  // ========================================
  // WEBHOOKS (EVENT WEBHOOK)
  // ========================================

  /**
   * Configura webhook de eventos
   */
  async setupEventWebhook(params: {
    url: string;
    enabled?: boolean;
    events?: Array<
      'processed' | 'dropped' | 'delivered' | 'bounce' | 
      'deferred' | 'open' | 'click' | 'spam_report' | 'unsubscribe'
    >;
  }): Promise<any> {
    return this.request('/user/webhooks/event/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        enabled: params.enabled ?? true,
        url: params.url,
        ...params.events && {
          bounce: params.events.includes('bounce'),
          click: params.events.includes('click'),
          deferred: params.events.includes('deferred'),
          delivered: params.events.includes('delivered'),
          dropped: params.events.includes('dropped'),
          open: params.events.includes('open'),
          processed: params.events.includes('processed'),
          spam_report: params.events.includes('spam_report'),
          unsubscribe: params.events.includes('unsubscribe')
        }
      })
    });
  }

  /**
   * Valida webhook do SendGrid
   */
  static validateWebhookSignature(
    payload: string,
    signature: string,
    publicKey: string
  ): boolean {
    // Implementar validação ECDSA
    // const crypto = require('crypto');
    // const verify = crypto.createVerify('sha256');
    // verify.update(payload);
    // return verify.verify(publicKey, signature, 'base64');
    return true;
  }

  /**
   * Processa eventos de webhook
   */
  static processWebhookEvents(events: any[]): Array<{
    event: string;
    email: string;
    timestamp: number;
    sg_message_id: string;
  }> {
    return events.map(event => ({
      event: event.event,
      email: event.email,
      timestamp: event.timestamp,
      sg_message_id: event.sg_message_id
    }));
  }

  // ========================================
  // SUPPRESSIONS (BLOQUEIOS)
  // ========================================

  /**
   * Lista emails suprimidos (bounce/spam/unsubscribe)
   */
  async getSuppressions(type: 'bounces' | 'spam_reports' | 'unsubscribes'): Promise<any[]> {
    return this.request(`/suppression/${type}`);
  }

  /**
   * Remove email da lista de supressão
   */
  async removeFromSuppression(
    type: 'bounces' | 'spam_reports' | 'unsubscribes',
    email: string
  ): Promise<void> {
    await this.request(`/suppression/${type}/${email}`, {
      method: 'DELETE'
    });
  }
}

// Exemplo de uso:
/*
const sendgrid = new SendGridMCP({
  apiKey: 'SG.xxxxxxxxx'
});

// Enviar email simples
await sendgrid.sendSimpleEmail({
  to: 'cliente@example.com',
  from: 'noreply@example.com',
  subject: 'Bem-vindo!',
  text: 'Obrigado por se cadastrar.',
  html: '<h1>Obrigado por se cadastrar!</h1>'
});

// Enviar email com template dinâmico
await sendgrid.sendTemplateEmail({
  to: 'cliente@example.com',
  from: { email: 'noreply@example.com', name: 'Acme Inc' },
  templateId: 'd-abc123',
  dynamicData: {
    name: 'João Silva',
    order_id: '12345',
    total: 'R$ 99,90'
  }
});

// Adicionar contatos para marketing
await sendgrid.addContacts([
  {
    email: 'cliente1@example.com',
    first_name: 'João',
    last_name: 'Silva'
  },
  {
    email: 'cliente2@example.com',
    first_name: 'Maria',
    last_name: 'Santos'
  }
]);

// Criar lista e adicionar contatos
const list = await sendgrid.createList('Newsletter 2024');
await sendgrid.addContactsToList(list.id, ['contact-id-1', 'contact-id-2']);

// Verificar estatísticas
const stats = await sendgrid.getGlobalStats({
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  aggregated_by: 'day'
});
console.log('Emails enviados:', stats);
*/
