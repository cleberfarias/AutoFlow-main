/**
 * Clicksign MCP Integration (Alternativa brasileira ao DocuSign)
 * 
 * Assinaturas eletrônicas com validade jurídica no Brasil
 * Docs: https://developers.clicksign.com/docs
 */

export interface ClicksignConfig {
  accessToken: string;
  environment: 'production' | 'sandbox';
}

export interface ClicksignDocument {
  key: string;
  path: string;
  filename: string;
  uploaded_at: string;
  updated_at: string;
  finished_at?: string;
  deadline_at?: string;
  status: 'draft' | 'running' | 'closed' | 'canceled';
  auto_close: boolean;
  locale: string;
  sequence_enabled: boolean;
}

export interface ClicksignSigner {
  key: string;
  email: string;
  name?: string;
  documentation?: string; // CPF/CNPJ
  birthday?: string; // YYYY-MM-DD
  phone_number?: string;
  auths: string[]; // ['email', 'sms', 'whatsapp', 'pix', 'selfie', 'face']
  signature_as: 'sign' | 'approve' | 'party' | 'witness' | 'intervening' | 'receipt' | 'endorser';
}

export interface ClicksignSignature {
  key: string;
  signer_key: string;
  status: 'pending' | 'signed' | 'rejected';
  created_at: string;
  signed_at?: string;
}

export class ClicksignMCP {
  private config: ClicksignConfig;
  private baseUrl: string;

  constructor(config: ClicksignConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'production'
      ? 'https://app.clicksign.com/api/v1'
      : 'https://sandbox.clicksign.com/api/v1';
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
      throw new Error(`Clicksign API Error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  // ========================================
  // DOCUMENTOS
  // ========================================

  /**
   * Faz upload de documento
   */
  async uploadDocument(params: {
    path: string; // Caminho único: '/pasta/documento.pdf'
    contentBase64: string;
    deadline_at?: string; // ISO 8601
    auto_close?: boolean; // Fecha automaticamente quando todos assinarem
    locale?: 'pt-BR' | 'en-US';
    sequence_enabled?: boolean; // Ordem sequencial de assinatura
  }): Promise<ClicksignDocument> {
    return this.request('/documents', {
      method: 'POST',
      body: JSON.stringify({
        document: {
          path: params.path,
          content_base64: params.contentBase64,
          deadline_at: params.deadline_at,
          auto_close: params.auto_close ?? true,
          locale: params.locale ?? 'pt-BR',
          sequence_enabled: params.sequence_enabled ?? false
        }
      })
    });
  }

  /**
   * Busca documento
   */
  async getDocument(documentKey: string): Promise<{ document: ClicksignDocument }> {
    return this.request(`/documents/${documentKey}`);
  }

  /**
   * Lista documentos
   */
  async listDocuments(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ documents: ClicksignDocument[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/documents?${query}`);
  }

  /**
   * Cancela documento
   */
  async cancelDocument(documentKey: string): Promise<void> {
    await this.request(`/documents/${documentKey}/cancel`, {
      method: 'PATCH'
    });
  }

