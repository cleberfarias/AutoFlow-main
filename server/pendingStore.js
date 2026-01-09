import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace('file:','') : path.join(process.cwd(), 'dev.db');
if (!fs.existsSync(dbPath)) {
  console.warn('pendingStore: sqlite db not found at', dbPath);
}
const db = new Database(dbPath, { readonly: false });

export function getAllPendings() {
  const rows = db.prepare('SELECT id, chatId, action, intent, originalText, expiresAt, createdAt FROM PendingConfirmation ORDER BY createdAt ASC').all();
  return rows.map(r => ({
    id: r.id,
    chatId: r.chatId,
    action: safeParse(r.action),
    intent: safeParse(r.intent),
    originalText: r.originalText,
    expiresAt: Number(r.expiresAt) || null,
    createdAt: r.createdAt
  }));
}

export function getPendingByChatId(chatId) {
  const r = db.prepare('SELECT id, chatId, action, intent, originalText, expiresAt, createdAt FROM PendingConfirmation WHERE chatId = ? LIMIT 1').get(chatId);
  if (!r) return null;
  return { id: r.id, chatId: r.chatId, action: safeParse(r.action), intent: safeParse(r.intent), originalText: r.originalText, expiresAt: Number(r.expiresAt) || null, createdAt: r.createdAt };
}

export function insertPending(p) {
  const id = p.id || `pc_${Date.now()}_${Math.floor(Math.random()*9999)}`;
  const stmt = db.prepare('INSERT INTO PendingConfirmation (id, chatId, action, intent, originalText, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
  stmt.run(id, p.chatId, JSON.stringify(p.action || {}), p.intent ? JSON.stringify(p.intent) : null, p.originalText || null, Number(p.expiresAt) || null, p.createdAt || new Date().toISOString());
  return { id, chatId: p.chatId, action: p.action, intent: p.intent || null, originalText: p.originalText || null, expiresAt: Number(p.expiresAt) || null, createdAt: p.createdAt || new Date().toISOString() };
}

export function deletePendingByChatId(chatId) {
  const before = db.prepare('SELECT id FROM PendingConfirmation WHERE chatId = ?').all(chatId);
  db.prepare('DELETE FROM PendingConfirmation WHERE chatId = ?').run(chatId);
  return before.map(r => r.id);
}

export function popPendingByChatId(chatId) {
  const r = db.prepare('SELECT id, chatId, action, intent, originalText, expiresAt, createdAt FROM PendingConfirmation WHERE chatId = ? LIMIT 1').get(chatId);
  if (!r) return null;
  db.prepare('DELETE FROM PendingConfirmation WHERE id = ?').run(r.id);
  return { id: r.id, chatId: r.chatId, action: safeParse(r.action), intent: safeParse(r.intent), originalText: r.originalText, expiresAt: Number(r.expiresAt) || null, createdAt: r.createdAt };
}

export function removeExpired(nowMs) {
  // Prefer reading from storage 'db' (the JSON mirror) if present, so tests that mutate db.data work
  try {
    const row = db.prepare('SELECT value FROM storage WHERE key = ?').get('db');
    if (row && row.value) {
      const whole = JSON.parse(row.value);
      const pendings = Array.isArray(whole.pendingConfirmations) ? whole.pendingConfirmations : [];
      const removed = pendings.filter(p => p.expiresAt && p.expiresAt <= nowMs).map(p => ({ ...p }));
      if (removed.length > 0) {
        const remaining = pendings.filter(p => !p.expiresAt || p.expiresAt > nowMs);
        whole.pendingConfirmations = remaining;
        db.prepare('INSERT INTO storage(key,value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('db', JSON.stringify(whole));
        // Also remove from SQL table if present (keep storage and table in sync)
        const del = db.prepare('DELETE FROM PendingConfirmation WHERE id = ?');
        const trans = db.transaction((arr)=>{ for(const r of arr){ try { if (r && r.id) del.run(r.id); } catch(e){} } });
        trans(removed);
      }
      return removed;
    }
  } catch (e) {
    // fallthrough to table-based store
  }

  const rows = db.prepare('SELECT id, chatId, action, intent, originalText, expiresAt, createdAt FROM PendingConfirmation WHERE expiresAt IS NOT NULL AND expiresAt <= ?').all(nowMs);
  if (rows.length === 0) return [];
  const ids = rows.map(r => r.id);
  const del = db.prepare('DELETE FROM PendingConfirmation WHERE id = ?');
  const removed = rows.map(r => ({ id:r.id, chatId:r.chatId, action: safeParse(r.action), intent: safeParse(r.intent), originalText: r.originalText, expiresAt: Number(r.expiresAt)||null, createdAt: r.createdAt }));
  const trans = db.transaction((arr)=>{ for(const id of arr){ del.run(id); } });
  trans(ids);
  return removed;
}

function safeParse(s) { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } }
