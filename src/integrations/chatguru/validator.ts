import { ChatGuruPatch } from './types';

export function validateChatGuruPatch(patch: ChatGuruPatch): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const nodes = new Set(patch.dialogs.map(d => d.dialog_node));
  if (nodes.size !== patch.dialogs.length) errors.push('dialog_node values must be unique');
  for (const d of patch.dialogs) {
    if (!d.dialog_node || !d.dialog_node.trim()) errors.push(`dialog missing dialog_node: temp_id=${d.temp_id}`);
    if (!d.title || !d.title.trim()) errors.push(`dialog missing title: ${d.dialog_node}`);
    (d.actions || []).forEach((a, i) => {
      if (a.type === 'RESPONDER' && (!a.params || !String(a.params.text || '').trim())) {
        errors.push(`dialog ${d.dialog_node} action[${i}] RESPONDER with empty text`);
      }
    });
  }

  for (const l of patch.links || []) {
    if (!nodes.has(l.source_node)) errors.push(`link source_node not found: ${l.source_node}`);
    if (!nodes.has(l.target_node)) errors.push(`link target_node not found: ${l.target_node}`);
    if (l.source_node === l.target_node) errors.push(`link cannot point to self: ${l.source_node}`);
  }

  return { valid: errors.length === 0, errors };
}