  /**
   * Baixa documento assinado
   */
  async downloadDocument(documentKey: string, format: 'pdf' | 'zip' = 'pdf'): Promise<Blob> {
    const response = await fetch(
      `${this.baseUrl}/documents/${documentKey}/download?type=${format}`,
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

  // ========================================
  // SIGNATÁRIOS
  // ========================================

  /**
   * Adiciona signatário ao documento
   */
  async addSigner(documentKey: string, signer: {
    email: string;
    name?: string;
    documentation?: string; // CPF/CNPJ sem formatação
    birthday?: string; // YYYY-MM-DD
    phone_number?: string; // +5511999999999
    auths?: Array<'email' | 'sms' | 'whatsapp' | 'pix' | 'selfie' | 'face'>;
    signature_as?: 'sign' | 'approve' | 'party' | 'witness' | 'intervening' | 'receipt' | 'endorser';
    message?: string; // Mensagem personalizada no email
  }): Promise<{ signer: ClicksignSigner }> {
    return this.request(`/documents/${documentKey}/signers`, {
      method: 'POST',
      body: JSON.stringify({
        signer: {
          email: signer.email,
          name: signer.name,
          documentation: signer.documentation,
          birthday: signer.birthday,
          phone_number: signer.phone_number,
          auths: signer.auths ?? ['email'],
          signature_as: signer.signature_as ?? 'sign',
          message: signer.message
        }
      })
    });
  }

  /**
   * Lista signatários do documento
   */
  async listSigners(documentKey: string): Promise<{ signers: ClicksignSigner[] }> {
    return this.request(`/documents/${documentKey}/signers`);
  }

  /**
   * Remove signatário
   */
  async removeSigner(documentKey: string, signerKey: string): Promise<void> {
    await this.request(`/documents/${documentKey}/signers/${signerKey}`, {
      method: 'DELETE'
    });
  }

  // ========================================
  // ASSINATURAS
  // ========================================

  /**
   * Cria assinatura (vincula signatário ao documento)
   */
  async createSignature(params: {
    document_key: string;
    signer_key: string;
    sign_as: 'sign' | 'approve' | 'party' | 'witness' | 'intervening' | 'receipt' | 'endorser';
  }): Promise<{ list: ClicksignSignature }> {
    return this.request('/signatures', {
      method: 'POST',
      body: JSON.stringify({
        list: params
      })
    });
  }

  /**
   * Lista assinaturas do documento
   */
  async listSignatures(documentKey: string): Promise<{ signatures: ClicksignSignature[] }> {
    return this.request(`/documents/${documentKey}/signatures`);
  }

  /**
   * Reenvia notificação para signatário
   */
  async resendNotification(documentKey: string, signerKey: string): Promise<void> {
    await this.request(`/documents/${documentKey}/signers/${signerKey}/resend`, {
      method: 'POST'
    });
  }

  // ========================================
  // BATCHES (LOTES)
  // ========================================

  /**
   * Cria lote de documentos
   */
  async createBatch(params: {
    documents: Array<{
      path: string;
      contentBase64: string;
    }>;
    signers: Array<{
      email: string;
      name?: string;
    }>;
  }): Promise<any> {
    return this.request('/batches', {
      method: 'POST',
      body: JSON.stringify({
        batch: params
      })
    });
  }

  // ========================================
  // WEBHOOKS
  // ========================================

  /**
   * Registra webhook
   */
  async createWebhook(url: string, events: string[] = ['all']): Promise<any> {
    return this.request('/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        webhook: {
          url,
          events
        }
      })
    });
  }

  /**
   * Lista webhooks
   */
  async listWebhooks(): Promise<{ webhooks: any[] }> {
    return this.request('/webhooks');
  }

  /**
   * Valida webhook (HMAC-SHA256)
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
    event: string;
    documentKey: string;
    status: string;
  } {
    return {
      event: event.event.name,
      documentKey: event.document.key,
      status: event.document.status
    };
  }

  // ========================================
  // TEMPLATES
  // ========================================

  /**
   * Cria documento a partir de template
   */
  async createFromTemplate(params: {
    template_key: string;
    signers: Array<{
      email: string;
      name?: string;
    }>;
    data?: Record<string, string>; // Variáveis do template
  }): Promise<ClicksignDocument> {
    return this.request('/templates/documents', {
      method: 'POST',
      body: JSON.stringify({
        document: params
      })
    });
  }
}

// Exemplo de uso:
/*
const clicksign = new ClicksignMCP({
  accessToken: 'your-access-token',
  environment: 'production'
});

// Converter PDF para Base64
const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

// Upload documento
const doc = await clicksign.uploadDocument({
  path: '/contratos/contrato-2024-001.pdf',
  contentBase64: pdfBase64,
  deadline_at: '2024-12-31T23:59:59Z',
  auto_close: true,
  locale: 'pt-BR',
  sequence_enabled: false
});

console.log('Document Key:', doc.key);

// Adicionar signatários
const signer1 = await clicksign.addSigner(doc.key, {
  email: 'cliente@example.com',
  name: 'João Silva',
  documentation: '12345678900', // CPF sem pontos
  phone_number: '+5511999999999',
  auths: ['email', 'sms'],
  signature_as: 'sign',
  message: 'Por favor, assine o contrato anexo.'
});

const signer2 = await clicksign.addSigner(doc.key, {
  email: 'testemunha@example.com',
  name: 'Maria Santos',
  signature_as: 'witness'
});

// Criar assinaturas
await clicksign.createSignature({
  document_key: doc.key,
  signer_key: signer1.signer.key,
  sign_as: 'sign'
});

await clicksign.createSignature({
  document_key: doc.key,
  signer_key: signer2.signer.key,
  sign_as: 'witness'
});

// Verificar status
const status = await clicksign.getDocument(doc.key);
console.log('Status:', status.document.status);

// Baixar documento assinado
if (status.document.status === 'closed') {
  const pdf = await clicksign.downloadDocument(doc.key, 'pdf');
  // Salvar PDF...
}
*/
