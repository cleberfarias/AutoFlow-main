import { cleanupPendingExpired } from './confirmation.js';

export async function runCleanupOnce(notifyFn) {
  const removed = await cleanupPendingExpired();
  if (!removed || removed.length === 0) return removed;
  try {
    const { recordChatAction } = await import('./chatAction.js');
    for (const r of removed) {
      try {
        await recordChatAction({ chatId: r.chatId, intentId: r.intent?.intentId || null, intentScore: r.intent?.score ?? null, actionType: 'expired', text: `Pending confirmation expired for action ${r.action?.type}`, timestamp: new Date().toISOString() });
      } catch (err) {
        console.error('Failed to record expired action:', err);
      }
      if (notifyFn && typeof notifyFn === 'function') {
        try {
          await notifyFn(r.chatId, 'Sua solicitação de confirmação expirou. Posso ajudar com outra coisa?');
        } catch (err) {
          console.error('Notifier failed for chat', r.chatId, err);
        }
      }
    }
  } catch (err) {
    console.error('runCleanupOnce error:', err);
  }
  return removed;
}

let _interval = null;

export function startPeriodicCleanup(intervalSeconds = 60, notifyFn) {
  runCleanupOnce(notifyFn).catch((e) => console.error('Initial cleanup error:', e));
  stopPeriodicCleanup();
  _interval = setInterval(() => {
    runCleanupOnce(notifyFn).catch((e) => console.error('Periodic cleanup error:', e));
  }, (intervalSeconds || 60) * 1000);
  return () => stopPeriodicCleanup();
}

export function stopPeriodicCleanup() {
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
}