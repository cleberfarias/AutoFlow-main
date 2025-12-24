
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

export interface Workflow {
  id: string;
  name: string;
  lastModified: number;
  steps: WorkflowStep[];
}

export interface Client {
  id: string;
  name: string;
  email: string;
  automations: Workflow[];
}
