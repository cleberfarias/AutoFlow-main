import { it, expect } from 'vitest';
import { exportGenericPatch } from '../src/core/patch/genericV1';
import { compileToChatGuru } from '../src/adapters/chatguru/compile';
import { compileToChatIA } from '../src/adapters/chatia/compile';

const workflow: any = {
  id: 'w1',
  name: 'Fluxo Teste',
  lastModified: Date.now(),
  steps: [
    { id: 'n1', type: 'TRIGGER', title: 'Início', description: 'Olá', params: {}, position: { x: 100, y: 50 }, nextSteps: ['n2'] },
    { id: 'n2', type: 'ACTION', title: 'Responder', description: 'Olá! Tudo bem?', params: { text: 'Olá! Tudo bem?' }, position: { x: 420, y: 50 }, nextSteps: [] }
  ]
};

it('exportGenericPatch produces expected structure', () => {
  const patch = exportGenericPatch(workflow, { name: workflow.name, locale: 'pt-BR' });
  expect(patch.spec).toBe('autoflow.patch.v1');
  expect(patch.nodes.length).toBe(2);
  expect(patch.edges.length).toBe(1);
  expect(patch.nodes[0].ui.x).toBe(100);
  // IDs should be stable and prefixed
  expect(patch.nodes[0].id).toBe('n_n1');
  expect(patch.nodes[1].id).toBe('n_n2');
  expect(patch.edges[0].from).toBe('n_n1');
  expect(patch.edges[0].to).toBe('n_n2');
});

it('compileToChatGuru maps nodes and links correctly', () => {
  const generic = exportGenericPatch(workflow, { name: workflow.name, locale: 'pt-BR' });
  const patch = compileToChatGuru(generic, 'bot_test');
  expect(patch.version).toBe(1);
  expect(patch.bot_id).toBe('bot_test');
  expect(patch.dialogs.length).toBe(2);
  expect(patch.links.length).toBe(1);
  expect(patch.layout.find(l => l.dialog_node === patch.dialogs[0].dialog_node)).toBeTruthy();
});

it('compileToChatIA produces automation doc', () => {
  const generic = exportGenericPatch(workflow, { name: workflow.name, locale: 'pt-BR' });
  const doc = compileToChatIA(generic);
  expect(doc.engine).toBe('autoflow.patch.v1');
  expect(doc.definition.spec).toBe('autoflow.patch.v1');
  expect(doc.name).toBe('Fluxo Teste');
});
