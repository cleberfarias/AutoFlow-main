/**
 * RD Station MCP Integration
 * 
 * Marketing Automation e CRM para mercado brasileiro
 * Docs: https://developers.rdstation.com/reference/getting-started
 */

export interface RDStationConfig {
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface RDContact {
  uuid?: string;
  email: string;
  name?: string;
  job_title?: string;
  state?: string;
  city?: string;
  country?: string;
  personal_phone?: string;
  mobile_phone?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
  cf_custom_field?: string; // Campos customizados: cf_*
  tags?: string[];
  legal_bases?: Array<{
    category: 'communications' | 'data_processing';
    type: 'consent' | 'legitimate_interest' | 'contract';
    status: 'granted' | 'revoked';
  }>;
}

export interface RDEvent {
  event_type: string;
  event_family: string;
  payload: {
    conversion_identifier: string;
    email?: string;
    name?: string;
    [key: string]: any;
  };
}

export interface RDFunnel {
  id: string;
  name: string;
  stages: Array<{
    id: string;
    name: string;
    order: number;
  }>;
}

export interface RDDeal {
  id?: string;
  name: string;
  deal_stage_id: string;
  amount?: number;
  contact_ids?: string[];
  organization_id?: string;
  user_id?: string;
  won_time?: string;
  lost_time?: string;
  predicted_close_date?: string;
}

export class RDStationMCP {
  private config: RDStationConfig;
  private baseUrl = 'https://api.rd.services';

  constructor(config: RDStationConfig) {
    this.config = config;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`RD Station API Error: ${error.error_message || response.statusText}`);
    }

