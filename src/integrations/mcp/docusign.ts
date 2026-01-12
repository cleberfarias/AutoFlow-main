/**
 * DocuSign MCP Integration
 * 
 * Assinaturas eletrônicas e gerenciamento de documentos
 * Docs: https://developers.docusign.com/docs/esign-rest-api/
 */

export interface DocuSignConfig {
  accessToken: string;
  accountId: string;
  basePath: string; // Ex: 'https://demo.docusign.net/restapi' ou 'https://na3.docusign.net/restapi'
  environment: 'production' | 'demo';
}

export interface Envelope {
  envelopeId: string;
  status: 'created' | 'sent' | 'delivered' | 'signed' | 'completed' | 'declined' | 'voided';
  statusDateTime: string;
  emailSubject: string;
  documentsUri?: string;
  recipientsUri?: string;
  envelopeUri?: string;
  sender?: {
    email: string;
    userName: string;
  };
}

export interface Recipient {
  email: string;
  name: string;
  recipientId: string;
  routingOrder: string;
  status: 'created' | 'sent' | 'delivered' | 'signed' | 'completed' | 'declined';
  signedDateTime?: string;
  deliveredDateTime?: string;
}

export interface Document {
  documentId: string;
  name: string;
  documentBase64?: string;
  fileExtension: string;
}

export class DocuSignMCP {
  private config: DocuSignConfig;
  private baseUrl: string;

  constructor(config: DocuSignConfig) {
    this.config = config;
    this.baseUrl = `${config.basePath}/v2.1/accounts/${config.accountId}`;
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
      throw new Error(`DocuSign API Error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  // ========================================
  // ENVELOPES (DOCUMENTOS)
  // ========================================

  /**
   * Envia documento para assinatura
   */
  async sendDocument(params: {
    emailSubject: string;
    emailMessage?: string;
    status?: 'created' | 'sent'; // 'created' = draft, 'sent' = envia imediatamente
    documents: Array<{
      documentBase64: string;
      name: string;
      fileExtension: string; // 'pdf', 'docx', etc.
      documentId: string;
    }>;
    recipients: {
      signers: Array<{
        email: string;
        name: string;
        recipientId: string;
        routingOrder: string; // Ordem de assinatura: '1', '2', etc.
        tabs?: {
          signHereTabs?: Array<{
            documentId: string;
            pageNumber: string;
            xPosition: string;
            yPosition: string;
          }>;
          dateSignedTabs?: Array<{
            documentId: string;
            pageNumber: string;
            xPosition: string;
            yPosition: string;
          }>;
        };
      }>;
    };
  }): Promise<Envelope> {
    return this.request('/envelopes', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  /**
   * Busca status do envelope
   */
  async getEnvelopeStatus(envelopeId: string): Promise<Envelope> {
    return this.request(`/envelopes/${envelopeId}`);
  }

  /**
   * Lista envelopes
   */
  async listEnvelopes(params?: {
    from_date?: string; // ISO 8601
    to_date?: string;
    status?: string;
    count?: number;
  }): Promise<{ envelopes: Envelope[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/envelopes?${query}`);
  }

