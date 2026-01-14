import { describe, it, expect, beforeEach } from 'vitest';
import db from '../server/db.ts';
import { addAgent, listAgents, removeAgent, getNextAgent, setAgentAvailability, assignChat, getChatAssignment, clearChatAssignment } from '../server/agents';

describe('agents store', () => {
  beforeEach(async () => {
    if (!db.data) await db.read();
    db.data.agents = [];
    db.data.agentRotationIndex = 0;
    db.data.chatAssignments = {};
    try { await db.write(); } catch (e) { const fs = await import('fs'); const path = await import('path'); const dbPath = path.join(process.cwd(), 'data', 'db.json'); fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2)); }
  });

  it('adds and lists agents', async () => {
    await addAgent('a1', 'Alice');
    await addAgent('a2', 'Bob');
    const agents = await listAgents();
    expect(agents.map(a => a.id)).toContain('a1');
    expect(agents.map(a => a.id)).toContain('a2');
  });

  it('removes agent', async () => {
    await addAgent('a1', 'Alice');
    const ok = await removeAgent('a1');
    expect(ok).toBe(true);
    const agents = await listAgents();
    expect(agents.map(a => a.id)).not.toContain('a1');
  });

  it('rotates agents round-robin', async () => {
    await addAgent('a1', 'Alice');
    await addAgent('a2', 'Bob');
    const first = await getNextAgent();
    const second = await getNextAgent();
    const third = await getNextAgent();
    expect([first.id, second.id, third.id]).toEqual([first.id, second.id, first.id]);
  });

  it('respects availability', async () => {
    await addAgent('a1', 'Alice');
    await addAgent('a2', 'Bob');
    await setAgentAvailability('a1', false);
    const a = await getNextAgent();
    expect(a.id).toBe('a2');
  });

  it('assigns and clears chat', async () => {
    await addAgent('a1', 'Alice');
    await assignChat('chat1', 'a1');
    const asg = await getChatAssignment('chat1');
    expect(asg.agentId).toBe('a1');
    const cleared = await clearChatAssignment('chat1');
    expect(cleared).toBe(true);
    expect(await getChatAssignment('chat1')).toBeNull();
  });
});