
export enum StepType {
  TRIGGER = 'TRIGGER',
  ACTION = 'ACTION',
  DATA = 'DATA',
  LOGIC = 'LOGIC',
  ERROR_HANDLER = 'ERROR_HANDLER'
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
    [key: string]: any;
  };
  position: { x: number; y: number };
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
