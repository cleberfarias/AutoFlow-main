/**
 * Exemplos de Workflows com MCPs
 * 
 * Workflows prontos para copiar e adaptar no seu projeto
 */

import {
  sendEmail,
  sendTemplateEmail,
  sendSMS,
  sendWhatsApp,
  sendOTP,
  verifyOTP,
  hubspotCreateContact,
  hubspotCreateDeal,
  zendeskCreateTicket,
  createMeeting,
  checkAvailability,
  sendDocumentForSignature,
  pagarmeCreatePixPayment,
  stripeCreateCheckout
} from './mcpActions';

// ============================================
// WORKFLOW 1: E-COMMERCE COMPLETO
// ============================================

export async function ecommerceCheckoutFlow(order: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDocument: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  total: number;
  paymentMethod: 'pix' | 'credit_card';
}) {
  // 1. Criar contato no HubSpot
  const contact = await hubspotCreateContact({
    email: order.customerEmail,
    firstname: order.customerName.split(' ')[0],
    lastname: order.customerName.split(' ').slice(1).join(' '),
    phone: order.customerPhone
  });

  // 2. Criar deal no HubSpot
  const deal = await hubspotCreateDeal({
    dealname: `Pedido - ${order.customerName}`,
    amount: order.total.toString(),
    contactEmail: order.customerEmail
  });

  let paymentResult;

  // 3. Processar pagamento
  if (order.paymentMethod === 'pix') {
    paymentResult = await pagarmeCreatePixPayment({
      amount: Math.round(order.total * 100), // R$ para centavos
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerDocument: order.customerDocument
    });

    // 4. Enviar email com QR Code PIX
    await sendTemplateEmail({
      to: order.customerEmail,
      templateId: 'd-pix-payment',
      dynamicData: {
        customerName: order.customerName,
        orderTotal: order.total.toFixed(2),
        pixQrCode: paymentResult.qrCode,
        pixQrCodeUrl: paymentResult.qrCodeUrl,
        expirationTime: '30 minutos'
      }
    });

    // 5. Enviar WhatsApp com link do PIX
    await sendWhatsApp({
      to: order.customerPhone,
      message: `Olá ${order.customerName}! Seu pedido foi confirmado! 🎉\n\nValor: R$ ${order.total.toFixed(2)}\n\nPague via PIX: ${paymentResult.qrCodeUrl}`
    });

  } else {
    // Pagamento com cartão via Stripe
    paymentResult = await stripeCreateCheckout({
      priceId: 'price_xxx', // Configurar no Stripe
      customerEmail: order.customerEmail,
      successUrl: 'https://app.com/success',
      cancelUrl: 'https://app.com/cancel'
    });

    // Enviar email com link de pagamento
    await sendEmail({
      to: order.customerEmail,
      subject: 'Complete seu pagamento',
      text: `Acesse: ${paymentResult.url}`,
      html: `<a href="${paymentResult.url}">Clique aqui para pagar</a>`
    });
  }

  return {
    contactId: contact.id,
    dealId: deal.id,
    paymentResult
  };
}

// ============================================
// WORKFLOW 2: AGENDAMENTO COM CONFIRMAÇÃO
// ============================================

export async function scheduleMeetingWithConfirmation(params: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  preferredDate: string; // YYYY-MM-DD
  meetingType: string;
  notes: string;
}) {
  // 1. Verificar disponibilidade
  const availability = await checkAvailability({
    date: params.preferredDate,
    durationMinutes: 60
  });

  if (!availability.available) {
    throw new Error('Horário indisponível. Escolha outra data.');
  }

  // 2. Enviar código de confirmação via SMS
  await sendOTP({
    to: params.clientPhone,
    channel: 'sms'
  });

  // Aguardar usuário digitar código (implementar na UI)
  // const codeInput = await waitForUserInput();
  
  // 3. Verificar código (exemplo)
  const verified = await verifyOTP({
    to: params.clientPhone,
    code: '123456' // Código digitado pelo usuário
  });

  if (!verified.valid) {
    throw new Error('Código inválido');
  }

  // 4. Criar reunião no Google Calendar
  const meeting = await createMeeting({
    summary: `${params.meetingType} - ${params.clientName}`,
    description: params.notes,
    startTime: availability.nextSlot!.start,
    endTime: availability.nextSlot!.end,
    attendees: [params.clientEmail]
  });

  // 5. Enviar confirmação por email
  await sendTemplateEmail({
    to: params.clientEmail,
    templateId: 'd-meeting-confirmation',
    dynamicData: {
      clientName: params.clientName,
      meetingType: params.meetingType,
      dateTime: new Date(availability.nextSlot!.start).toLocaleString('pt-BR'),
      meetLink: meeting.meetLink,
      notes: params.notes
    }
  });

  // 6. Enviar lembrete por WhatsApp
  await sendWhatsApp({
    to: params.clientPhone,
    message: `Reunião confirmada! 📅\n\n${params.meetingType}\nData: ${new Date(availability.nextSlot!.start).toLocaleString('pt-BR')}\n\nLink: ${meeting.meetLink}`
  });

  return {
    eventId: meeting.eventId,
    meetLink: meeting.meetLink
  };
}

