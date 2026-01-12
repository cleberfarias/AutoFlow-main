/**
 * HubSpot MCP Integration
 * 
 * CRM, Marketing Automation e Sales
 * Docs: https://developers.hubspot.com/docs/api/overview
 */

export interface HubSpotConfig {
  accessToken: string;
  hapikey?: string; // API Key (legacy, prefer OAuth)
}

export interface HubSpotContact {
  id?: string;
  properties: {
    email: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
    company?: string;
    website?: string;
    lifecyclestage?: string;
    [key: string]: any;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface HubSpotCompany {
  id?: string;
  properties: {
    name: string;
    domain?: string;
    industry?: string;
    phone?: string;
    city?: string;
    state?: string;
    [key: string]: any;
  };
}

export interface HubSpotDeal {
  id?: string;
  properties: {
    dealname: string;
    dealstage: string;
    amount?: string;
    closedate?: string;
    pipeline?: string;
    [key: string]: any;
  };
  associations?: {
    contacts?: string[];
    companies?: string[];
  };
}

export interface HubSpotTicket {
  id?: string;
  properties: {
    subject: string;
    content?: string;
    hs_pipeline_stage?: string;
    hs_ticket_priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    [key: string]: any;
  };
}

export class HubSpotMCP {
  private config: HubSpotConfig;
  private baseUrl = 'https://api.hubapi.com';

  constructor(config: HubSpotConfig) {
    this.config = config;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers
    };

    if (this.config.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`;
    } else if (this.config.hapikey) {
      // Adiciona hapikey na query string (legacy)
      const separator = endpoint.includes('?') ? '&' : '?';
      endpoint = `${endpoint}${separator}hapikey=${this.config.hapikey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HubSpot API Error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  // ========================================
  // CONTACTS (CRM)
  // ========================================

  /**
   * Cria contato
   */
  async createContact(contact: HubSpotContact): Promise<HubSpotContact> {
    return this.request('/crm/v3/objects/contacts', {
      method: 'POST',
      body: JSON.stringify(contact)
    });
  }

  /**
   * Busca contato por email
   */
  async getContactByEmail(email: string): Promise<HubSpotContact | null> {
    try {
      const response = await this.request<{ results: HubSpotContact[] }>(
        `/crm/v3/objects/contacts/search`,
        {
          method: 'POST',
          body: JSON.stringify({
            filterGroups: [{
              filters: [{
                propertyName: 'email',
                operator: 'EQ',
                value: email
              }]
            }]
          })
        }
      );
      return response.results[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Atualiza contato
   */
  async updateContact(contactId: string, updates: Partial<HubSpotContact>): Promise<HubSpotContact> {
    return this.request(`/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Deleta contato
   */
  async deleteContact(contactId: string): Promise<void> {
    await this.request(`/crm/v3/objects/contacts/${contactId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Lista contatos
   */
  async listContacts(params?: {
    limit?: number;
    after?: string; // Pagination cursor
    properties?: string[];
  }): Promise<{ results: HubSpotContact[]; paging?: any }> {
    const query = new URLSearchParams({
      limit: String(params?.limit || 100),
      ...(params?.after && { after: params.after }),
      ...(params?.properties && { properties: params.properties.join(',') })
    }).toString();

    return this.request(`/crm/v3/objects/contacts?${query}`);
  }

  // ========================================
  // COMPANIES
  // ========================================

  /**
   * Cria empresa
   */
  async createCompany(company: HubSpotCompany): Promise<HubSpotCompany> {
    return this.request('/crm/v3/objects/companies', {
      method: 'POST',
      body: JSON.stringify(company)
    });
  }

  /**
   * Busca empresa por domínio
   */
  async getCompanyByDomain(domain: string): Promise<HubSpotCompany | null> {
    try {
      const response = await this.request<{ results: HubSpotCompany[] }>(
        `/crm/v3/objects/companies/search`,
        {
          method: 'POST',
          body: JSON.stringify({
            filterGroups: [{
              filters: [{
                propertyName: 'domain',
                operator: 'EQ',
                value: domain
              }]
            }]
          })
        }
      );
      return response.results[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Atualiza empresa
   */
  async updateCompany(companyId: string, updates: Partial<HubSpotCompany>): Promise<HubSpotCompany> {
    return this.request(`/crm/v3/objects/companies/${companyId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  // ========================================
  // DEALS
  // ========================================

  /**
   * Cria negócio
   */
  async createDeal(deal: HubSpotDeal): Promise<HubSpotDeal> {
    return this.request('/crm/v3/objects/deals', {
      method: 'POST',
      body: JSON.stringify(deal)
    });
  }

  /**
   * Busca negócio
   */
  async getDeal(dealId: string): Promise<HubSpotDeal> {
    return this.request(`/crm/v3/objects/deals/${dealId}`);
  }

  /**
   * Lista negócios
   */
  async listDeals(params?: {
    limit?: number;
    properties?: string[];
  }): Promise<{ results: HubSpotDeal[] }> {
    const query = new URLSearchParams({
      limit: String(params?.limit || 100),
      ...(params?.properties && { properties: params.properties.join(',') })
    }).toString();

    return this.request(`/crm/v3/objects/deals?${query}`);
  }

  /**
   * Atualiza negócio
   */
  async updateDeal(dealId: string, updates: Partial<HubSpotDeal>): Promise<HubSpotDeal> {
    return this.request(`/crm/v3/objects/deals/${dealId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  // ========================================
  // TICKETS
  // ========================================

  /**
   * Cria ticket
   */
  async createTicket(ticket: HubSpotTicket): Promise<HubSpotTicket> {
    return this.request('/crm/v3/objects/tickets', {
      method: 'POST',
      body: JSON.stringify(ticket)
    });
  }

  /**
   * Busca ticket
   */
  async getTicket(ticketId: string): Promise<HubSpotTicket> {
    return this.request(`/crm/v3/objects/tickets/${ticketId}`);
  }

  /**
   * Atualiza ticket
   */
  async updateTicket(ticketId: string, updates: Partial<HubSpotTicket>): Promise<HubSpotTicket> {
    return this.request(`/crm/v3/objects/tickets/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  // ========================================
  // ASSOCIATIONS (RELACIONAMENTOS)
  // ========================================

  /**
   * Associa contato com empresa
   */
  async associateContactToCompany(contactId: string, companyId: string): Promise<void> {
    await this.request(`/crm/v3/objects/contacts/${contactId}/associations/companies/${companyId}/280`, {
      method: 'PUT'
    });
  }

  /**
   * Associa contato com negócio
   */
  async associateContactToDeal(contactId: string, dealId: string): Promise<void> {
    await this.request(`/crm/v3/objects/contacts/${contactId}/associations/deals/${dealId}/3`, {
      method: 'PUT'
    });
  }

  /**
   * Associa empresa com negócio
   */
  async associateCompanyToDeal(companyId: string, dealId: string): Promise<void> {
    await this.request(`/crm/v3/objects/companies/${companyId}/associations/deals/${dealId}/341`, {
      method: 'PUT'
    });
  }

  // ========================================
  // MARKETING (EMAIL)
  // ========================================

  /**
   * Envia email transacional
   */
  async sendTransactionalEmail(params: {
    emailId: number; // ID do template
    to: string;
    from?: string;
    replyTo?: string;
    customProperties?: Record<string, any>;
    contactProperties?: Record<string, any>;
  }): Promise<any> {
    return this.request('/marketing/v3/transactional/single-email/send', {
      method: 'POST',
      body: JSON.stringify({
        emailId: params.emailId,
        message: {
          to: params.to,
          from: params.from,
          replyTo: params.replyTo
        },
        customProperties: params.customProperties,
        contactProperties: params.contactProperties
      })
    });
  }

  // ========================================
  // WEBHOOKS
  // ========================================

  /**
   * Valida webhook do HubSpot
   */
  static validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // Implementar validação HMAC-SHA256
    // const crypto = require('crypto');
    // const hmac = crypto.createHmac('sha256', secret);
    // const computed = hmac.update(payload).digest('hex');
    // return computed === signature;
    return true;
  }

  /**
   * Processa evento de webhook
   */
  static processWebhookEvent(event: any): {
    objectType: string;
    eventType: string;
    objectId: string;
    properties: any;
  } {
    return {
      objectType: event.subscriptionType,
      eventType: event.propertyName,
      objectId: event.objectId,
      properties: event.properties
    };
  }
}

// Exemplo de uso:
/*
const hubspot = new HubSpotMCP({
  accessToken: 'pat-na1-xxxxx'
});

// Criar contato
const contact = await hubspot.createContact({
  properties: {
    email: 'cliente@example.com',
    firstname: 'João',
    lastname: 'Silva',
    phone: '+5511999999999',
    lifecyclestage: 'lead'
  }
});

console.log('Contact ID:', contact.id);

// Criar empresa
const company = await hubspot.createCompany({
  properties: {
    name: 'Acme Inc',
    domain: 'acme.com',
    industry: 'Technology'
  }
});

// Associar contato à empresa
await hubspot.associateContactToCompany(contact.id!, company.id!);

// Criar negócio
const deal = await hubspot.createDeal({
  properties: {
    dealname: 'Venda Acme Inc',
    dealstage: 'qualifiedtobuy',
    amount: '50000',
    closedate: '2024-12-31'
  }
});

// Associar contato e empresa ao negócio
await hubspot.associateContactToDeal(contact.id!, deal.id!);
await hubspot.associateCompanyToDeal(company.id!, deal.id!);

// Criar ticket de suporte
const ticket = await hubspot.createTicket({
  properties: {
    subject: 'Problema com integração',
    content: 'O cliente relatou erro na API',
    hs_ticket_priority: 'HIGH'
  }
});
*/
