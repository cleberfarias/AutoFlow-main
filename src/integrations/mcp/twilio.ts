/**
 * Twilio MCP Integration
 * 
 * SMS, WhatsApp, Chamadas de voz
 * Docs: https://www.twilio.com/docs/usage/api
 */

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber?: string; // Número Twilio para envio
  whatsappNumber?: string; // Número WhatsApp (formato: whatsapp:+1234567890)
}

export interface TwilioMessage {
  sid: string;
  from: string;
  to: string;
  body: string;
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'undelivered' | 'failed';
  direction: 'inbound' | 'outbound-api' | 'outbound-call' | 'outbound-reply';
  date_created: string;
  date_sent?: string;
  error_code?: number;
  error_message?: string;
  num_media: string;
  price?: string;
  price_unit?: string;
}

export interface TwilioCall {
  sid: string;
  from: string;
  to: string;
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer' | 'canceled';
  direction: 'inbound' | 'outbound-api' | 'outbound-dial';
  duration?: string; // segundos
  start_time?: string;
  end_time?: string;
  price?: string;
  price_unit?: string;
}

export class TwilioMCP {
  private config: TwilioConfig;
  private baseUrl: string;

  constructor(config: TwilioConfig) {
    this.config = config;
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}`;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const auth = Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...options?.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Twilio API Error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  private toFormData(obj: any): string {
    return Object.entries(obj)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
  }

  // ========================================
  // SMS
  // ========================================

  /**
   * Envia SMS
   */
  async sendSMS(params: {
    to: string; // +5511999999999
    body: string;
    from?: string; // Número Twilio (usa config.phoneNumber se omitido)
    mediaUrl?: string[]; // URLs de imagens/videos (MMS)
  }): Promise<TwilioMessage> {
    const formData = this.toFormData({
      To: params.to,
      Body: params.body,
      From: params.from || this.config.phoneNumber,
      ...(params.mediaUrl && { MediaUrl: params.mediaUrl.join(',') })
    });

    return this.request('/Messages.json', {
      method: 'POST',
      body: formData
    });
  }

  /**
   * Busca mensagem
   */
  async getMessage(messageSid: string): Promise<TwilioMessage> {
    return this.request(`/Messages/${messageSid}.json`);
  }

  /**
   * Lista mensagens
   */
  async listMessages(params?: {
    to?: string;
    from?: string;
    dateSent?: string; // YYYY-MM-DD
    pageSize?: number;
  }): Promise<{ messages: TwilioMessage[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/Messages.json?${query}`);
  }

  // ========================================
  // WHATSAPP
  // ========================================

  /**
   * Envia mensagem WhatsApp
   */
  async sendWhatsApp(params: {
    to: string; // +5511999999999
    body: string;
    from?: string; // whatsapp:+14155238886 (usa config.whatsappNumber se omitido)
    mediaUrl?: string[];
  }): Promise<TwilioMessage> {
    const from = params.from || this.config.whatsappNumber;
    const to = params.to.startsWith('whatsapp:') ? params.to : `whatsapp:${params.to}`;

    return this.sendSMS({
      to,
      body: params.body,
      from,
      mediaUrl: params.mediaUrl
    });
  }

  /**
   * Envia WhatsApp com template aprovado
   */
  async sendWhatsAppTemplate(params: {
    to: string;
    templateSid: string; // Content SID do template aprovado
    contentVariables?: Record<string, string>; // Variáveis do template
    from?: string;
  }): Promise<TwilioMessage> {
    const from = params.from || this.config.whatsappNumber;
    const to = params.to.startsWith('whatsapp:') ? params.to : `whatsapp:${params.to}`;

    const formData = this.toFormData({
      To: to,
      From: from,
      ContentSid: params.templateSid,
      ...(params.contentVariables && {
        ContentVariables: JSON.stringify(params.contentVariables)
      })
    });

    return this.request('/Messages.json', {
      method: 'POST',
      body: formData
    });
  }

  // ========================================
  // CHAMADAS DE VOZ
  // ========================================

  /**
   * Faz chamada
   */
  async makeCall(params: {
    to: string; // +5511999999999
    url: string; // TwiML URL ou Twilio Bin URL
    from?: string; // Número Twilio
    statusCallback?: string; // Webhook para status
  }): Promise<TwilioCall> {
    const formData = this.toFormData({
      To: params.to,
      Url: params.url,
      From: params.from || this.config.phoneNumber,
      StatusCallback: params.statusCallback
    });

    return this.request('/Calls.json', {
      method: 'POST',
      body: formData
    });
  }

  /**
   * Busca chamada
   */
  async getCall(callSid: string): Promise<TwilioCall> {
    return this.request(`/Calls/${callSid}.json`);
  }

  /**
   * Lista chamadas
   */
  async listCalls(params?: {
    to?: string;
    from?: string;
    startTime?: string;
    status?: string;
    pageSize?: number;
  }): Promise<{ calls: TwilioCall[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/Calls.json?${query}`);
  }

  /**
   * Encerra chamada em andamento
   */
  async hangupCall(callSid: string): Promise<TwilioCall> {
    const formData = this.toFormData({ Status: 'completed' });
    return this.request(`/Calls/${callSid}.json`, {
      method: 'POST',
      body: formData
    });
  }

  // ========================================
  // VERIFY (OTP)
  // ========================================

  /**
   * Inicia verificação (envia código OTP)
   */
  async startVerification(params: {
    to: string; // +5511999999999
    channel: 'sms' | 'call' | 'email' | 'whatsapp';
    locale?: string; // pt-BR, en-US, etc
  }): Promise<{ sid: string; status: string }> {
    const verifyUrl = `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/Verifications`;
    
    const formData = this.toFormData({
      To: params.to,
      Channel: params.channel,
      Locale: params.locale || 'pt-BR'
    });

    const auth = Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64');
    
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to start verification');
    }

    return response.json();
  }

  /**
   * Verifica código OTP
   */
  async checkVerification(params: {
    to: string;
    code: string;
  }): Promise<{ status: 'approved' | 'pending' | 'canceled' }> {
    const verifyUrl = `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;
    
    const formData = this.toFormData({
      To: params.to,
      Code: params.code
    });

    const auth = Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64');
    
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to check verification');
    }

    return response.json();
  }

  // ========================================
  // LOOKUP (VALIDAÇÃO DE NÚMERO)
  // ========================================

  /**
   * Valida e formata número de telefone
   */
  async lookupPhoneNumber(phoneNumber: string): Promise<{
    phone_number: string;
    country_code: string;
    national_format: string;
    carrier?: { type: string; name: string };
  }> {
    const lookupUrl = `https://lookups.twilio.com/v1/PhoneNumbers/${encodeURIComponent(phoneNumber)}`;
    const auth = Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64');
    
    const response = await fetch(`${lookupUrl}?Type=carrier`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    if (!response.ok) {
      throw new Error('Failed to lookup phone number');
    }

    return response.json();
  }

  // ========================================
  // WEBHOOKS
  // ========================================

  /**
   * Valida webhook do Twilio (X-Twilio-Signature)
   */
  static validateWebhookSignature(params: {
    url: string; // URL completa do webhook
    postBody: Record<string, string>; // Parâmetros POST
    signature: string; // Header X-Twilio-Signature
    authToken: string;
  }): boolean {
    // Implementar validação HMAC-SHA1
    // const crypto = require('crypto');
    // const data = params.url + Object.keys(params.postBody).sort().map(key => key + params.postBody[key]).join('');
    // const hmac = crypto.createHmac('sha1', params.authToken);
    // const computed = hmac.update(data).digest('base64');
    // return computed === params.signature;
    return true;
  }

  /**
   * Processa webhook de status de mensagem
   */
  static processMessageWebhook(body: any): {
    messageSid: string;
    status: string;
    from: string;
    to: string;
    body?: string;
  } {
    return {
      messageSid: body.MessageSid || body.SmsSid,
      status: body.MessageStatus || body.SmsStatus,
      from: body.From,
      to: body.To,
      body: body.Body
    };
  }
}

