# 🔌 Guia: Como Usar MCPs nos Workflows

Este guia mostra como integrar os **12 MCPs** (Model Context Protocol) criados com o sistema de workflows do AutoFlow.

---

## 📋 Sumário

1. [O que são MCPs?](#o-que-são-mcps)
2. [MCPs Disponíveis](#mcps-disponíveis)
3. [Como Usar nos Workflows](#como-usar-nos-workflows)
4. [Exemplos Práticos](#exemplos-práticos)
5. [Configuração de Variáveis](#configuração-de-variáveis)
6. [Ações Pré-Prontas](#ações-pré-prontas)

---

## 🤔 O que são MCPs?

**MCPs (Model Context Protocol)** são integrações com serviços externos que você pode usar nos seus workflows. Eles permitem que seu AutoFlow se conecte com:

- 💳 Gateways de pagamento (Stripe, Pagar.me)
- 📧 Envio de emails (SendGrid)
- 📱 SMS e WhatsApp (Twilio)
- 🗓️ Agendamentos (Google Calendar)
- 📝 Assinaturas digitais (DocuSign, Clicksign)
- 📊 CRM (HubSpot, RD Station)
- 🎫 Help Desk (Zendesk)
- 🗄️ Bancos de dados (MongoDB Atlas)
- ⚖️ Jurídico (Advbox)

---

## 📦 MCPs Disponíveis

| MCP | Descrição | Principais Funcionalidades |
|-----|-----------|---------------------------|
| **Advbox** | Sistema jurídico brasileiro | Processos, prazos, clientes |
| **Stripe** | Pagamentos internacionais | Checkout, assinaturas, PIX |
| **Google Calendar** | Agenda e videoconferências | Criar eventos, Google Meet |
| **DocuSign** | Assinaturas eletrônicas | Envio de documentos para assinatura |
| **Clicksign** | Assinaturas BR | Envio de contratos com validade jurídica |
| **HubSpot** | CRM e Marketing | Contatos, deals, tickets |
| **RD Station** | Marketing BR | Leads, conversões, funis |
| **SendGrid** | Email transacional | Envio de emails e templates |
| **Twilio** | SMS/WhatsApp/Voice | Mensagens, OTP, chamadas |
| **Pagar.me** | Gateway BR | PIX, boleto, cartão |
| **Zendesk** | Help Desk | Tickets, comentários, usuários |
| **MongoDB Atlas** | Database DBaaS | Clusters, backups, métricas |

---

## 🔧 Como Usar nos Workflows

### Método 1: Usar Ações Pré-Prontas

O arquivo `src/services/mcpActions.ts` já contém **20+ ações prontas** para uso:

```typescript
// No seu workflow, importe a ação:
import { sendEmail, sendSMS, createMeeting } from '../services/mcpActions';

// Use diretamente:
await sendEmail({
  to: 'cliente@example.com',
  subject: 'Bem-vindo!',
  text: 'Obrigado por se cadastrar.'
});
```

### Método 2: Usar MCPs Diretamente

Você pode importar e usar qualquer MCP nos seus workflows:

```typescript
import { StripeMCP } from '../integrations/mcp/stripe';
import { TwilioMCP } from '../integrations/mcp/twilio';

// Em uma ação do workflow:
async function processPayment(userId: string) {
  const stripe = new StripeMCP({
    apiKey: process.env.STRIPE_SECRET_KEY!,
    environment: 'production'
  });
  
  const session = await stripe.createCheckoutSession({
    line_items: [{ price: 'price_123', quantity: 1 }],
    mode: 'subscription',
    success_url: 'https://app.com/success',
    cancel_url: 'https://app.com/cancel',
    customer_email: 'user@example.com'
  });
  
  return session.url; // URL do checkout
}
```

### Método 3: Criar Nodes Customizados

Crie nodes no workflow que executam ações de MCP:

```typescript
// types.ts
export interface MCPNode extends Node {
  type: 'mcp';
  data: {
    mcpType: 'stripe' | 'sendgrid' | 'twilio' | 'hubspot' | 'zendesk';
    action: string;
    params: Record<string, any>;
  };
}
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Fluxo de Pagamento com PIX

```typescript
// Workflow: "Pagamento PIX"
import { pagarmeCreatePixPayment } from '../services/mcpActions';

const workflow = {
  nodes: [
    {
      id: '1',
      type: 'trigger',
      data: { event: 'purchase_initiated' }
    },
    {
      id: '2',
      type: 'mcp',
      data: {
        action: async (context) => {
          const result = await pagarmeCreatePixPayment({
            amount: context.data.amount * 100, // R$ para centavos
            customerName: context.data.customerName,
            customerEmail: context.data.customerEmail,
            customerDocument: context.data.cpf
          });
          
          return {
            qrCode: result.qrCode,
            pixUrl: result.qrCodeUrl,
            transactionId: result.transactionId
          };
        }
      }
    },
    {
      id: '3',
      type: 'send_email',
      data: {
        action: async (context) => {
          await sendEmail({
            to: context.data.customerEmail,
            subject: 'PIX Gerado - Complete seu pagamento',
            text: `Seu PIX foi gerado! Código: ${context.previousResult.qrCode}`,
            html: `
              <h1>Pagamento via PIX</h1>
              <p>Escaneie o QR Code abaixo:</p>
              <img src="${context.previousResult.pixUrl}" />
            `
          });
        }
      }
    }
  ]
};
```

### Exemplo 2: Fluxo de Onboarding com CRM

```typescript
// Workflow: "Novo Cliente"
import { hubspotCreateContact, sendTemplateEmail, sendSMS } from '../services/mcpActions';

async function onboardingFlow(userData: any) {
  // 1. Criar contato no HubSpot
  const contact = await hubspotCreateContact({
    email: userData.email,
    firstname: userData.firstName,
    lastname: userData.lastName,
    phone: userData.phone
  });
  
  // 2. Enviar email de boas-vindas
  await sendTemplateEmail({
    to: userData.email,
    templateId: 'd-welcome-template',
    dynamicData: {
      firstName: userData.firstName,
      activationLink: `https://app.com/activate/${contact.id}`
    }
  });
  
  // 3. Enviar SMS de confirmação
  await sendSMS({
    to: userData.phone,
    message: `Bem-vindo ${userData.firstName}! Acesse seu email para ativar sua conta.`
  });
  
  return { contactId: contact.id };
}
```

### Exemplo 3: Fluxo de Assinatura de Contrato

```typescript
// Workflow: "Assinatura de Contrato"
import { sendDocumentForSignature, sendWhatsApp } from '../services/mcpActions';

async function contractSigningFlow(data: any) {
  // 1. Gerar PDF do contrato (seu código)
  const pdfBase64 = await generateContractPDF(data);
  
  // 2. Enviar para assinatura via DocuSign
  const envelope = await sendDocumentForSignature({
    documentBase64: pdfBase64,
    documentName: 'Contrato de Prestação de Serviços.pdf',
    signerEmail: data.clientEmail,
    signerName: data.clientName,
    subject: 'Assinatura do Contrato - Acme Inc'
  });
  
  // 3. Notificar via WhatsApp
  await sendWhatsApp({
    to: data.clientPhone,
    message: `Olá ${data.clientName}! Enviamos o contrato para seu email. Por favor, assine digitalmente. ID: ${envelope.envelopeId}`
  });
  
  return { envelopeId: envelope.envelopeId };
}
```

### Exemplo 4: Fluxo de Agendamento com Google Meet

```typescript
// Workflow: "Agendar Reunião"
import { createMeeting, checkAvailability, sendEmail } from '../services/mcpActions';

async function scheduleMeetingFlow(data: any) {
  // 1. Verificar disponibilidade
  const availability = await checkAvailability({
    date: data.preferredDate,
    durationMinutes: 60
  });
  
  if (!availability.available) {
    throw new Error('Horário indisponível');
  }
  
  // 2. Criar reunião com Google Meet
  const meeting = await createMeeting({
    summary: `Reunião com ${data.clientName}`,
    description: data.meetingNotes,
    startTime: availability.nextSlot!.start,
    endTime: availability.nextSlot!.end,
    attendees: [data.clientEmail]
  });
  
  // 3. Enviar confirmação
  await sendEmail({
    to: data.clientEmail,
    subject: 'Reunião Agendada',
    text: `Sua reunião foi agendada!\n\nLink Google Meet: ${meeting.meetLink}`
  });
  
  return { eventId: meeting.eventId, meetLink: meeting.meetLink };
}
```

### Exemplo 5: Fluxo de Suporte Automatizado

```typescript
// Workflow: "Criar Ticket Zendesk"
import { zendeskCreateTicket, sendSMS } from '../services/mcpActions';

async function createSupportTicketFlow(data: any) {
  // 1. Criar ticket no Zendesk
  const ticket = await zendeskCreateTicket({
    subject: data.subject,
    description: data.description,
    priority: data.priority || 'normal',
    requesterEmail: data.userEmail,
    requesterName: data.userName
  });
  
  // 2. Notificar usuário via SMS
  await sendSMS({
    to: data.userPhone,
    message: `Ticket #${ticket.id} criado! Acompanhe em: ${ticket.url}`
  });
  
  return { ticketId: ticket.id, ticketUrl: ticket.url };
}
```

---

## ⚙️ Configuração de Variáveis

Adicione as variáveis de ambiente no arquivo `.env`:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx

# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@example.com

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+14155551234
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_VERIFY_SERVICE_SID=VAxxxxx

# HubSpot
HUBSPOT_ACCESS_TOKEN=pat-na1-xxxxx

# RD Station
RDSTATION_ACCESS_TOKEN=xxxxx
RDSTATION_REFRESH_TOKEN=xxxxx
RDSTATION_CLIENT_ID=xxxxx
RDSTATION_CLIENT_SECRET=xxxxx

# Zendesk
ZENDESK_SUBDOMAIN=mycompany
ZENDESK_EMAIL=agent@example.com
ZENDESK_API_TOKEN=xxxxx

# Google Calendar
GOOGLE_ACCESS_TOKEN=ya29.xxxxx
GOOGLE_REFRESH_TOKEN=1//xxxxx
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx

# DocuSign
DOCUSIGN_ACCESS_TOKEN=eyJxxxxx
DOCUSIGN_ACCOUNT_ID=abc123
DOCUSIGN_BASE_PATH=https://na3.docusign.net/restapi

# Clicksign
CLICKSIGN_ACCESS_TOKEN=xxxxx

# Pagar.me
PAGARME_API_KEY=sk_test_xxxxx

# Advbox
ADVBOX_API_TOKEN=xxxxx

# MongoDB Atlas
MONGODB_ATLAS_PUBLIC_KEY=xxxxx
MONGODB_ATLAS_PRIVATE_KEY=xxxxx
MONGODB_ATLAS_GROUP_ID=xxxxx
```

---

## 🎯 Ações Pré-Prontas

Ações disponíveis em `src/services/mcpActions.ts`:

### 💳 Stripe
- `stripe.createCheckout` - Criar sessão de checkout
- `stripe.getSubscriptions` - Listar assinaturas

### 📧 SendGrid
- `sendgrid.sendEmail` - Enviar email simples
- `sendgrid.sendTemplate` - Enviar email com template

### 📱 Twilio
- `twilio.sendSMS` - Enviar SMS
- `twilio.sendWhatsApp` - Enviar WhatsApp
- `twilio.sendOTP` - Enviar código OTP
- `twilio.verifyOTP` - Verificar código OTP

### 📊 HubSpot
- `hubspot.createContact` - Criar contato
- `hubspot.createDeal` - Criar negócio

### 🎫 Zendesk
- `zendesk.createTicket` - Criar ticket
- `zendesk.addComment` - Adicionar comentário

### 🗓️ Google Calendar
- `calendar.createMeeting` - Criar reunião com Google Meet
- `calendar.checkAvailability` - Verificar disponibilidade

### 📝 DocuSign
- `docusign.sendDocument` - Enviar documento para assinatura

### 💰 Pagar.me
- `pagarme.createPix` - Criar pagamento PIX

---

## 🚀 Como Executar Ações nos Workflows

### Opção 1: Via actionRunner

Atualize o `actionRunner.ts` para suportar MCPs:

```typescript
import { MCP_ACTIONS } from './mcpActions';

export async function runAction(action: string, params: any) {
  if (action.startsWith('mcp.')) {
    const mcpAction = action.replace('mcp.', '') as keyof typeof MCP_ACTIONS;
    return await MCP_ACTIONS[mcpAction](params);
  }
  
  // ... resto das ações existentes
}
```

### Opção 2: Via API Endpoint

Crie endpoint Vercel para executar ações de MCP:

```typescript
// api/mcp-action.ts
import { MCP_ACTIONS } from '../src/services/mcpActions';

export default async function handler(req, res) {
  const { action, params } = req.body;
  
  try {
    const result = await MCP_ACTIONS[action](params);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

---

## 📚 Próximos Passos

1. Configure as variáveis de ambiente
2. Teste cada MCP individualmente
3. Crie workflows compostos com múltiplos MCPs
4. Configure webhooks para eventos assíncronos
5. Monitore logs e erros

---

## 💬 Suporte

- Documentação completa em `/docs`
- Exemplos em `/examples`
- Issues: GitHub

---

**Desenvolvido com ❤️ para AutoFlow**
