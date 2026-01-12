/**
 * Stripe MCP Integration
 * 
 * Processamento de pagamentos e assinaturas
 * Docs: https://stripe.com/docs/api
 */

export interface StripeConfig {
  apiKey: string;
  environment: 'production' | 'sandbox';
  webhookSecret?: string;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
  customer: string;
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  status: 'open' | 'complete' | 'expired';
  amount_total: number;
  currency: string;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete';
  current_period_start: number;
  current_period_end: number;
  items: {
    id: string;
    price: {
      id: string;
      unit_amount: number;
      currency: string;
    };
  }[];
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'processing' | 'requires_payment_method' | 'requires_confirmation' | 'canceled';
  customer?: string;
  description?: string;
}

export class StripeMCP {
  private config: StripeConfig;
  private baseUrl = 'https://api.stripe.com/v1';

  constructor(config: StripeConfig) {
    this.config = config;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...options?.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API Error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  private toFormData(obj: any): string {
    return Object.entries(obj)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
  }

  // ========================================
  // CHECKOUT
  // ========================================

  /**
   * Cria sessão de checkout
   */
  async createCheckoutSession(params: {
    line_items: Array<{
      price?: string;
      quantity: number;
    }>;
    mode: 'payment' | 'subscription' | 'setup';
    success_url: string;
    cancel_url: string;
    customer_email?: string;
    metadata?: Record<string, string>;
  }): Promise<StripeCheckoutSession> {
    const formData = this.toFormData({
      ...params,
      'line_items[0][price]': params.line_items[0].price,
      'line_items[0][quantity]': params.line_items[0].quantity
    });

    return this.request('/checkout/sessions', {
      method: 'POST',
      body: formData
    });
  }

  /**
   * Recupera sessão de checkout
   */
  async getCheckoutSession(sessionId: string): Promise<StripeCheckoutSession> {
    return this.request(`/checkout/sessions/${sessionId}`);
  }

  // ========================================
  // ASSINATURAS
  // ========================================

  /**
   * Cria assinatura
   */
  async createSubscription(params: {
    customer: string;
    items: Array<{ price: string; quantity?: number }>;
    trial_period_days?: number;
    metadata?: Record<string, string>;
  }): Promise<StripeSubscription> {
    const formData = this.toFormData({
      customer: params.customer,
      'items[0][price]': params.items[0].price,
      'items[0][quantity]': params.items[0].quantity || 1,
      ...(params.trial_period_days && { trial_period_days: params.trial_period_days }),
      ...(params.metadata && { metadata: JSON.stringify(params.metadata) })
    });

    return this.request('/subscriptions', {
      method: 'POST',
      body: formData
    });
  }

  /**
   * Lista assinaturas
   */
  async listSubscriptions(params?: {
    customer?: string;
    status?: string;
    limit?: number;
  }): Promise<{ data: StripeSubscription[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/subscriptions?${query}`);
  }

  /**
   * Busca assinatura
   */
  async getSubscription(subscriptionId: string): Promise<StripeSubscription> {
    return this.request(`/subscriptions/${subscriptionId}`);
  }

  /**
   * Cancela assinatura
   */
  async cancelSubscription(subscriptionId: string, params?: {
    cancel_at_period_end?: boolean;
  }): Promise<StripeSubscription> {
    const formData = params ? this.toFormData(params) : '';
    return this.request(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      body: formData
    });
  }

  /**
   * Atualiza assinatura
   */
  async updateSubscription(
    subscriptionId: string,
    params: Partial<StripeSubscription>
  ): Promise<StripeSubscription> {
    const formData = this.toFormData(params);
    return this.request(`/subscriptions/${subscriptionId}`, {
      method: 'POST',
      body: formData
    });
  }

  // ========================================
  // PAGAMENTOS
  // ========================================

  /**
   * Cria payment intent
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customer?: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<StripePaymentIntent> {
    const formData = this.toFormData(params);
    return this.request('/payment_intents', {
      method: 'POST',
      body: formData
    });
  }

  /**
   * Busca payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<StripePaymentIntent> {
    return this.request(`/payment_intents/${paymentIntentId}`);
  }

  /**
   * Lista pagamentos
   */
  async listPaymentIntents(params?: {
    customer?: string;
    limit?: number;
  }): Promise<{ data: StripePaymentIntent[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/payment_intents?${query}`);
  }

  // ========================================
  // CLIENTES
  // ========================================

  /**
   * Cria cliente
   */
  async createCustomer(params: {
    email: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
  }): Promise<any> {
    const formData = this.toFormData(params);
    return this.request('/customers', {
      method: 'POST',
      body: formData
    });
  }

  /**
   * Busca cliente
   */
  async getCustomer(customerId: string): Promise<any> {
    return this.request(`/customers/${customerId}`);
  }

  /**
   * Lista clientes
   */
  async listCustomers(params?: {
    email?: string;
    limit?: number;
  }): Promise<{ data: any[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/customers?${query}`);
  }

  // ========================================
  // WEBHOOKS
  // ========================================

  /**
   * Valida webhook do Stripe
   */
  static validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // Implementar validação de assinatura Stripe
    // const stripe = require('stripe')(apiKey);
    // const event = stripe.webhooks.constructEvent(payload, signature, secret);
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
      type: event.type,
      data: event.data.object
    };
  }
}

// Exemplo de uso:
/*
const stripe = new StripeMCP({
  apiKey: process.env.STRIPE_SECRET_KEY!,
  environment: 'production',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
});

// Criar sessão de checkout
const session = await stripe.createCheckoutSession({
  line_items: [{
    price: 'price_1234',
    quantity: 1
  }],
  mode: 'subscription',
  success_url: 'https://example.com/success',
  cancel_url: 'https://example.com/cancel'
});

console.log('Checkout URL:', session.url);

// Listar assinaturas de um cliente
const subscriptions = await stripe.listSubscriptions({
  customer: 'cus_1234'
});

// Cancelar assinatura
await stripe.cancelSubscription('sub_1234', {
  cancel_at_period_end: true
});
*/