// ============================================
// WORKFLOW 3: ONBOARDING DE CLIENTE
// ============================================

export async function customerOnboardingFlow(customer: {
  name: string;
  email: string;
  phone: string;
  company?: string;
  plan: string;
}) {
  // 1. Criar contato no HubSpot
  const contact = await hubspotCreateContact({
    email: customer.email,
    firstname: customer.name.split(' ')[0],
    lastname: customer.name.split(' ').slice(1).join(' '),
    phone: customer.phone
  });

  // 2. Enviar email de boas-vindas
  await sendTemplateEmail({
    to: customer.email,
    templateId: 'd-welcome',
    dynamicData: {
      customerName: customer.name,
      plan: customer.plan,
      activationLink: `https://app.com/activate/${contact.id}`,
      supportEmail: 'suporte@example.com'
    }
  });

  // 3. Enviar SMS de confirmação
  await sendSMS({
    to: customer.phone,
    message: `Bem-vindo ${customer.name}! Seu plano ${customer.plan} foi ativado. Acesse seu email para começar.`
  });

  // 4. Agendar reunião de onboarding
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const onboardingMeeting = await createMeeting({
    summary: `Onboarding - ${customer.name}`,
    description: 'Sessão de apresentação e configuração inicial',
    startTime: tomorrow.toISOString(),
    endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString(),
    attendees: [customer.email]
  });

  // 5. Criar deal no HubSpot
  const deal = await hubspotCreateDeal({
    dealname: `Novo Cliente - ${customer.name}`,
    amount: '0',
    contactEmail: customer.email
  });

  return {
    contactId: contact.id,
    dealId: deal.id,
    onboardingMeetingLink: onboardingMeeting.meetLink
  };
}

// ============================================
// WORKFLOW 4: SUPORTE AUTOMATIZADO
// ============================================

export async function automatedSupportFlow(ticket: {
  userEmail: string;
  userName: string;
  userPhone: string;
  subject: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
}) {
  // 1. Criar ticket no Zendesk
  const zendeskTicket = await zendeskCreateTicket({
    subject: ticket.subject,
    description: ticket.description,
    priority: ticket.priority,
    requesterEmail: ticket.userEmail,
    requesterName: ticket.userName
  });

  // 2. Enviar confirmação por email
  await sendTemplateEmail({
    to: ticket.userEmail,
    templateId: 'd-ticket-created',
    dynamicData: {
      userName: ticket.userName,
      ticketId: zendeskTicket.id,
      ticketUrl: zendeskTicket.url,
      subject: ticket.subject,
      priority: ticket.priority,
      estimatedResponse: ticket.priority === 'urgent' ? '2 horas' : '24 horas'
    }
  });

  // 3. Notificar por SMS se urgente
  if (ticket.priority === 'urgent' || ticket.priority === 'high') {
    await sendSMS({
      to: ticket.userPhone,
      message: `Ticket #${zendeskTicket.id} criado com prioridade ${ticket.priority.toUpperCase()}. Acompanhe em: ${zendeskTicket.url}`
    });
  }

  // 4. Se for problema técnico crítico, criar reunião de emergência
  if (ticket.priority === 'urgent' && ticket.category === 'technical') {
    const now = new Date();
    const meetingTime = new Date(now.getTime() + 30 * 60 * 1000); // +30min

    const emergencyMeeting = await createMeeting({
      summary: `URGENTE: ${ticket.subject}`,
      description: ticket.description,
      startTime: meetingTime.toISOString(),
      endTime: new Date(meetingTime.getTime() + 30 * 60 * 1000).toISOString(),
      attendees: [ticket.userEmail]
    });

    await sendWhatsApp({
      to: ticket.userPhone,
      message: `🚨 URGENTE: Reunião de emergência agendada!\n\nHorário: ${meetingTime.toLocaleString('pt-BR')}\nLink Google Meet: ${emergencyMeeting.meetLink}`
    });
  }

  return {
    ticketId: zendeskTicket.id,
    ticketUrl: zendeskTicket.url
  };
}

// ============================================
// WORKFLOW 5: ASSINATURA DE CONTRATO
// ============================================

