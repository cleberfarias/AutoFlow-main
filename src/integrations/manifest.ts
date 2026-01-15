export interface ServiceDef {
  id: string;
  title: string;
  category: string;
  icon?: string;
  docsUrl?: string;
  enabledByDefault?: boolean;
}

export interface ActionDef {
  id: string; // logical action id (used in UI)
  title: string;
  description?: string;
  category?: string;
  confirmPolicy?: 'never' | 'always' | 'smart';
  serviceIds: string[]; // services that support this action
}

export interface ToolDef {
  name: string; // runtime tool name (eg calendar.createAppointment)
  serviceId: string;
  inputSchema?: any;
  outputSchema?: any;
  uiHints?: any;
}

export interface ToolManifest {
  version: string;
  services: ServiceDef[];
  actions: ActionDef[];
  tools: ToolDef[];
}

// Minimal, example manifest. Add more services/tools here.
const manifest: ToolManifest = {
  version: '1.0.0',
  services: [
    { id: 'google_calendar', title: 'Google Calendar', category: 'Calendar', docsUrl: 'https://developers.google.com/calendar' },
    { id: 'zendesk', title: 'Zendesk', category: 'Support' },
    { id: 'hubspot', title: 'HubSpot', category: 'CRM' },
    { id: 'stripe', title: 'Stripe', category: 'Payments' },
    { id: 'twilio', title: 'Twilio', category: 'Messaging' },
    { id: 'webhook', title: 'Webhook (HTTP)', category: 'Webhook' },
    { id: 'mongodb', title: 'MongoDB', category: 'Database' }
  ],
  actions: [
    { id: 'calendar.findAvailability', title: 'Buscar horários disponíveis', description: 'Consulta janelas livres no calendário', category: 'Calendar', confirmPolicy: 'never', serviceIds: ['google_calendar'] },
    { id: 'calendar.createAppointment', title: 'Criar agendamento', description: 'Cria evento no calendário', category: 'Calendar', confirmPolicy: 'smart', serviceIds: ['google_calendar'] },
    { id: 'support.createTicket', title: 'Criar ticket', description: 'Abrir ticket de suporte', category: 'Support', confirmPolicy: 'never', serviceIds: ['zendesk'] },
    { id: 'crm.updateContact', title: 'Atualizar CRM', description: 'Atualiza informações do contato no CRM', category: 'CRM', confirmPolicy: 'never', serviceIds: ['hubspot'] },
    { id: 'payment.charge', title: 'Cobrar / Pagamento', description: 'Criar cobrança/charge', category: 'Payments', confirmPolicy: 'always', serviceIds: ['stripe'] },
    { id: 'messaging.send', title: 'Enviar mensagem', description: 'Enviar mensagem por canal (SMS/WhatsApp)', category: 'Messaging', confirmPolicy: 'never', serviceIds: ['twilio'] },
    { id: 'http.request', title: 'Enviar requisição HTTP', description: 'Chamar webhook/endpoint', category: 'Webhook', confirmPolicy: 'never', serviceIds: ['webhook'] },
    { id: 'db.query', title: 'Query/Busca', description: 'Executar consulta no DB', category: 'Database', confirmPolicy: 'never', serviceIds: ['mongodb'] }
  ],
  tools: [
    {
      name: 'calendar.findAvailability',
      serviceId: 'google_calendar',
      inputSchema: {
        type: 'object',
        properties: {
          calendarId: { type: 'string', title: 'Calendar ID' },
          start: { type: 'string', format: 'date-time', title: 'Início' },
          end: { type: 'string', format: 'date-time', title: 'Fim' }
        },
        required: ['calendarId', 'start', 'end']
      },
      outputSchema: { type: 'object' }
    },
    {
      name: 'calendar.createAppointment',
      serviceId: 'google_calendar',
      inputSchema: {
        type: 'object',
        properties: {
          calendarId: { type: 'string', title: 'Calendar ID' },
          title: { type: 'string', title: 'Título' },
          start: { type: 'string', format: 'date-time', title: 'Início' },
          end: { type: 'string', format: 'date-time', title: 'Fim' }
        },
        required: ['calendarId', 'title', 'start', 'end']
      }
    },
    {
      name: 'http.request',
      serviceId: 'webhook',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', title: 'URL' },
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'], default: 'POST' },
          body: { type: 'string', title: 'Body (JSON)' }
        },
        required: ['url']
      }
    }
  ]
};

export default manifest;
