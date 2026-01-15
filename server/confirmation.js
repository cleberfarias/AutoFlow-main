import { createConfirmation, getConfirmation, resolveConfirmation, cleanupExpired as cleanupRuntimeExpired } from './runtime/confirmationStore';
import db from './db.js';

const DEFAULT_TTL = parseInt(process.env.PENDING_CONFIRMATION_TTL_SECONDS || '3600', 10);

function nowMs() { return Date.now(); }

async function cleanupPendingExpired() {
  // cleanup runtime store first
  const removedCount = cleanupRuntimeExpired();
  // also mirror cleanup into db.json for tests/backward compatibility
  try {
    const dbModule = await import('./db.js');
    if (!dbModule.default.data) await dbModule.default.read();
    if (Array.isArray(dbModule.default.data.pendingConfirmations)) {
      const now = nowMs();
      const expired = dbModule.default.data.pendingConfirmations.filter(p => p.expiresAt && p.expiresAt <= now);
      if (expired && expired.length > 0) {
        dbModule.default.data.pendingConfirmations = dbModule.default.data.pendingConfirmations.filter(p => !(p.expiresAt && p.expiresAt <= now));
        try { await dbModule.default.write(); } catch (e) {}
      }
    }
  } catch (e) {}
  return removedCount;
}

function mapToLegacy(pc) {
  if (!pc) return null;
  // legacy shape: { id, chatId, createdAt: ISO, expiresAt:number, action, intent, originalText }
  const legacy = {
    id: pc.id,
    chatId: pc.chatId,
    createdAt: new Date(pc.createdAt).toISOString(),
    expiresAt: pc.expiresAt,
    action: pc.proposedAction && pc.proposedAction.payload ? pc.proposedAction.payload : (pc.proposedAction && pc.proposedAction.type === 'ACTION' ? pc.proposedAction.payload : pc.proposedAction),
    intent: pc.meta && pc.meta.intent ? pc.meta.intent : null,
    originalText: pc.meta && pc.meta.originalText ? pc.meta.originalText : null
  };
  return legacy;
}

export async function setPendingConfirmation(chatId, entry, ttlSeconds = DEFAULT_TTL) {
  await cleanupPendingExpired();
  const createdAt = nowMs();
  const rec = {
    tenantId: entry.tenantId || 't1',
    chatId,
    channel: entry.channel || 'test',
    expiresAt: createdAt + ttlSeconds * 1000,
    promptText: entry.originalText || (entry.promptText || ''),
    proposedAction: { type: 'ACTION', payload: entry.action || {} },
    meta: { intent: entry.intent || null, originalText: entry.originalText || null }
  };
  const inserted = createConfirmation(rec);
  console.debug('[CONF] inserted runtime confirmation:', inserted && inserted.chatId, inserted && inserted.id);
  // also sync to db.json for tests that mutate/read it directly
  try {
    if (!db.data) await db.read();
    if (!db.data.pendingConfirmations) db.data.pendingConfirmations = [];
    const arr = db.data.pendingConfirmations;
    for (let i = arr.length - 1; i >= 0; i--) { if (arr[i].chatId === chatId) arr.splice(i, 1); }
    const pushed = { id: inserted.id, chatId: inserted.chatId, createdAt: new Date(inserted.createdAt).toISOString(), expiresAt: inserted.expiresAt, action: entry.action || {}, intent: entry.intent || null, originalText: entry.originalText || null };
    arr.push(pushed);
    console.debug('[CONF] pushed to db.json pendingConfirmations:', pushed.chatId);
    try { await db.write(); } catch (e) {}
  } catch (e) {}
  return mapToLegacy(inserted);
}

export async function getPendingConfirmation(chatId) {
  await cleanupPendingExpired();
  const pc = getConfirmation('t1', chatId);
  return mapToLegacy(pc);
}

export async function popPendingConfirmation(chatId) {
  await cleanupPendingExpired();
  const pc = getConfirmation('t1', chatId);
  if (!pc) return null;
  // remove
  resolveConfirmation('t1', chatId);
  // sync in-memory db.json
  try {
    if (!db.data) await db.read();
    if (db.data && Array.isArray(db.data.pendingConfirmations)) {
      const arr = db.data.pendingConfirmations;
      for (let i = arr.length - 1; i >= 0; i--) { if (arr[i].chatId === chatId) arr.splice(i, 1); }
      try { await db.write(); } catch (e) {}
    }
  } catch (e) {}
  return mapToLegacy(pc);
}

export async function clearPendingConfirmation(chatId) {
  resolveConfirmation('t1', chatId);
  try {
    if (!db.data) await db.read();
    if (db.data && Array.isArray(db.data.pendingConfirmations)) {
      const arr = db.data.pendingConfirmations;
      const before = arr.length;
      for (let i = arr.length - 1; i >= 0; i--) { if (arr[i].chatId === chatId) arr.splice(i, 1); }
      if (arr.length !== before) {
        try { await db.write(); } catch (e) {}
      }
    }
  } catch (e) {}
  try {
    const { increment } = await import('./metrics.js');
    increment('rejections', 1);
  } catch (e) {}
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