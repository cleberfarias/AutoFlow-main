let request;
try {
  request = (await import('supertest')).default;
} catch (err) {
  console.warn('supertest not available; admin API tests will be skipped');
}
// Ensure WhatsApp client doesn't try to initialize during tests
process.env.SKIP_WHATSAPP = '1';
import app from '../connectors/whatsapp/server';
import { describe, it, expect, beforeEach } from 'vitest';
import db from '../server/db';

const API_KEY = process.env.ADMIN_API_KEY || 'dev-admin-key';

const describeOrSkip = request ? describe : describe.skip;

describeOrSkip('admin API endpoints', () => {
  beforeEach(async () => {
    if (!db.data) await db.read();
    db.data.chatTags = {};
    db.data.funnels = {};
    db.data.chats = {};
    try { await db.write(); } catch (err) { const fs = await import('fs'); const path = await import('path'); const dbPath = path.join(process.cwd(), 'data', 'db.json'); fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2)); }
  });

  it('manages tags via API', async () => {
    const chatId = 'api_chat_1';
    const r1 = await request(app).post(`/api/admin/tags/${chatId}`).set('x-api-key', API_KEY).send({ tag: 'vip' });
    expect(r1.status).toBe(200);
    expect(r1.body.tags).toContain('vip');

    const r2 = await request(app).get(`/api/admin/tags/${chatId}`).set('x-api-key', API_KEY);
    expect(r2.status).toBe(200);
    expect(r2.body.tags).toContain('vip');

    const r3 = await request(app).delete(`/api/admin/tags/${chatId}/vip`).set('x-api-key', API_KEY);
    expect(r3.status).toBe(200);
    expect(r3.body.ok).toBeTruthy();
  });

  it('creates funnel and steps via API and sets chat funnel', async () => {
    const r1 = await request(app).post('/api/admin/funnels').set('x-api-key', API_KEY).send({ id: 'sales', name: 'Sales' });
    expect(r1.status).toBe(200);
    expect(r1.body.id).toBe('sales');

    const r2 = await request(app).post('/api/admin/funnels/sales/steps').set('x-api-key', API_KEY).send({ stepId: 'lead', name: 'Lead' });
    expect(r2.status).toBe(200);
    expect(r2.body.id).toBe('lead');

    const r3 = await request(app).post('/api/admin/chats/chat_api_1/funnel').set('x-api-key', API_KEY).send({ funnelId: 'sales', stepId: 'lead' });
    expect(r3.status).toBe(200);
    expect(r3.body.funnelId).toBe('sales');
  });

  it('sets and gets status via API', async () => {
    const r1 = await request(app).post('/api/admin/chats/chat_api_2/status').set('x-api-key', API_KEY).send({ status: 'waiting' });
    expect(r1.status).toBe(200);
    expect(r1.body.status).toBe('waiting');

    const r2 = await request(app).get('/api/admin/chats/chat_api_2/status').set('x-api-key', API_KEY);
    expect(r2.status).toBe(200);
    expect(r2.body.status).toBe('waiting');
  });

  it('rejects without API key', async () => {
    const r = await request(app).get('/api/admin/tags/some');
    expect(r.status).toBe(401);
  });
});