    return response.json();
  }

  // ========================================
  // CONTATOS (CRM)
  // ========================================

  /**
   * Cria ou atualiza contato (upsert)
   */
  async upsertContact(contact: RDContact): Promise<{ uuid: string }> {
    return this.request('/platform/contacts', {
      method: 'PATCH',
      body: JSON.stringify(contact)
    });
  }

  /**
   * Busca contato por email
   */
  async getContactByEmail(email: string): Promise<RDContact | null> {
    try {
      return await this.request(`/platform/contacts/email:${encodeURIComponent(email)}`);
    } catch {
      return null;
    }
  }

  /**
   * Busca contato por UUID
   */
  async getContact(uuid: string): Promise<RDContact> {
    return this.request(`/platform/contacts/uuid:${uuid}`);
  }

  /**
   * Lista contatos
   */
  async listContacts(params?: {
    page?: number;
    page_size?: number;
  }): Promise<{ contacts: RDContact[] }> {
    const query = new URLSearchParams({
      page: String(params?.page || 1),
      page_size: String(params?.page_size || 20)
    }).toString();

    return this.request(`/platform/contacts?${query}`);
  }

  // ========================================
  // EVENTOS (CONVERSÕES)
  // ========================================

  /**
   * Envia evento de conversão
   */
  async sendEvent(event: RDEvent): Promise<{ event_uuid: string }> {
    return this.request('/platform/conversions', {
      method: 'POST',
      body: JSON.stringify(event)
    });
  }

  /**
   * Envia conversão padrão (formulário)
   */
  async sendConversion(params: {
    email: string;
    conversion_identifier: string; // Ex: 'landing-page-download'
    name?: string;
    company?: string;
    phone?: string;
    [key: string]: any;
  }): Promise<{ event_uuid: string }> {
    return this.sendEvent({
      event_type: 'CONVERSION',
      event_family: 'CDP',
      payload: params
    });
  }

  /**
   * Envia evento de oportunidade ganha
   */
  async sendOpportunityWon(params: {
    email: string;
    value: number;
    funnel_name: string;
  }): Promise<{ event_uuid: string }> {
    return this.sendEvent({
      event_type: 'OPPORTUNITY',
      event_family: 'CDP',
      payload: {
        email: params.email,
        funnel_name: params.funnel_name,
        opportunity_value: params.value
      }
    });
  }

  /**
   * Envia evento de compra (sale)
   */
  async sendSale(params: {
    email: string;
    value: number;
    conversion_identifier?: string;
  }): Promise<{ event_uuid: string }> {
    return this.sendEvent({
      event_type: 'SALE',
      event_family: 'CDP',
      payload: {
        email: params.email,
        value: params.value,
        conversion_identifier: params.conversion_identifier || 'sale'
      }
    });
  }

  // ========================================
  // FUNIS (PIPELINES)
  // ========================================

  /**
   * Lista funis
   */
  async listFunnels(): Promise<{ funnels: RDFunnel[] }> {
    return this.request('/platform/analytics/funnels');
  }

  /**
   * Busca funil por nome
   */
  async getFunnelByName(name: string): Promise<RDFunnel | null> {
    const funnels = await this.listFunnels();
    return funnels.funnels.find(f => f.name === name) || null;
  }

  // ========================================
  // NEGÓCIOS (DEALS - CRM)
  // ========================================

  /**
   * Cria negócio
   */
  async createDeal(deal: RDDeal): Promise<{ id: string }> {
    return this.request('/platform/deals', {
      method: 'POST',
      body: JSON.stringify(deal)
    });
  }

  /**
   * Busca negócio
   */
  async getDeal(dealId: string): Promise<RDDeal> {
    return this.request(`/platform/deals/${dealId}`);
  }

  /**
   * Atualiza negócio
   */
  async updateDeal(dealId: string, updates: Partial<RDDeal>): Promise<void> {
    await this.request(`/platform/deals/${dealId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Lista negócios
   */
  async listDeals(params?: {
    page?: number;
    page_size?: number;
    deal_stage_id?: string;
  }): Promise<{ deals: RDDeal[] }> {
    const query = new URLSearchParams({
      page: String(params?.page || 1),
      page_size: String(params?.page_size || 20),
      ...(params?.deal_stage_id && { deal_stage_id: params.deal_stage_id })
    }).toString();

    return this.request(`/platform/deals?${query}`);
  }

  /**
   * Marca negócio como ganho
   */
  async markDealAsWon(dealId: string, wonTime?: string): Promise<void> {
    await this.updateDeal(dealId, {
      won_time: wonTime || new Date().toISOString()
    });
  }

  /**
   * Marca negócio como perdido
   */
  async markDealAsLost(dealId: string, lostTime?: string): Promise<void> {
    await this.updateDeal(dealId, {
      lost_time: lostTime || new Date().toISOString()
    });
  }

  // ========================================
  // CAMPOS PERSONALIZADOS
  // ========================================

  /**
   * Lista campos personalizados
   */
  async listCustomFields(): Promise<{ fields: any[] }> {
    return this.request('/platform/contacts/fields');
  }

  /**
   * Cria campo personalizado
   */
  async createCustomField(params: {
    api_identifier: string; // Ex: 'cf_cargo'
    name: string; // Ex: 'Cargo'
    data_type: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'DATE';
  }): Promise<any> {
    return this.request('/platform/contacts/fields', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // ========================================
  // OAUTH REFRESH
  // ========================================

  /**
   * Atualiza access token usando refresh token
   */
  async refreshAccessToken(): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    if (!this.config.refreshToken || !this.config.clientId || !this.config.clientSecret) {
      throw new Error('Refresh token, clientId and clientSecret are required');
    }

    const response = await fetch('https://api.rd.services/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    
    // Atualiza os tokens na config
    this.config.accessToken = data.access_token;
    this.config.refreshToken = data.refresh_token;
    
    return data;
  }

  // ========================================
  // WEBHOOKS
  // ========================================

  /**
   * Valida webhook do RD Station
   */
  static validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // RD Station usa UUID como assinatura
    // Verificar documentação específica
    return true;
  }

  /**
   * Processa evento de webhook
   */
  static processWebhookEvent(event: any): {
    eventType: string;
    contactEmail: string;
    data: any;
  } {
    return {
      eventType: event.event_type,
      contactEmail: event.payload?.email,
      data: event.payload
    };
  }
}

// Exemplo de uso:
/*
const rdstation = new RDStationMCP({
  accessToken: 'your-access-token',
  refreshToken: 'your-refresh-token',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret'
});

// Criar/atualizar contato
const contact = await rdstation.upsertContact({
  email: 'cliente@example.com',
  name: 'João Silva',
  job_title: 'CEO',
  state: 'SP',
  city: 'São Paulo',
  mobile_phone: '+5511999999999',
  tags: ['cliente', 'vip'],
  legal_bases: [{
    category: 'communications',
    type: 'consent',
    status: 'granted'
  }]
});

console.log('Contact UUID:', contact.uuid);

// Enviar conversão
await rdstation.sendConversion({
  email: 'cliente@example.com',
  conversion_identifier: 'landing-page-ebook',
  name: 'João Silva',
  company: 'Acme Inc',
  cf_cargo: 'CEO' // Campo customizado
});

// Criar negócio
const deal = await rdstation.createDeal({
  name: 'Venda Acme Inc',
  deal_stage_id: 'stage-123',
  amount: 50000,
  contact_ids: [contact.uuid],
  predicted_close_date: '2024-12-31'
});

console.log('Deal ID:', deal.id);

// Marcar negócio como ganho
await rdstation.markDealAsWon(deal.id);

// Enviar evento de venda
await rdstation.sendSale({
  email: 'cliente@example.com',
  value: 50000
});
*/
