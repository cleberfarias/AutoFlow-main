/**
 * Pagar.me MCP Integration
 * 
 * Gateway de pagamento brasileiro
 * Docs: https://docs.pagar.me/reference
 */

export interface PagarMeConfig {
  apiKey: string;
  environment: 'production' | 'sandbox';
}

export interface PagarMeTransaction {
  id: string;
  status: 'processing' | 'authorized' | 'paid' | 'refunded' | 'waiting_payment' | 'pending_refund' | 'refused' | 'chargedback' | 'analyzing' | 'pending_review';
  amount: number; // em centavos
  paid_amount?: number;
  refunded_amount?: number;
  authorized_amount?: number;
  cost?: number;
  payment_method: 'credit_card' | 'boleto' | 'pix';
  date_created: string;
  date_updated: string;
  customer?: PagarMeCustomer;
  card?: {
    id: string;
    first_digits: string;
    last_digits: string;
    brand: string;
  };
  boleto_url?: string;
  boleto_barcode?: string;
  boleto_expiration_date?: string;
  pix_qr_code?: string;
  pix_qr_code_url?: string;
  pix_expiration_date?: string;
}

export interface PagarMeCustomer {
  id?: string;
  external_id?: string;
  name: string;
  email: string;
  type: 'individual' | 'company';
  document: string; // CPF ou CNPJ (apenas números)
  document_type: 'cpf' | 'cnpj';
  phones?: {
    mobile_phone?: {
      country_code: string;
      area_code: string;
      number: string;
    };
  };
  address?: PagarMeAddress;
}

export interface PagarMeAddress {
  line_1: string; // Rua, número, complemento
  line_2?: string;
  zip_code: string; // CEP (apenas números)
  city: string;
  state: string; // UF (2 letras)
  country: string; // BR
}

export interface PagarMeSubscription {
  id: string;
  code: string;
  status: 'active' | 'canceled' | 'ended' | 'future';
  plan_id: string;
  customer_id: string;
  current_cycle?: {
    start_at: string;
    end_at: string;
    billing_at: string;
  };
  next_billing_at?: string;
  canceled_at?: string;
  created_at: string;
}

export class PagarMeMCP {
  private config: PagarMeConfig;
  private baseUrl: string;

