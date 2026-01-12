/**
 * MCP Actions - Ações de workflow que integram com MCPs
 * 
 * Use estas ações nos seus workflows para integrar com serviços externos
 */

import { StripeMCP } from '../integrations/mcp/stripe';
import { SendGridMCP } from '../integrations/mcp/sendgrid';
import { TwilioMCP } from '../integrations/mcp/twilio';
import { HubSpotMCP } from '../integrations/mcp/hubspot';
import { ZendeskMCP } from '../integrations/mcp/zendesk';
import { GoogleCalendarMCP } from '../integrations/mcp/google-calendar';
import { DocuSignMCP } from '../integrations/mcp/docusign';
import { PagarMeMCP } from '../integrations/mcp/pagarme';

// ============================================
// STRIPE ACTIONS
// ============================================

export async function stripeCreateCheckout(params: {
  priceId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string; sessionId: string }> {
  const stripe = new StripeMCP({
    apiKey: process.env.STRIPE_SECRET_KEY!,
    environment: 'production'
  });

  const session = await stripe.createCheckoutSession({
    line_items: [{ price: params.priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail
  });

  return {
    url: session.url,
    sessionId: session.id
  };
}

export async function stripeGetSubscriptions(customerId: string): Promise<any> {
  const stripe = new StripeMCP({
    apiKey: process.env.STRIPE_SECRET_KEY!,
    environment: 'production'
  });

  return stripe.listSubscriptions({ customer: customerId });
}

// ============================================
// SENDGRID ACTIONS
// ============================================

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const sendgrid = new SendGridMCP({
    apiKey: process.env.SENDGRID_API_KEY!
  });

  await sendgrid.sendSimpleEmail({
    to: params.to,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: params.subject,
    text: params.text,
    html: params.html
  });
}

export async function sendTemplateEmail(params: {
  to: string;
  templateId: string;
  dynamicData: Record<string, any>;
}): Promise<void> {
  const sendgrid = new SendGridMCP({
    apiKey: process.env.SENDGRID_API_KEY!
  });

  await sendgrid.sendTemplateEmail({
    to: params.to,
    from: { email: process.env.SENDGRID_FROM_EMAIL!, name: 'AutoFlow' },
    templateId: params.templateId,
    dynamicData: params.dynamicData
  });
}

// ============================================
// TWILIO ACTIONS
// ============================================

export async function sendSMS(params: {
  to: string;
  message: string;
}): Promise<{ sid: string; status: string }> {
  const twilio = new TwilioMCP({
    accountSid: process.env.TWILIO_ACCOUNT_SID!,
    authToken: process.env.TWILIO_AUTH_TOKEN!,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER!
  });

  const result = await twilio.sendSMS({
    to: params.to,
    body: params.message
  });

  return {
    sid: result.sid,
    status: result.status
  };
}

export async function sendWhatsApp(params: {
  to: string;
  message: string;
}): Promise<{ sid: string }> {
  const twilio = new TwilioMCP({
    accountSid: process.env.TWILIO_ACCOUNT_SID!,
    authToken: process.env.TWILIO_AUTH_TOKEN!,
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER!
  });

  const result = await twilio.sendWhatsApp({
    to: params.to,
    body: params.message
  });

  return { sid: result.sid };
}

export async function sendOTP(params: {
  to: string;
  channel: 'sms' | 'whatsapp';
}): Promise<{ sid: string }> {
  const twilio = new TwilioMCP({
    accountSid: process.env.TWILIO_ACCOUNT_SID!,
    authToken: process.env.TWILIO_AUTH_TOKEN!
  });

  const result = await twilio.startVerification({
    to: params.to,
    channel: params.channel,
    locale: 'pt-BR'
  });

  return { sid: result.sid };
}

export async function verifyOTP(params: {
  to: string;
  code: string;
}): Promise<{ valid: boolean }> {
  const twilio = new TwilioMCP({
    accountSid: process.env.TWILIO_ACCOUNT_SID!,
    authToken: process.env.TWILIO_AUTH_TOKEN!
  });

  const result = await twilio.checkVerification({
    to: params.to,
    code: params.code
  });

  return { valid: result.status === 'approved' };
}

// ============================================
// HUBSPOT ACTIONS
// ============================================

export async function hubspotCreateContact(params: {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
}): Promise<{ id: string }> {
  const hubspot = new HubSpotMCP({
    accessToken: process.env.HUBSPOT_ACCESS_TOKEN!
  });

  const contact = await hubspot.createContact({
    properties: params
  });

  return { id: contact.id! };
}

export async function hubspotCreateDeal(params: {
  dealname: string;
  amount: string;
  contactEmail: string;
}): Promise<{ id: string }> {
  const hubspot = new HubSpotMCP({
    accessToken: process.env.HUBSPOT_ACCESS_TOKEN!
  });

  // Busca contato
  const contact = await hubspot.getContactByEmail(params.contactEmail);
  
  // Cria deal
  const deal = await hubspot.createDeal({
    properties: {
      dealname: params.dealname,
      dealstage: 'qualifiedtobuy',
      amount: params.amount
    }
  });

  // Associa contato ao deal
  if (contact) {
    await hubspot.associateContactToDeal(contact.id!, deal.id!);
  }

  return { id: deal.id! };
}

// ============================================
// ZENDESK ACTIONS
// ============================================

export async function zendeskCreateTicket(params: {
  subject: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requesterEmail: string;
  requesterName: string;
}): Promise<{ id: number; url: string }> {
  const zendesk = new ZendeskMCP({
    subdomain: process.env.ZENDESK_SUBDOMAIN!,
    email: process.env.ZENDESK_EMAIL!,
    apiToken: process.env.ZENDESK_API_TOKEN!
  });

  const ticket = await zendesk.createTicket({
    subject: params.subject,
    description: params.description,
    status: 'new',
    priority: params.priority,
    requester: {
      name: params.requesterName,
      email: params.requesterEmail
    }
  });

  return {
    id: ticket.ticket.id!,
    url: ticket.ticket.url!
  };
}

export async function zendeskAddComment(params: {
  ticketId: number;
  comment: string;
  isPublic: boolean;
}): Promise<void> {
  const zendesk = new ZendeskMCP({
    subdomain: process.env.ZENDESK_SUBDOMAIN!,
    email: process.env.ZENDESK_EMAIL!,
    apiToken: process.env.ZENDESK_API_TOKEN!
  });

  await zendesk.addComment(params.ticketId, {
    body: params.comment,
    public: params.isPublic
  });
}

// ============================================
// GOOGLE CALENDAR ACTIONS
// ============================================

export async function createMeeting(params: {
  summary: string;
  description?: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  attendees: string[]; // emails
}): Promise<{ eventId: string; meetLink: string }> {
  const calendar = new GoogleCalendarMCP({
    accessToken: process.env.GOOGLE_ACCESS_TOKEN!,
    calendarId: 'primary'
  });

  const event = await calendar.createMeetingWithMeet({
    summary: params.summary,
    description: params.description,
    start: { dateTime: params.startTime, timeZone: 'America/Sao_Paulo' },
    end: { dateTime: params.endTime, timeZone: 'America/Sao_Paulo' },
    attendees: params.attendees.map(email => ({ email }))
  });

  return {
    eventId: event.id,
    meetLink: event.conferenceData?.entryPoints[0].uri || ''
  };
}

export async function checkAvailability(params: {
  date: string; // YYYY-MM-DD
  durationMinutes: number;
}): Promise<{ available: boolean; nextSlot?: { start: string; end: string } }> {
  const calendar = new GoogleCalendarMCP({
    accessToken: process.env.GOOGLE_ACCESS_TOKEN!,
    calendarId: 'primary'
  });

  const slot = await calendar.findNextAvailableSlot({
    durationMinutes: params.durationMinutes,
    startDate: params.date,
    endDate: params.date,
    workingHours: { start: '09:00', end: '18:00' }
  });

  return {
    available: slot !== null,
    nextSlot: slot || undefined
  };
}

// ============================================
// DOCUSIGN ACTIONS
// ============================================

export async function sendDocumentForSignature(params: {
  documentBase64: string;
  documentName: string;
  signerEmail: string;
  signerName: string;
  subject: string;
}): Promise<{ envelopeId: string; status: string }> {
  const docusign = new DocuSignMCP({
    accessToken: process.env.DOCUSIGN_ACCESS_TOKEN!,
    accountId: process.env.DOCUSIGN_ACCOUNT_ID!,
    basePath: process.env.DOCUSIGN_BASE_PATH!,
    environment: 'production'
  });

  const envelope = await docusign.sendDocument({
    emailSubject: params.subject,
    status: 'sent',
    documents: [{
      documentBase64: params.documentBase64,
      name: params.documentName,
      fileExtension: 'pdf',
      documentId: '1'
    }],
    recipients: {
      signers: [{
        email: params.signerEmail,
        name: params.signerName,
        recipientId: '1',
        routingOrder: '1',
        tabs: {
          signHereTabs: [{
            documentId: '1',
            pageNumber: '1',
            xPosition: '100',
            yPosition: '650'
          }]
        }
      }]
    }
  });

  return {
    envelopeId: envelope.envelopeId,
    status: envelope.status
  };
}

// ============================================
// PAGAR.ME ACTIONS
// ============================================

export async function pagarmeCreatePixPayment(params: {
  amount: number; // em centavos
  customerName: string;
  customerEmail: string;
  customerDocument: string;
}): Promise<{ qrCode: string; qrCodeUrl: string; transactionId: string }> {
  const pagarme = new PagarMeMCP({
    apiKey: process.env.PAGARME_API_KEY!,
    environment: 'production'
  });

  const transaction = await pagarme.createPixTransaction({
    amount: params.amount,
    customer: {
      name: params.customerName,
      email: params.customerEmail,
      type: 'individual',
      document: params.customerDocument,
      document_type: 'cpf'
    },
    expires_in: 1800 // 30 minutos
  });

  return {
    qrCode: transaction.pix_qr_code!,
    qrCodeUrl: transaction.pix_qr_code_url!,
    transactionId: transaction.id
  };
}

// ============================================
// REGISTRO DE AÇÕES DISPONÍVEIS
// ============================================

export const MCP_ACTIONS = {
  // Stripe
  'stripe.createCheckout': stripeCreateCheckout,
  'stripe.getSubscriptions': stripeGetSubscriptions,
  
  // SendGrid
  'sendgrid.sendEmail': sendEmail,
  'sendgrid.sendTemplate': sendTemplateEmail,
  
  // Twilio
  'twilio.sendSMS': sendSMS,
  'twilio.sendWhatsApp': sendWhatsApp,
  'twilio.sendOTP': sendOTP,
  'twilio.verifyOTP': verifyOTP,
  
  // HubSpot
  'hubspot.createContact': hubspotCreateContact,
  'hubspot.createDeal': hubspotCreateDeal,
  
  // Zendesk
  'zendesk.createTicket': zendeskCreateTicket,
  'zendesk.addComment': zendeskAddComment,
  
  // Google Calendar
  'calendar.createMeeting': createMeeting,
  'calendar.checkAvailability': checkAvailability,
  
  // DocuSign
  'docusign.sendDocument': sendDocumentForSignature,
  
  // Pagar.me
  'pagarme.createPix': pagarmeCreatePixPayment
};

export type MCPActionType = keyof typeof MCP_ACTIONS;
