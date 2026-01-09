import { getPendingByChatId, insertPending, popPendingByChatId, deletePendingByChatId, removeExpired } from './pendingPrisma.js';

const DEFAULT_TTL = parseInt(process.env.PENDING_CONFIRMATION_TTL_SECONDS || '3600', 10);

function nowMs() { return Date.now(); }

async function cleanupPendingExpired() {
  const now = nowMs();
  let removed = await removeExpired(now) || [];
  // also check in-memory db.json pendingConfirmations (tests sometimes mutate it directly)
  try {
    const dbModule = await import('./db.js');
    if (!dbModule.default.data) await dbModule.default.read();
    if (Array.isArray(dbModule.default.data.pendingConfirmations)) {
      const expired = dbModule.default.data.pendingConfirmations.filter(p => p.expiresAt && p.expiresAt <= now);
      if (expired && expired.length > 0) {
        // remove from in-memory and attempt to remove from prisma too
        dbModule.default.data.pendingConfirmations = dbModule.default.data.pendingConfirmations.filter(p => !(p.expiresAt && p.expiresAt <= now));
        try { await dbModule.default.write(); } catch (e) {}
        // try to delete by chatId from prisma for each
        for (const e of expired) {
          try { await deletePendingByChatId(e.chatId); } catch (err) {}
        }
        removed = removed.concat(expired.map(r => ({ id: r.id, chatId: r.chatId, action: r.action, intent: r.intent, originalText: r.originalText, expiresAt: r.expiresAt, createdAt: r.createdAt })));
      }
    }
  } catch (e) {}

  if (removed && removed.length > 0) {
    try {
      const { increment } = await import('./metrics.js');
      increment('expirations', removed.length);
    } catch (e) {}
  }
  return removed;
}

export async function setPendingConfirmation(chatId, entry, ttlSeconds = DEFAULT_TTL) {
  // entry: { action, intent, originalText, timestamp }
  await cleanupPendingExpired();
  // remove existing from store
  await deletePendingByChatId(chatId);
  const createdAt = nowMs();
  const record = { id: `pc_${createdAt}_${Math.floor(Math.random() * 9999)}`, chatId, createdAt: new Date(createdAt).toISOString(), expiresAt: createdAt + ttlSeconds * 1000, ...entry };
  const inserted = await insertPending(record);
  // keep in-memory db.data in sync for backward compatibility
  try {
    const dbModule = await import('./db.js');
    if (!dbModule.default.data) await dbModule.default.read();
    if (!dbModule.default.data.pendingConfirmations) dbModule.default.data.pendingConfirmations = [];
    // remove any existing for chatId and push
    dbModule.default.data.pendingConfirmations = dbModule.default.data.pendingConfirmations.filter(p => p.chatId !== chatId);
    dbModule.default.data.pendingConfirmations.push(inserted);
    try { await dbModule.default.write(); } catch (e) {}
  } catch (e) {}
  return inserted;
}

export async function getPendingConfirmation(chatId) {
  await cleanupPendingExpired();
  return getPendingByChatId(chatId);
}

export async function popPendingConfirmation(chatId) {
  await cleanupPendingExpired();
  const p = await popPendingByChatId(chatId);
  // sync in-memory
  try {
    const dbModule = await import('./db.js');
    if (!dbModule.default.data) await dbModule.default.read();
    if (dbModule.default.data && Array.isArray(dbModule.default.data.pendingConfirmations)) {
      dbModule.default.data.pendingConfirmations = dbModule.default.data.pendingConfirmations.filter(x => x.chatId !== chatId);
      try { await dbModule.default.write(); } catch (e) {}
    }
  } catch (e) {}
  return p;
}

export async function clearPendingConfirmation(chatId) {
  const deleted = await deletePendingByChatId(chatId);
  // sync in-memory
  try {
    const dbModule = await import('./db.js');
    if (!dbModule.default.data) await dbModule.default.read();
    if (dbModule.default.data && Array.isArray(dbModule.default.data.pendingConfirmations)) {
      const before = dbModule.default.data.pendingConfirmations.length;
      dbModule.default.data.pendingConfirmations = dbModule.default.data.pendingConfirmations.filter(p => p.chatId !== chatId);
      if (dbModule.default.data.pendingConfirmations.length !== before) {
        try { await dbModule.default.write(); } catch (e) {}
      }
    }
  } catch (e) {}

  if (deleted && deleted.length > 0) {
    try {
      const { increment } = await import('./metrics.js');
      increment('rejections', 1);
    } catch (e) {}
  }
  return true;
}

export async function confirmPending(chatId, extraContext = {}) {
  const entry = await popPendingConfirmation(chatId);
  if (!entry) return null;
  try {
    const { runAction } = await import('../services/actionRunner');
    const { recordChatAction } = await import('./chatAction');
    const ctx = { ...extraContext, chatId, intentId: entry.intent?.intentId, intentScore: entry.intent?.score, MSG_TEXT: entry.originalText };
    const res = await runAction(entry.action, ctx);
        try {
        await recordChatAction({ chatId, intentId: entry.intent?.intentId || null, intentScore: entry.intent?.score ?? null, actionType: entry.action?.type || null, text: res.text || null, timestamp: new Date().toISOString() });
      } catch (err) {
        console.error('recordChatAction failed:', err);
      }
      // metrics: confirmation executed
      try {
        const { increment } = await import('./metrics.js');
        increment('confirmations', 1);
      } catch (e) {}
      return res;
  } catch (err) {
    console.error('confirmPending error:', err);
    return { ok: false, error: err.message || String(err) };
  }
}

export { cleanupPendingExpired };