// Exemplo de uso:
/*
const twilio = new TwilioMCP({
  accountSid: 'ACxxxxxxxxx',
  authToken: 'your-auth-token',
  phoneNumber: '+14155551234',
  whatsappNumber: 'whatsapp:+14155238886'
});

// Enviar SMS
const sms = await twilio.sendSMS({
  to: '+5511999999999',
  body: 'Seu código de verificação é: 123456'
});
console.log('SMS SID:', sms.sid);

// Enviar WhatsApp
const whatsapp = await twilio.sendWhatsApp({
  to: '+5511999999999',
  body: 'Olá! Como posso ajudar?',
  mediaUrl: ['https://example.com/image.jpg']
});

// Fazer chamada
const call = await twilio.makeCall({
  to: '+5511999999999',
  url: 'https://handler.twilio.com/twiml/EH...',
  statusCallback: 'https://example.com/webhook/call-status'
});

// Verificação OTP
const verification = await twilio.startVerification({
  to: '+5511999999999',
  channel: 'sms'
});

// Verificar código
const check = await twilio.checkVerification({
  to: '+5511999999999',
  code: '123456'
});

if (check.status === 'approved') {
  console.log('Código válido!');
}

// Validar número
const lookup = await twilio.lookupPhoneNumber('+5511999999999');
console.log('Formato nacional:', lookup.national_format);
console.log('Operadora:', lookup.carrier?.name);
*/
