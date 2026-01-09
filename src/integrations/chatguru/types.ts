export type ChatGuruAction = {
  type: string; // e.g., RESPONDER
  params?: Record<string, any>;
};

export type ChatGuruDialog = {
  temp_id: string;
  title: string;
  dialog_node: string; // unique stable id
  node_type: 'DIALOG' | string;
  conditions_list: string[];
  conditions_entry_contexts: string[];
  context: Record<string, any>;
  actions?: ChatGuruAction[];
};

export type ChatGuruLayout = { dialog_node: string; left: number; top: number };
export type ChatGuruLink = { source_node: string; target_node: string };

export type ChatGuruPatch = {
  version: number;
  bot_id: string;
  dialogs: ChatGuruDialog[];
  layout: ChatGuruLayout[];
  links: ChatGuruLink[];
};
