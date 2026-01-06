import { Workflow, WorkflowStep } from '../../../types';
import { ChatGuruPatch, ChatGuruDialog, ChatGuruLayout, ChatGuruLink } from './types';

function slugifyTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

function makeDialogNode(step: WorkflowStep, existing = new Set<string>()) {
  const base = slugifyTitle(step.title || 'node');
  const idSuffix = (step.id || '').slice(-8);
  const suffix = (idSuffix && idSuffix.length > 0) ? idSuffix : Math.random().toString(36).slice(2,10);
  let candidate = `${base}_${suffix}`;
  // ensure uniqueness
  while (existing.has(candidate)) {
    candidate = `${base}_${Math.random().toString(36).slice(2,8)}`;
  }
  existing.add(candidate);
  return candidate;
}

export function exportWorkflowToChatGuru(botId: string, workflow: Workflow): ChatGuruPatch {
  const dialogs: ChatGuruDialog[] = [];
  const layout: ChatGuruLayout[] = [];
  const nodeMap: Record<string, string> = {}; // step.id -> dialog_node

  // first pass: create dialog_node names
  // first pass allocate unique dialog_node names
  const existingNodes = new Set<string>();
  for (const s of workflow.steps) {
    nodeMap[s.id] = makeDialogNode(s, existingNodes);
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
      // Namespace step params to avoid collisions with link context keys
      context: { autoflow: { ...(s.params || {}) } },
      actions
    };
    dialogs.push(dlg);

    layout.push({ dialog_node, left: Math.round(s.position?.x || 0), top: Math.round(s.position?.y || 0) });
  }

  // links: use nextSteps to infer edges. Validate that target steps exist in the workflow.
  const links: ChatGuruLink[] = [];
  for (const s of workflow.steps) {
    const src = nodeMap[s.id];
    for (const tId of s.nextSteps || []) {
      if (!nodeMap[tId]) {
        // Skip invalid links where target does not exist
        console.warn(`exportWorkflowToChatGuru: skipping link from ${s.id} to missing step ${tId}`);
        continue;
      }
      const tgt = nodeMap[tId];
      links.push({ source_node: src, target_node: tgt });
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
