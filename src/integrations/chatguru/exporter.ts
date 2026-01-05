import { Workflow, WorkflowStep } from '../../../types';
import { ChatGuruPatch, ChatGuruDialog, ChatGuruLayout, ChatGuruLink } from './types';

function slugifyTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

function makeDialogNode(step: WorkflowStep) {
  const base = slugifyTitle(step.title || 'node');
  const suffix = (step.id || '').slice(-4) || Math.random().toString(36).slice(2,6);
  return `${base}_${suffix}`;
}

export function exportWorkflowToChatGuru(botId: string, workflow: Workflow): ChatGuruPatch {
  const dialogs: ChatGuruDialog[] = [];
  const layout: ChatGuruLayout[] = [];
  const nodeMap: Record<string, string> = {}; // step.id -> dialog_node

  // first pass: create dialog_node names
  for (const s of workflow.steps) {
    nodeMap[s.id] = makeDialogNode(s);
  }

  for (const s of workflow.steps) {
    const dialog_node = nodeMap[s.id];
    const title = s.title || 'Untitled';
    const actions = [] as any[];
    const text = s.description || '';
    if (text && text.trim()) {
      actions.push({ type: 'RESPONDER', params: { text } });
    }

    const dlg: ChatGuruDialog = {
      temp_id: s.id,
      title,
      dialog_node,
      node_type: 'DIALOG',
      conditions_list: [],
      conditions_entry_contexts: [],
      context: { ...s.params },
      actions
    };
    dialogs.push(dlg);

    layout.push({ dialog_node, left: Math.round(s.position?.x || 0), top: Math.round(s.position?.y || 0) });
  }

  // links: use nextSteps to infer edges
  const links: ChatGuruLink[] = [];
  for (const s of workflow.steps) {
    const src = nodeMap[s.id];
    for (const tId of s.nextSteps || []) {
      const tgt = nodeMap[tId];
      if (src && tgt) links.push({ source_node: src, target_node: tgt });
    }
  }

  return {
    version: 1,
    bot_id: botId || '',
    dialogs,
    layout,
    links
  } as ChatGuruPatch;
}