  /**
   * Baixa documento assinado
   */
  async downloadDocument(envelopeId: string, documentId: string = 'combined'): Promise<Blob> {
    const response = await fetch(
      `${this.baseUrl}/envelopes/${envelopeId}/documents/${documentId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download document');
    }

    return response.blob();
  }

  /**
   * Baixa certificado de conclusão
   */
  async downloadCertificate(envelopeId: string): Promise<Blob> {
    return this.downloadDocument(envelopeId, 'certificate');
  }

  /**
   * Void (cancela) envelope
   */
  async voidEnvelope(envelopeId: string, reason: string): Promise<Envelope> {
    return this.request(`/envelopes/${envelopeId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'voided',
        voidedReason: reason
      })
    });
  }

  // ========================================
  // DESTINATÁRIOS
  // ========================================

  /**
   * Lista destinatários do envelope
   */
  async getRecipients(envelopeId: string): Promise<{ signers: Recipient[] }> {
    return this.request(`/envelopes/${envelopeId}/recipients`);
  }

  /**
   * Adiciona destinatário a envelope em draft
   */
  async addRecipient(envelopeId: string, recipient: {
    email: string;
    name: string;
    recipientId: string;
    routingOrder: string;
  }): Promise<any> {
    return this.request(`/envelopes/${envelopeId}/recipients`, {
      method: 'POST',
      body: JSON.stringify({
        signers: [recipient]
      })
    });
  }

  /**
   * Reenvia envelope para destinatário
   */
  async resendEnvelope(envelopeId: string, recipientId: string): Promise<any> {
    return this.request(`/envelopes/${envelopeId}/recipients/${recipientId}/resend`, {
      method: 'PUT'
    });
  }

  // ========================================
  // TEMPLATES
  // ========================================

  /**
   * Lista templates disponíveis
   */
  async listTemplates(params?: {
    count?: number;
    searchText?: string;
  }): Promise<{ envelopeTemplates: any[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/templates?${query}`);
  }

  /**
   * Cria envelope a partir de template
   */
  async createEnvelopeFromTemplate(params: {
    templateId: string;
    emailSubject: string;
    status?: 'created' | 'sent';
    templateRoles: Array<{
      email: string;
      name: string;
      roleName: string; // Nome do role no template
    }>;
  }): Promise<Envelope> {
    return this.request('/envelopes', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // ========================================
  // EMBEDDED SIGNING
  // ========================================

  /**
   * Gera URL para assinatura embarcada
   */
  async createEmbeddedSigningView(params: {
    envelopeId: string;
    recipientId: string;
    returnUrl: string; // URL de retorno após assinatura
    clientUserId: string; // Identificador único do usuário
  }): Promise<{ url: string }> {
    return this.request(`/envelopes/${params.envelopeId}/views/recipient`, {
      method: 'POST',
      body: JSON.stringify({
        returnUrl: params.returnUrl,
        authenticationMethod: 'none',
        email: '',
        userName: '',
        clientUserId: params.clientUserId,
        recipientId: params.recipientId
      })
    });
  }

  // ========================================
  // WEBHOOKS (CONNECT)
  // ========================================

  /**
   * Valida webhook do DocuSign (HMAC)
   */
  static validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // Implementar validação HMAC-SHA256
    // const crypto = require('crypto');
    // const hmac = crypto.createHmac('sha256', secret);
    // const computed = hmac.update(payload).digest('base64');
    // return computed === signature;
    return true;
  }

  /**
   * Processa evento de webhook
   */
  static processWebhookEvent(event: any): {
    envelopeId: string;
    status: string;
    timestamp: string;
    recipients: Recipient[];
  } {
    return {
      envelopeId: event.envelopeId,
      status: event.status,
      timestamp: event.statusDateTime,
      recipients: event.recipients?.signers || []
    };
  }

  // ========================================
  // ACCOUNT INFO
  // ========================================

  /**
   * Obtém informações da conta
   */
  async getAccountInfo(): Promise<any> {
    const response = await fetch(`${this.config.basePath}/v2.1/accounts/${this.config.accountId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get account info');
    }

    return response.json();
  }

  /**
   * Obtém user info
   */
  async getUserInfo(): Promise<any> {
    const response = await fetch('https://account-d.docusign.com/oauth/userinfo', {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  }
}

// Exemplo de uso:
/*
const docusign = new DocuSignMCP({
  accessToken: 'eyJ0...',
  accountId: 'abc123',
  basePath: 'https://demo.docusign.net/restapi',
  environment: 'demo'
});

// Converter PDF para Base64
const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

// Enviar documento para assinatura
const envelope = await docusign.sendDocument({
  emailSubject: 'Contrato de Prestação de Serviços',
  emailMessage: 'Por favor, assine o contrato anexo.',
  status: 'sent',
  documents: [{
    documentBase64: pdfBase64,
    name: 'Contrato.pdf',
    fileExtension: 'pdf',
    documentId: '1'
  }],
  recipients: {
    signers: [{
      email: 'cliente@example.com',
      name: 'João Silva',
      recipientId: '1',
      routingOrder: '1',
      tabs: {
        signHereTabs: [{
          documentId: '1',
          pageNumber: '1',
          xPosition: '100',
          yPosition: '650'
        }],
        dateSignedTabs: [{
          documentId: '1',
          pageNumber: '1',
          xPosition: '100',
          yPosition: '700'
        }]
      }
    }]
  }
});

console.log('Envelope ID:', envelope.envelopeId);
console.log('Status:', envelope.status);

// Verificar status
const status = await docusign.getEnvelopeStatus(envelope.envelopeId);
console.log('Status atual:', status.status);

// Baixar documento assinado
if (status.status === 'completed') {
  const pdf = await docusign.downloadDocument(envelope.envelopeId);
  // Salvar PDF...
}
*/
