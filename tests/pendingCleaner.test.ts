import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as CONF from '../server/confirmation';
import * as PC from '../server/pendingCleaner';
import * as ChatAction from '../server/chatAction';
import db from '../server/db';

vi.mock('../server/chatAction');

describe('pendingCleaner', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    if (!db.data) await db.read();
    db.data.pendingConfirmations = [];
    try { await db.write(); } catch (err) { const fs = await import('fs'); const path = await import('path'); const dbPath = path.join(process.cwd(), 'data', 'db.json'); fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2)); }
  });

  it('runCleanupOnce records expired and calls notifier', async () => {
    await CONF.setPendingConfirmation('u10', { action: { type: 'RESPONDER', params: { text: 'Expired' } }, intent: { intentId: 'price_query' }, originalText: 'Old' }, 1);
    // expire it
    if (!db.data) await db.read();
    const rec = db.data.pendingConfirmations.find(p => p.chatId === 'u10');
    rec.expiresAt = Date.now() - 1000;
    await db.write();

    const notifier = vi.fn();
    (ChatAction.recordChatAction as unknown as any).mockResolvedValueOnce({ id: 'ca_100' });

    const removed = await PC.runCleanupOnce(notifier);
    expect(removed.length).toBeGreaterThan(0);
    expect(notifier).toHaveBeenCalled();
    expect(ChatAction.recordChatAction).toHaveBeenCalled();
  });
});