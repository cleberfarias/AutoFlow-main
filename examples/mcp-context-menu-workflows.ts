/**
 * EXEMPLO: Workflow Completo com Menu de Contexto MCP
 * 
 * Este é um exemplo de como criar um workflow completo usando o menu de contexto.
 */

import { Workflow, WorkflowStep, StepType } from './types';

/**
 * CENÁRIO: E-commerce com Pagamento e Notificações
 * 
 * Fluxo:
 * 1. Cliente finaliza pedido (Gatilho)
 * 2. Cria checkout no Stripe (MCP - Stripe)
 * 3. Se pagamento aprovado:
 *    - Envia email de confirmação (MCP - SendGrid)
 *    - Envia WhatsApp de agradecimento (MCP - Twilio)
 * 4. Se pagamento falhou:
 *    - Cria ticket de suporte (MCP - Zendesk)
 */

export const exampleEcommerceWorkflow: Workflow = {
  id: 'ecommerce-mcp-example',
  name: 'Checkout E-commerce com MCPs',
  lastModified: Date.now(),
  steps: [
    // STEP 1: Gatilho - Pedido Finalizado
    {
      id: 'step-1',
      type: StepType.TRIGGER,
      title: 'Pedido Finalizado',
      description: 'Cliente clicou em "Finalizar Compra"',
      params: {
        inputs: ['order_id', 'customer_email', 'total_amount'],
        outputs: ['order_data']
      },
      position: { x: 100, y: 200 },
      nextSteps: ['step-2']
    },

    // STEP 2: MCP - Stripe Checkout
    // Criado com: Botão direito → 🔌 MCP Integration → 💳 Stripe → createCheckout
    {
      id: 'step-2',
      type: StepType.MCP,
      title: 'Stripe',
      description: 'Criar Checkout',
      params: {
        mcp: {
          service: 'stripe',
          action: 'createCheckout',
          params: {
            amount: '{{order_data.total}}',
            currency: 'BRL',
            customer_email: '{{order_data.customer_email}}',
            success_url: 'https://loja.com/sucesso',
            cancel_url: 'https://loja.com/cancelado',
            metadata: {
              order_id: '{{order_data.order_id}}'
            }
          }
        },
        outputs: ['checkout_url', 'payment_status']
      },
      position: { x: 500, y: 200 },
      nextSteps: ['step-3']
    },

    // STEP 3: Lógica - Verificar Pagamento
    {
      id: 'step-3',
      type: StepType.LOGIC,
      title: 'Pagamento Aprovado?',
      description: 'Verificar se o pagamento foi confirmado',
      params: {
        condition: 'payment_status === "approved"',
        outputs: ['payment_result']
      },
      position: { x: 900, y: 200 },
      nextSteps: ['step-4', 'step-7'] // Sucesso e Falha
    },

    // BRANCH SUCESSO

    // STEP 4: MCP - SendGrid Email
    // Criado com: Botão direito → 🔌 MCP Integration → 📧 SendGrid → sendEmail
    {
      id: 'step-4',
      type: StepType.MCP,
      title: 'SendGrid',
      description: 'Enviar Email',
      params: {
        mcp: {
          service: 'sendgrid',
          action: 'sendEmail',
          params: {
            to: '{{order_data.customer_email}}',
            from: 'vendas@loja.com',
            subject: 'Pedido Confirmado! 🎉',
            html: `
              <h1>Obrigado pela sua compra!</h1>
              <p>Seu pedido #{{order_data.order_id}} foi confirmado.</p>
              <p>Total: R$ {{order_data.total}}</p>
            `,
            templateId: 'order-confirmation'
          }
        },
        outputs: ['email_sent']
      },
      position: { x: 1300, y: 100 },
      nextSteps: ['step-5']
    },

    // STEP 5: MCP - Twilio WhatsApp
    // Criado com: Botão direito → 🔌 MCP Integration → 📱 Twilio → sendWhatsApp
    {
      id: 'step-5',
      type: StepType.MCP,
      title: 'Twilio',
      description: 'Enviar WhatsApp',
      params: {
        mcp: {
          service: 'twilio',
          action: 'sendWhatsApp',
          params: {
            to: '{{order_data.customer_phone}}',
            message: `Olá! Seu pedido #{{order_data.order_id}} foi confirmado! Total: R$ {{order_data.total}}. Obrigado por comprar conosco! 🛍️`
          }
        },
        outputs: ['whatsapp_sent']
      },
      position: { x: 1700, y: 100 },
      nextSteps: ['step-6']
    },

    // STEP 6: MCP - HubSpot CRM
    // Criado com: Botão direito → 🔌 MCP Integration → 🎯 HubSpot → createContact
    {
      id: 'step-6',
      type: StepType.MCP,
      title: 'HubSpot',
      description: 'Criar Contato',
      params: {
        mcp: {
          service: 'hubspot',
          action: 'createContact',
          params: {
            email: '{{order_data.customer_email}}',
            firstName: '{{order_data.customer_name}}',
            phone: '{{order_data.customer_phone}}',
            lifecycleStage: 'customer',
            customFields: {
              last_purchase_value: '{{order_data.total}}',
              last_purchase_date: '{{order_data.date}}'
            }
          }
        },
        outputs: ['contact_id']
      },
      position: { x: 2100, y: 100 }
    },

    // BRANCH FALHA

    // STEP 7: MCP - Zendesk Ticket
    // Criado com: Botão direito → 🔌 MCP Integration → 🎫 Zendesk → createTicket
    {
      id: 'step-7',
      type: StepType.MCP,
      title: 'Zendesk',
      description: 'Criar Ticket',
      params: {
        mcp: {
          service: 'zendesk',
          action: 'createTicket',
          params: {
            subject: 'Pagamento Recusado - Pedido #{{order_data.order_id}}',
            description: `
              Cliente: {{order_data.customer_email}}
              Pedido: #{{order_data.order_id}}
              Valor: R$ {{order_data.total}}
              Status: Pagamento Recusado
              
              Ação necessária: Entrar em contato com cliente para resolver problema no pagamento.
            `,
            priority: 'high',
            tags: ['payment-failed', 'ecommerce'],
            requester: {
              email: '{{order_data.customer_email}}',
              name: '{{order_data.customer_name}}'
            }
          }
        },
        outputs: ['ticket_id']
      },
      position: { x: 1300, y: 300 },
      nextSteps: ['step-8']
    },

    // STEP 8: MCP - SendGrid Email Falha
    {
      id: 'step-8',
      type: StepType.MCP,
      title: 'SendGrid',
      description: 'Enviar Email',
      params: {
        mcp: {
          service: 'sendgrid',
          action: 'sendEmail',
          params: {
            to: '{{order_data.customer_email}}',
            from: 'suporte@loja.com',
            subject: 'Problema no Pagamento',
            html: `
              <h1>Ops! Houve um problema com seu pagamento</h1>
              <p>Pedido: #{{order_data.order_id}}</p>
              <p>Nossa equipe entrará em contato em breve para ajudá-lo.</p>
              <p>Ticket de suporte: #{{ticket_id}}</p>
            `,
            templateId: 'payment-failed'
          }
        },
        outputs: ['email_sent']
      },
      position: { x: 1700, y: 300 }
    }
  ]
};

