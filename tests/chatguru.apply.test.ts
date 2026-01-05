import request from 'supertest';
import app from '../connectors/whatsapp/server.js';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ChatGuru apply forwarding', () => {
  beforeEach(() => {
    // ensure no base url by default
    delete process.env.CHATGURU_BASE_URL;
    delete process.env.CHATGURU_API_KEY;
  });

  it('returns applied true when no ChatGuru configured (stub)', async () => {
    const patch = { version:1, bot_id:'b1', dialogs:[], layout:[], links:[] };
    const res = await request(app).post('/api/autoflow/apply').send({ bot_id: 'b1', patch, mode: 'draft' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBeTruthy();
    expect(res.body.applied).toBeTruthy();
  });

  it('forwards transformed patch to ChatGuru when configured', async () => {
    process.env.CHATGURU_BASE_URL = 'http://chatguru.test';
    process.env.CHATGURU_API_KEY = 'secret';

    // fake global.fetch to capture request
    const calls: any[] = [];
    const originalFetch = global.fetch;
    global.fetch = async (url, opts) => {
      calls.push({ url, opts });
      return { ok: true, json: async () => ({ forwarded: true }) };
    };

    const patch = {
      version: 1,
      bot_id: 'b1',
      dialogs: [
        { temp_id: 's1', title: 'Início', dialog_node: 'inicio_a1', node_type: 'DIALOG', conditions_list: [], conditions_entry_contexts: [], context: {}, actions: [] },
        { temp_id: 's2', title: 'Opção 1', dialog_node: 'opcao_1_b2', node_type: 'DIALOG', conditions_list: [], conditions_entry_contexts: [], context: {}, actions: [] }
      ],
      layout: [{ dialog_node: 'inicio_a1', left: 100, top: 50 }, { dialog_node: 'opcao_1_b2', left: 300, top: 50 }],
      links: [{ source_node: 'inicio_a1', target_node: 'opcao_1_b2' }]
    };

    try {
      const res = await request(app).post('/api/autoflow/apply').send({ bot_id: 'b1', patch, mode: 'draft' });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBeTruthy();
      expect(res.body.forwarded).toBeTruthy();
      expect(calls.length).toBe(1);

      const body = JSON.parse(calls[0].opts.body);
      // ensure forwarded body.patch was transformed
      const transformed = body.patch;
      const src = transformed.dialogs.find(d => d.dialog_node === 'inicio_a1');
      const tgt = transformed.dialogs.find(d => d.dialog_node === 'opcao_1_b2');
      expect(src.context['inicio_a1__opcao_1_b2']).toBeTruthy();
      expect(tgt.conditions_entry_contexts).toContain('$inicio_a1__opcao_1_b2==True');
    } finally {
      // restore fetch
      global.fetch = originalFetch;
    }
  });
});