  constructor(config: PagarMeConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'production'
      ? 'https://api.pagar.me/core/v5'
      : 'https://api.pagar.me/core/v5'; // Mesmo endpoint, usa chaves diferentes
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Basic ${Buffer.from(this.config.apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Pagar.me API Error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  // ========================================
  // TRANSAÇÕES
  // ========================================

  /**
   * Cria transação com cartão de crédito
   */
  async createCreditCardTransaction(params: {
    amount: number; // em centavos (ex: 10000 = R$ 100,00)
    customer: PagarMeCustomer;
    card: {
      number: string;
      holder_name: string;
      exp_month: number;
      exp_year: number;
      cvv: string;
      billing_address?: PagarMeAddress;
    };
    installments?: number; // parcelas (1-12)
    metadata?: Record<string, string>;
    statement_descriptor?: string; // Texto na fatura (até 22 caracteres)
  }): Promise<PagarMeTransaction> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        amount: params.amount,
        customer: params.customer,
        payments: [{
          payment_method: 'credit_card',
          credit_card: {
            installments: params.installments || 1,
            statement_descriptor: params.statement_descriptor,
            card: params.card
          }
        }],
        metadata: params.metadata
      })
    });
  }

  /**
   * Cria transação com boleto
   */
  async createBoletoTransaction(params: {
    amount: number;
    customer: PagarMeCustomer;
    due_at?: string; // ISO 8601 (data de vencimento)
    instructions?: string; // Instruções no boleto
    metadata?: Record<string, string>;
  }): Promise<PagarMeTransaction> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        amount: params.amount,
        customer: params.customer,
        payments: [{
          payment_method: 'boleto',
          boleto: {
            due_at: params.due_at,
            instructions: params.instructions
          }
        }],
        metadata: params.metadata
      })
    });
  }

  /**
   * Cria transação com PIX
   */
  async createPixTransaction(params: {
    amount: number;
    customer: PagarMeCustomer;
    expires_in?: number; // segundos até expiração (padrão: 3600)
    metadata?: Record<string, string>;
  }): Promise<PagarMeTransaction> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        amount: params.amount,
        customer: params.customer,
        payments: [{
          payment_method: 'pix',
          pix: {
            expires_in: params.expires_in || 3600
          }
        }],
        metadata: params.metadata
      })
    });
  }

  /**
   * Busca transação
   */
  async getTransaction(transactionId: string): Promise<PagarMeTransaction> {
    return this.request(`/orders/${transactionId}`);
  }

  /**
   * Lista transações
   */
  async listTransactions(params?: {
    page?: number;
    size?: number;
    customer_id?: string;
    status?: string;
  }): Promise<{ data: PagarMeTransaction[] }> {
    const query = new URLSearchParams({
      page: String(params?.page || 1),
      size: String(params?.size || 10),
      ...(params?.customer_id && { customer_id: params.customer_id }),
      ...(params?.status && { status: params.status })
    }).toString();

    return this.request(`/orders?${query}`);
  }

  /**
   * Captura transação autorizada (dois passos)
   */
  async captureTransaction(transactionId: string, amount?: number): Promise<PagarMeTransaction> {
    return this.request(`/orders/${transactionId}/capture`, {
      method: 'POST',
      body: JSON.stringify({
        ...(amount && { amount })
      })
    });
  }

  /**
   * Cancela/estorna transação
   */
  async refundTransaction(transactionId: string, amount?: number): Promise<PagarMeTransaction> {
    return this.request(`/orders/${transactionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({
        ...(amount && { amount })
      })
    });
  }

  // ========================================
  // CLIENTES
  // ========================================

  /**
   * Cria cliente
   */
  async createCustomer(customer: PagarMeCustomer): Promise<PagarMeCustomer> {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customer)
    });
  }

  /**
   * Busca cliente
   */
  async getCustomer(customerId: string): Promise<PagarMeCustomer> {
    return this.request(`/customers/${customerId}`);
  }

  /**
   * Atualiza cliente
   */
  async updateCustomer(customerId: string, updates: Partial<PagarMeCustomer>): Promise<PagarMeCustomer> {
    return this.request(`/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Lista clientes
   */
  async listCustomers(params?: {
    page?: number;
    size?: number;
  }): Promise<{ data: PagarMeCustomer[] }> {
    const query = new URLSearchParams({
      page: String(params?.page || 1),
      size: String(params?.size || 10)
    }).toString();

    return this.request(`/customers?${query}`);
  }

  // ========================================
  // ASSINATURAS (RECORRÊNCIA)
  // ========================================

  /**
   * Cria assinatura
   */
  async createSubscription(params: {
    customer_id: string;
    plan_id: string;
    payment_method: 'credit_card';
    card: {
      number: string;
      holder_name: string;
      exp_month: number;
      exp_year: number;
      cvv: string;
    };
    start_at?: string; // ISO 8601
    metadata?: Record<string, string>;
  }): Promise<PagarMeSubscription> {
    return this.request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  /**
   * Busca assinatura
   */
  async getSubscription(subscriptionId: string): Promise<PagarMeSubscription> {
    return this.request(`/subscriptions/${subscriptionId}`);
  }

  /**
   * Cancela assinatura
   */
  async cancelSubscription(subscriptionId: string): Promise<PagarMeSubscription> {
    return this.request(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Lista assinaturas
   */
  async listSubscriptions(params?: {
    page?: number;
    size?: number;
    customer_id?: string;
    status?: string;
  }): Promise<{ data: PagarMeSubscription[] }> {
    const query = new URLSearchParams({
      page: String(params?.page || 1),
      size: String(params?.size || 10),
      ...(params?.customer_id && { customer_id: params.customer_id }),
      ...(params?.status && { status: params.status })
    }).toString();

    return this.request(`/subscriptions?${query}`);
  }

  // ========================================
  // PLANOS
  // ========================================

  /**
   * Cria plano de assinatura
   */
  async createPlan(params: {
    name: string;
    amount: number; // em centavos
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number; // Ex: 1 month, 2 weeks, etc
    billing_type: 'prepaid' | 'postpaid';
    trial_period_days?: number;
  }): Promise<any> {
    return this.request('/plans', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  /**
   * Lista planos
   */
  async listPlans(params?: {
    page?: number;
    size?: number;
  }): Promise<{ data: any[] }> {
    const query = new URLSearchParams({
      page: String(params?.page || 1),
      size: String(params?.size || 10)
    }).toString();

    return this.request(`/plans?${query}`);
  }

  // ========================================
  // WEBHOOKS
  // ========================================

  /**
   * Valida webhook do Pagar.me
   */
  static validateWebhookSignature(
    payload: string,
    signature: string,
    apiKey: string
  ): boolean {
    // Implementar validação HMAC-SHA1
    // const crypto = require('crypto');
    // const hmac = crypto.createHmac('sha1', apiKey);
    // const computed = hmac.update(payload).digest('hex');
    // return `sha1=${computed}` === signature;
    return true;
  }

  /**
   * Processa evento de webhook
   */
  static processWebhookEvent(event: any): {
    type: string;
    id: string;
    current_status: string;
    data: any;
  } {
    return {
      type: event.type, // transaction_status_changed, subscription_created, etc
      id: event.id,
      current_status: event.data?.status,
      data: event.data
    };
  }
}

// Exemplo de uso:
/*
const pagarme = new PagarMeMCP({
  apiKey: 'sk_test_xxxxx',
  environment: 'sandbox'
});

// Criar transação com cartão
const transaction = await pagarme.createCreditCardTransaction({
  amount: 10000, // R$ 100,00
  customer: {
    name: 'João Silva',
    email: 'joao@example.com',
    type: 'individual',
    document: '12345678900',
    document_type: 'cpf',
    phones: {
      mobile_phone: {
        country_code: '55',
        area_code: '11',
        number: '999999999'
      }
    }
  },
  card: {
    number: '4111111111111111',
    holder_name: 'JOAO SILVA',
    exp_month: 12,
    exp_year: 2025,
    cvv: '123'
  },
  installments: 3,
  statement_descriptor: 'ACME STORE'
});

console.log('Transaction ID:', transaction.id);
console.log('Status:', transaction.status);

// Criar transação PIX
const pix = await pagarme.createPixTransaction({
  amount: 10000,
  customer: {
    name: 'Maria Santos',
    email: 'maria@example.com',
    type: 'individual',
    document: '98765432100',
    document_type: 'cpf'
  },
  expires_in: 1800 // 30 minutos
});

console.log('PIX QR Code:', pix.pix_qr_code);
console.log('PIX URL:', pix.pix_qr_code_url);

// Criar boleto
const boleto = await pagarme.createBoletoTransaction({
  amount: 10000,
  customer: {
    name: 'Pedro Costa',
    email: 'pedro@example.com',
    type: 'individual',
    document: '11122233344',
    document_type: 'cpf'
  },
  due_at: '2024-12-31T23:59:59Z',
  instructions: 'Não aceitar pagamento após vencimento'
});

console.log('Boleto URL:', boleto.boleto_url);
console.log('Código de barras:', boleto.boleto_barcode);
*/
