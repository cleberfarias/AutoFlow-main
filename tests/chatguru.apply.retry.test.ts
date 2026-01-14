import request from 'supertest';
import app from '../connectors/whatsapp/server';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ChatGuru apply forwarding retries', () => {
  beforeEach(() => {
    process.env.CHATGURU_BASE_URL = 'http://chatguru.test';
    process.env.CHATGURU_API_KEY = 'secret';
    process.env.CHATGURU_MAX_RETRIES = '3';
    process.env.CHATGURU_RETRY_BASE_MS = '10';
  });

  it('retries when endpoint initially fails and succeeds later', async () => {
    const calls: any[] = [];
    const originalFetch = global.fetch;
    let attempt = 0;
    global.fetch = async (url, opts) => {
      attempt++;
      calls.push({ url, opts });
      if (attempt < 2) {
        return { ok: false, status: 500, text: async () => 'server error' } as any;
      }
      return { ok: true, status: 200, text: async () => JSON.stringify({ forwarded: true }), json: async () => ({ forwarded: true }) } as any;
    };

    try {
      const patch = { version:1, bot_id:'b1', dialogs:[], layout:[], links:[] };
      const res = await request(app).post('/api/autoflow/apply').send({ bot_id: 'b1', patch, mode: 'draft' });
      expect(res.status).toBe(200);
      expect(res.body.forwarded).toBeTruthy();
      expect(calls.length).toBeGreaterThanOrEqual(2);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
