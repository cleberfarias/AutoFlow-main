import { describe, it, expect } from 'vitest';
import { exportWorkflowToChatGuru } from '../src/integrations/chatguru/exporter';
import { validateChatGuruPatch } from '../src/integrations/chatguru/validator';

describe('ChatGuru exporter and validator', () => {
  it('exports workflow nodes, layout and links correctly and generates stable dialog_node', () => {
    const workflow: any = {
      id: 'w1',
      name: 'My Flow',
      lastModified: Date.now(),
      steps: [
        { id: 'step1', title: 'Início', description: 'Olá', params: {}, position: { x: 100, y: 50 }, nextSteps: ['step2'] },
        { id: 'step2', title: 'Opção 1', description: 'Resposta', params: {}, position: { x: 300, y: 50 }, nextSteps: [] }
      ]
    };

    const patch = exportWorkflowToChatGuru('bot1', workflow);
    expect(patch.version).toBe(1);
    expect(patch.bot_id).toBe('bot1');
    expect(Array.isArray(patch.dialogs)).toBe(true);
    expect(patch.dialogs.length).toBe(2);
    expect(patch.layout.length).toBe(2);
    expect(patch.links.length).toBe(1);

    // check dialog_node stable format: slug + suffix (suffix up to 8 chars)
    const dlg1 = patch.dialogs.find((d:any) => d.temp_id === 'step1');
    expect(dlg1.dialog_node).toMatch(/^[a-z0-9_]+_[a-z0-9]{1,8}$/);

    // exporter must namespace params in context under 'autoflow' and NOT add link-derived context/conditions
    expect(dlg1.context).toBeDefined();
    expect(dlg1.context.autoflow).toBeDefined();
    // ensure not adding source__target keys in exporter context
    expect(Object.keys(dlg1.context.autoflow).some(k => k.includes('__'))).toBe(false);
    const tgt = patch.dialogs.find((d:any) => d.temp_id === 'step2');
    expect(tgt.conditions_entry_contexts && tgt.conditions_entry_contexts.length).toBe(0);

    // validator should accept the generated patch
    const v = validateChatGuruPatch(patch);
    expect(v.valid).toBe(true);
    expect(v.errors.length).toBe(0);
  });

  it('validator rejects duplicate dialog_node and empty responder text and invalid links', () => {
    const badPatch: any = {
      version: 1,
      bot_id: 'b1',
      dialogs: [
        { temp_id: 'a', title: 'A', dialog_node: 'node_1', node_type: 'DIALOG', conditions_list: [], conditions_entry_contexts: [], context: {}, actions: [{ type: 'RESPONDER', params: { text: '' } }] },
        { temp_id: 'b', title: '', dialog_node: 'node_1', node_type: 'DIALOG', conditions_list: [], conditions_entry_contexts: [], context: {}, actions: [] }
      ],
      layout: [],
      links: [{ source_node: 'node_1', target_node: 'missing_node' }]
    };

    const v = validateChatGuruPatch(badPatch);
    expect(v.valid).toBe(false);
    expect(v.errors.length).toBeGreaterThan(0);
    expect(v.errors.some(e => e.includes('dialog_node values must be unique'))).toBe(true);
    expect(v.errors.some(e => e.includes('with empty text'))).toBe(true);
    expect(v.errors.some(e => e.includes('missing title'))).toBe(true);
    expect(v.errors.some(e => e.includes('link source_node not found') || e.includes('link target_node not found'))).toBe(true);
  });
});
