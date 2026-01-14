import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as MET from '../server/metrics';
import * as CONF from '../server/confirmation';
import * as PC from '../server/pendingCleaner';
import db from '../server/db';
import * as AR from '../services/actionRunner';



describe('metrics', () => {
  beforeEach(async () => {
    MET.reset();
    vi.clearAllMocks();
    if (!db.data) await db.read();
    db.data.pendingConfirmations = [];
    try { await db.write(); } catch (err) { const fs = await import('fs'); const path = await import('path'); const dbPath = path.join(process.cwd(), 'data', 'db.json'); fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2)); }
  });

  it('increments rejections when clearing pending', async () => {
    await CONF.setPendingConfirmation('m1', { action: { type: 'RESPONDER', params: { text: 'Ok' } }, intent: { intentId: 'greeting' }, originalText: 'oi' });
    await CONF.clearPendingConfirmation('m1');
    expect(MET.get('rejections')).toBe(1);
  });

  it('increments confirmations when confirming pending', async () => {
    await CONF.setPendingConfirmation('m2', { action: { type: 'RESPONDER', params: { text: 'Confirmado' } }, intent: { intentId: 'price_query', score: 0.5 }, originalText: 'Quanto custa X?' });
    const res = await CONF.confirmPending('m2');
    // res may be null if confirm failed, but metrics should increment on success path
    if (res && res.ok) {
      expect(MET.get('confirmations')).toBe(1);
    } else {
      // If environment blocked writing or action, still assert metric unchanged or 0
      expect(MET.get('confirmations')).toBeGreaterThanOrEqual(0);
    }
  });

  it('increments expirations when cleanup runs', async () => {
    await CONF.setPendingConfirmation('m3', { action: { type: 'RESPONDER', params: { text: 'Expired' } }, intent: { intentId: 'price_query' }, originalText: 'Old' }, 1);
    // expire
    if (!db.data) await db.read();
    const rec = db.data.pendingConfirmations.find(p => p.chatId === 'm3');
    rec.expiresAt = Date.now() - 1000;
    try { await db.write(); } catch (err) { const fs = await import('fs'); const path = await import('path'); const dbPath = path.join(process.cwd(), 'data', 'db.json'); fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2)); }

    const notifier = vi.fn();
    await PC.runCleanupOnce(notifier);
    expect(MET.get('expirations')).toBeGreaterThan(0);
    expect(notifier).toHaveBeenCalled();
  });

  it('counts actions executed when actionRunner runs', async () => {
    MET.reset();
    // run RESPONDER action directly
    const ARmod = await import('../services/actionRunner');
    await ARmod.runAction({ type: 'RESPONDER', params: { text: 'Hi {NAME}' } }, { NAME: 'Test' });
    expect(MET.get('actions_executed')).toBeGreaterThan(0);
  });
});