/**
 * EXEMPLO 2: Agendamento de Reuniões
 */
export const exampleSchedulingWorkflow: Workflow = {
  id: 'scheduling-mcp-example',
  name: 'Agendamento de Reuniões',
  lastModified: Date.now(),
  steps: [
    // Gatilho: Formulário preenchido
    {
      id: 'trigger-1',
      type: StepType.TRIGGER,
      title: 'Formulário de Agendamento',
      description: 'Cliente solicitou reunião',
      params: {
        outputs: ['lead_data']
      },
      position: { x: 100, y: 200 },
      nextSteps: ['mcp-calendar']
    },

    // MCP: Google Calendar
    {
      id: 'mcp-calendar',
      type: StepType.MCP,
      title: 'Google Calendar',
      description: 'Criar Reunião',
      params: {
        mcp: {
          service: 'google-calendar',
          action: 'createMeeting',
          params: {
            summary: 'Reunião com {{lead_data.name}}',
            description: 'Reunião agendada pelo AutoFlow',
            startTime: '{{lead_data.preferred_date}}',
            duration: 60,
            attendees: [
              '{{lead_data.email}}',
              'vendas@empresa.com'
            ],
            sendNotifications: true
          }
        },
        outputs: ['meeting_link', 'meeting_id']
      },
      position: { x: 500, y: 200 },
      nextSteps: ['mcp-email-confirm']
    },

    // MCP: SendGrid confirmação
    {
      id: 'mcp-email-confirm',
      type: StepType.MCP,
      title: 'SendGrid',
      description: 'Enviar Email',
      params: {
        mcp: {
          service: 'sendgrid',
          action: 'sendEmail',
          params: {
            to: '{{lead_data.email}}',
            subject: 'Reunião Confirmada! 📅',
            html: `
              <h1>Sua reunião foi agendada!</h1>
              <p>Data: {{lead_data.preferred_date}}</p>
              <p><a href="{{meeting_link}}">Clique aqui para entrar</a></p>
            `
          }
        }
      },
      position: { x: 900, y: 200 },
      nextSteps: ['mcp-hubspot']
    },

    // MCP: HubSpot criar lead
    {
      id: 'mcp-hubspot',
      type: StepType.MCP,
      title: 'HubSpot',
      description: 'Criar Contato',
      params: {
        mcp: {
          service: 'hubspot',
          action: 'createContact',
          params: {
            email: '{{lead_data.email}}',
            firstName: '{{lead_data.name}}',
            lifecycleStage: 'lead',
            customFields: {
              meeting_scheduled: true,
              meeting_date: '{{lead_data.preferred_date}}'
            }
          }
        }
      },
      position: { x: 1300, y: 200 }
    }
  ]
};

/**
 * COMO CRIAR ESTES WORKFLOWS USANDO O MENU DE CONTEXTO:
 * 
 * 1. Abra um workflow novo
 * 2. Para cada step MCP:
 *    a) Clique com botão direito no canvas
 *    b) Selecione "🔌 MCP Integration"
 *    c) Escolha o serviço (Stripe, SendGrid, etc.)
 *    d) Escolha a ação
 *    e) Configure os parâmetros
 * 3. Conecte os nodes arrastando as conexões
 * 4. Teste o workflow completo!
 */

/**
 * DICAS PARA USAR O MENU DE CONTEXTO:
 * 
 * ✅ Clique onde quer criar o node - ele aparecerá ali
 * ✅ Use variáveis {{}} para conectar dados entre nodes
 * ✅ Cores dos nodes indicam o serviço (Stripe azul, Twilio vermelho, etc.)
 * ✅ Emojis ajudam a identificar rapidamente cada integração
 * ✅ Você pode editar qualquer node depois de criado
 */

export default {
  ecommerce: exampleEcommerceWorkflow,
  scheduling: exampleSchedulingWorkflow
};