export async function contractSigningFlow(contract: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientDocument: string;
  contractType: string;
  pdfBase64: string; // Documento já gerado em PDF
}) {
  // 1. Criar contato no HubSpot
  const contact = await hubspotCreateContact({
    email: contract.clientEmail,
    firstname: contract.clientName.split(' ')[0],
    lastname: contract.clientName.split(' ').slice(1).join(' '),
    phone: contract.clientPhone
  });

  // 2. Enviar documento para assinatura (DocuSign)
  const envelope = await sendDocumentForSignature({
    documentBase64: contract.pdfBase64,
    documentName: `${contract.contractType}.pdf`,
    signerEmail: contract.clientEmail,
    signerName: contract.clientName,
    subject: `Assinatura de ${contract.contractType}`
  });

  // 3. Notificar por email
  await sendTemplateEmail({
    to: contract.clientEmail,
    templateId: 'd-contract-signature',
    dynamicData: {
      clientName: contract.clientName,
      contractType: contract.contractType,
      envelopeId: envelope.envelopeId,
      expirationDays: 7
    }
  });

  // 4. Notificar por WhatsApp
  await sendWhatsApp({
    to: contract.clientPhone,
    message: `Olá ${contract.clientName}! 📄\n\nSeu ${contract.contractType} está pronto para assinatura.\n\nVerifique seu email e assine digitalmente.\n\nID: ${envelope.envelopeId}`
  });

  // 5. Criar deal no HubSpot
  const deal = await hubspotCreateDeal({
    dealname: `${contract.contractType} - ${contract.clientName}`,
    amount: '0',
    contactEmail: contract.clientEmail
  });

  // 6. Agendar lembrete (depois de 24h se não assinar)
  // Implementar com cron job ou scheduled function

  return {
    contactId: contact.id,
    dealId: deal.id,
    envelopeId: envelope.envelopeId
  };
}

// ============================================
// WORKFLOW 6: RECUPERAÇÃO DE CARRINHO ABANDONADO
// ============================================

export async function abandonedCartRecoveryFlow(cart: {
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  total: number;
  cartUrl: string;
}) {
  // 1. Enviar email de lembrete (1 hora depois)
  await sendTemplateEmail({
    to: cart.customerEmail,
    templateId: 'd-abandoned-cart',
    dynamicData: {
      customerName: cart.customerName,
      cartTotal: cart.total.toFixed(2),
      itemCount: cart.items.length,
      cartUrl: cart.cartUrl,
      discountCode: 'VOLTE10' // 10% de desconto
    }
  });

  // 2. Enviar SMS (6 horas depois)
  setTimeout(async () => {
    await sendSMS({
      to: cart.customerPhone,
      message: `${cart.customerName}, você deixou ${cart.items.length} itens no carrinho! Use VOLTE10 e ganhe 10% OFF: ${cart.cartUrl}`
    });
  }, 6 * 60 * 60 * 1000);

  // 3. Enviar WhatsApp (24 horas depois)
  setTimeout(async () => {
    await sendWhatsApp({
      to: cart.customerPhone,
      message: `Última chance! 🎁\n\nSeu carrinho expira em breve.\n\n10% OFF com VOLTE10\n\nFinalize agora: ${cart.cartUrl}`
    });
  }, 24 * 60 * 60 * 1000);

  return { success: true };
}

// ============================================
// WORKFLOW 7: FEEDBACK PÓS-ATENDIMENTO
// ============================================

export async function postServiceFeedbackFlow(service: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceType: string;
  ticketId: number;
  agentName: string;
}) {
  // 1. Enviar email de pesquisa de satisfação
  await sendTemplateEmail({
    to: service.customerEmail,
    templateId: 'd-feedback-survey',
    dynamicData: {
      customerName: service.customerName,
      serviceType: service.serviceType,
      agentName: service.agentName,
      ticketId: service.ticketId,
      surveyUrl: `https://app.com/feedback/${service.ticketId}`
    }
  });

  // 2. Enviar SMS com link curto
  await sendSMS({
    to: service.customerPhone,
    message: `Olá ${service.customerName}! Como foi seu atendimento? Responda em 30 segundos: https://app.com/f/${service.ticketId}`
  });

  return { success: true };
}

// ============================================
// EXPORTAR TODOS OS WORKFLOWS
// ============================================

export const WORKFLOWS = {
  ecommerce: ecommerceCheckoutFlow,
  scheduling: scheduleMeetingWithConfirmation,
  onboarding: customerOnboardingFlow,
  support: automatedSupportFlow,
  contract: contractSigningFlow,
  cartRecovery: abandonedCartRecoveryFlow,
  feedback: postServiceFeedbackFlow
};
