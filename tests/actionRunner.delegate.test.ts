import { describe, it, expect, beforeEach } from 'vitest';
import db from '../server/db.js';
import { addAgent } from '../server/agents.js';
import { runAction } from '../services/actionRunner.js';

describe('actionRunner DELEGAR', () => {
  beforeEach(async () => {
    if (!db.data) await db.read();
    db.data.agents = [];
    db.data.agentRotationIndex = 0;
    db.data.chatAssignments = {};
    try { await db.write(); } catch (e) { const fs = await import('fs'); const path = await import('path'); const dbPath = path.join(process.cwd(), 'data', 'db.json'); fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2)); }
  });

  it('delegates to next agent and assigns chat', async () => {
    await addAgent('a1', 'Alice');
    await addAgent('a2', 'Bob');
    const res = await runAction({ type: 'DELEGAR', params: { message: 'Entrando em contato...' } }, { chatId: 'chat1' });
    expect(res.ok).toBe(true);
    expect(res.type).toBe('DELEGAR');
    expect(res.raw.id).toBeDefined();
  });

  it('returns error when no agent available', async () => {
    const res = await runAction({ type: 'DELEGAR', params: {} }, { chatId: 'chat_no_agent' });
    expect(res.ok).toBe(false);
    expect(res.raw).toBe('no_agent_available');
  });
});