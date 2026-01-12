
export enum StepType {
  TRIGGER = 'TRIGGER',
  ACTION = 'ACTION',
  DATA = 'DATA',
  LOGIC = 'LOGIC',
  ERROR_HANDLER = 'ERROR_HANDLER',
  MCP = 'MCP' // Ações de integração com serviços externos
}

export interface WorkflowStep {
  id: string;
  type: StepType;
  title: string;
  description: string;
  nextSteps?: string[];
  params: {
    url?: string;
    method?: string;
    condition?: string;
    inputs?: string[];
    outputs?: string[];
    // API integration config (optional)
    api?: {
      url?: string;
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      headers?: Array<{ name: string; value: string }>;
      bodyTemplate?: string; // templated body using {{var}} and {{SECRET:NAME}}
      auth?: { type?: 'none' | 'bearer' | 'apiKey' | 'basic'; headerName?: string; secretRef?: string };
      responseMapping?: Array<{ jsonPath: string; outputKey: string }>;
      timeoutMs?: number;
    };
    // MCP integration config
    mcp?: {
      service: 'stripe' | 'sendgrid' | 'twilio' | 'hubspot' | 'zendesk' | 'google-calendar' | 'docusign' | 'clicksign' | 'rdstation' | 'pagarme' | 'advbox' | 'mongodb';
      action: string; // Ex: 'createCheckout', 'sendEmail', 'sendSMS'
      params: Record<string, any>; // Parâmetros específicos da ação
    };
    [key: string]: any;
  };
  position: { x: number; y: number };

  // UI/UX helper fields (optional)
  helpText?: string; // short explanation to show in guided mode
  requiredFields?: string[]; // e.g., ['title'], ['title','outputs']
  isComplete?: boolean; // whether the user confirmed this node
}


export interface GroupBox {
  id: string;
  name?: string;
  color?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  stepIds: string[]; // steps contained
}

export interface Workflow {
  id: string;
  name: string;
  lastModified: number;
  steps: WorkflowStep[];
  groups?: GroupBox[];
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  automations?: Workflow[];
  companyId?: string;
}

export interface Company {
  id: string;
  name: string;
  locations?: Location[];
  professionals?: Professional[];
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  timezone?: string; // e.g., 'America/Sao_Paulo'
}

export interface Professional {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  services?: string[]; // service ids
  locationId?: string;
  // disponibilidade simples: array de janelas
  availability?: AvailabilityWindow[];
}

export interface Service {
  id: string;
  title: string;
  durationMinutes: number;
  priceCents?: number;
  locationId?: string;
}

export interface AvailabilityWindow {
  id?: string;
  professionalId?: string;
  locationId?: string;
  start: string; // ISO string
  end: string; // ISO string
  recurring?: boolean;
  timezone?: string;
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export interface Appointment {
  id: string;
  clientId?: string;
  professionalId?: string;
  serviceId?: string;
  locationId?: string;
  start: string; // ISO
  end: string; // ISO
  status?: AppointmentStatus;
  createdAt?: string;
  metadata?: Record<string, any>;
}
