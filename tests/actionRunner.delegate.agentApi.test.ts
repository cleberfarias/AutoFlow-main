import { describe, it, expect, beforeEach } from 'vitest';
import db from '../server/db.ts';
import { addAgent, getChatAssignment } from '../server/agents';
import { runAction } from '../services/actionRunner';
import request from 'supertest';
import app from '../connectors/whatsapp/server';

const API_KEY = process.env.ADMIN_API_KEY || 'dev-admin-key';

describe('agent accept/reject API', () => {
  beforeEach(async () => {
    if (!db.data) await db.read();
    db.data.agents = [];
    db.data.agentRotationIndex = 0;
    db.data.chatAssignments = {};
    db.data.forwards = [];
    try { await db.write(); } catch (e) { const fs = await import('fs'); const path = await import('path'); const dbPath = path.join(process.cwd(), 'data', 'db.json'); fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2)); }
  });

  it('creates forward notification on delegate and agent can accept', async () => {
    await addAgent('a1', 'Alice');
    const res = await runAction({ type: 'DELEGAR', params: { message: 'Please accept' } }, { chatId: 'chatX' });
    expect(res.ok).toBe(true);
    const { getForwards } = await import('../server/forward.ts');
    const fwdList = await getForwards('chatX');
    expect(fwdList.length).toBeGreaterThan(0);
    const acceptRes = await request(app).post('/api/agents/a1/accept').send({ chatId: 'chatX' });
    expect(acceptRes.status).toBe(200);
    const assignment = await getChatAssignment('chatX');
    expect(assignment.accepted).toBe(true);
  });

  it('rejects and reassigns to next agent', async () => {
    await addAgent('a1', 'Alice');
    await addAgent('a2', 'Bob');
    const res = await runAction({ type: 'DELEGAR', params: {} }, { chatId: 'chatY' });
    expect(res.ok).toBe(true);
    // a1 will reject
    const rej = await request(app).post('/api/agents/a1/reject').send({ chatId: 'chatY' });
    expect(rej.status).toBe(200);
    const body = rej.body;
    expect(body.reassignedTo).toBeDefined();
  });
});