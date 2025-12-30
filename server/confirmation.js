import db from './db.js';
import fs from 'fs';
import path from 'path';

const DEFAULT_TTL = parseInt(process.env.PENDING_CONFIRMATION_TTL_SECONDS || '3600', 10);

function nowMs() {
  return Date.now();
}

async function cleanupPendingExpired() {
  if (!db.data) await db.read();
  if (!db.data.pendingConfirmations) return [];
  const now = nowMs();
  const removed = db.data.pendingConfirmations.filter(p => p.expiresAt && p.expiresAt <= now);
  db.data.pendingConfirmations = db.data.pendingConfirmations.filter(p => !p.expiresAt || p.expiresAt > now);
  if (removed.length > 0) {
    try {
      await db.write();
    } catch (err) {
      try {
        const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'db.json');
        fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2));
      } catch (err2) {
        console.error('Fallback write in cleanup failed:', err2);
      }
    }
    // metrics: count expirations
    try {
      const { increment } = await import('./metrics.js');
      increment('expirations', removed.length);
    } catch (e) {}
  }
  return removed;
}

export async function setPendingConfirmation(chatId, entry, ttlSeconds = DEFAULT_TTL) {
  // entry: { action, intent, originalText, timestamp }
  if (!db.data) await db.read();
  if (!db.data.pendingConfirmations) db.data.pendingConfirmations = [];
  // cleanup expired before setting
  await cleanupPendingExpired();
  // replace existing for chatId
  db.data.pendingConfirmations = db.data.pendingConfirmations.filter(p => p.chatId !== chatId);
  const createdAt = nowMs();
  const record = { id: `pc_${createdAt}_${Math.floor(Math.random() * 9999)}`, chatId, createdAt, expiresAt: createdAt + ttlSeconds * 1000, ...entry };
  db.data.pendingConfirmations.push(record);
  try {
    await db.write();
  } catch (err) {
    try {
      const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'db.json');
      fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2));
    } catch (err2) {
      console.error('Fallback write failed in setPendingConfirmation:', err2);
    }
  }
  return record;
}

export async function getPendingConfirmation(chatId) {
  if (!db.data) await db.read();
  if (!db.data.pendingConfirmations) return null;
  await cleanupPendingExpired();
  return db.data.pendingConfirmations.find(p => p.chatId === chatId) || null;
}

export async function popPendingConfirmation(chatId) {
  if (!db.data) await db.read();
  if (!db.data.pendingConfirmations) return null;
  await cleanupPendingExpired();
  const idx = db.data.pendingConfirmations.findIndex(p => p.chatId === chatId);
  if (idx === -1) return null;
  const [entry] = db.data.pendingConfirmations.splice(idx, 1);
  try {
    await db.write();
  } catch (err) {
    try {
      const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'db.json');
      fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2));
    } catch (err2) {
      console.error('Fallback write failed:', err2);
    }
  }
  return entry;
}

export async function clearPendingConfirmation(chatId) {
  if (!db.data) await db.read();
  if (!db.data.pendingConfirmations) return null;
  const before = db.data.pendingConfirmations.length;
  db.data.pendingConfirmations = db.data.pendingConfirmations.filter(p => p.chatId !== chatId);
  if (db.data.pendingConfirmations.length !== before) {
    try {
      await db.write();
    } catch (err) {
      try {
        const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'db.json');
        fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2));
      } catch (err2) {
        console.error('Fallback write failed in clearPendingConfirmation:', err2);
      }
    }
    // metrics: rejection
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