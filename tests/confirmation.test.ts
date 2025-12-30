import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as CONF from '../server/confirmation';
import db from '../server/db';
import * as AR from '../services/actionRunner';
import * as ChatAction from '../server/chatAction';

vi.mock('../services/actionRunner');
vi.mock('../server/chatAction');

describe('confirmation flow', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // reset db pendingConfirmations
    if (!db.data) await db.read();
    db.data.pendingConfirmations = [];
    try { await db.write(); } catch (err) { const fs = await import('fs'); const path = await import('path'); const dbPath = path.join(process.cwd(), 'data', 'db.json'); fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2)); }
  });

  it('set/get/pop pending confirmation', async () => {
    const rec = await CONF.setPendingConfirmation('u1', { action: { type: 'RESPONDER', params: { text: 'Ok' } }, intent: { intentId: 'greeting' }, originalText: 'oi' });
    expect(rec.chatId).toBe('u1');
    const got = await CONF.getPendingConfirmation('u1');
    expect(got).not.toBeNull();
    const popped = await CONF.popPendingConfirmation('u1');
    expect(popped.chatId).toBe('u1');
    const after = await CONF.getPendingConfirmation('u1');
    expect(after).toBeNull();
  });

  it('confirmPending executes action and records audit', async () => {
    await CONF.setPendingConfirmation('u2', { action: { type: 'RESPONDER', params: { text: 'Confirmado' } }, intent: { intentId: 'price_query', score: 0.5 }, originalText: 'Quanto custa X?' });
    (AR.runAction as unknown as vi.Mock).mockResolvedValueOnce({ ok: true, text: 'Confirmado' });
    (ChatAction.recordChatAction as unknown as vi.Mock).mockResolvedValueOnce({ id: 'ca_1' });

    const res = await CONF.confirmPending('u2');
    expect(res).not.toBeNull();
    expect(res.ok).toBeTruthy();
    expect(AR.runAction).toHaveBeenCalled();
    expect(ChatAction.recordChatAction).toHaveBeenCalled();

    // ensure pending is cleared
    const after = await CONF.getPendingConfirmation('u2');
    expect(after).toBeNull();
  });

  it('clearPendingConfirmation removes pending without executing action', async () => {
    await CONF.setPendingConfirmation('u3', { action: { type: 'RESPONDER', params: { text: 'No' } }, intent: { intentId: 'price_query' }, originalText: 'Quanto custa Y?' });
    const pending = await CONF.getPendingConfirmation('u3');
    expect(pending).not.toBeNull();

    const cleared = await CONF.clearPendingConfirmation('u3');
    expect(cleared).toBeTruthy();
    const after = await CONF.getPendingConfirmation('u3');
    expect(after).toBeNull();
  });

  it('cleanupPendingExpired removes expired entries', async () => {
    const rec = await CONF.setPendingConfirmation('u4', { action: { type: 'RESPONDER', params: { text: 'Expired' } }, intent: { intentId: 'price_query' }, originalText: 'Old' }, 1);
    // simulate expiration by setting expiresAt in the past
    if (!db.data) await db.read();
    const p = db.data.pendingConfirmations.find(p => p.chatId === 'u4');
    p.expiresAt = Date.now() - 1000;
    try { await db.write(); } catch (err) { const fs = await import('fs'); const path = await import('path'); const dbPath = path.join(process.cwd(), 'data', 'db.json'); fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2)); }

    await CONF.cleanupPendingExpired();
    const after = await CONF.getPendingConfirmation('u4');
    expect(after).toBeNull();
  });
});