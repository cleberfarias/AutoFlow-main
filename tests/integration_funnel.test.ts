import { describe, it, expect, beforeEach } from 'vitest';
import { handleMessage } from '../services/intentHandler';
import { runAction } from '../services/actionRunner';
import * as F from '../server/funnels';
import db from '../server/db';

describe('integration: intent -> FUNIL action', () => {
  beforeEach(async () => {
    process.env.INTENT_CONFIDENCE_THRESHOLD = '0.1'; // low threshold to accept intent
    if (!db.data) await db.read();
    db.data.chats = {};
    try { await db.write(); } catch (err) { const fs = await import('fs'); const path = await import('path'); const dbPath = path.join(process.cwd(), 'data', 'db.json'); fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2)); }
  });

  it('moves chat to sales funnel when message matches move_to_sales intent', async () => {
    // ensure funnel exists
    await F.createFunnel('sales', 'Sales Funnel');
    await F.addFunnelStep('sales', 'lead', 'Lead');

    const res = await handleMessage('mover para vendas', { chatId: 'chat_integration_1' });
    expect(res.intent).toBeDefined();
    expect(res.action).not.toBeNull();
    expect(res.action?.type).toBe('FUNIL');

    const run = await runAction(res.action as any, { chatId: 'chat_integration_1' });
    expect(run.ok).toBeTruthy();

    const chat = await F.getChatFunnel('chat_integration_1');
    expect(chat).not.toBeNull();
    expect(chat.funnelId).toBe('sales');
    expect(chat.funnelStepId).toBe('lead');
  });
});