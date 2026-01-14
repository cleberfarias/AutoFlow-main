import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

export async function runMigration(dbJsonPath) {
  if (!fs.existsSync(dbJsonPath)) throw new Error('source file not found');
  const raw = fs.readFileSync(dbJsonPath, 'utf-8');
  const parsed = JSON.parse(raw || '{}');

  const dbUrl = process.env.DATABASE_URL || '';
  let sqlitePath = null;
  if (dbUrl.startsWith('file:')) sqlitePath = dbUrl.replace('file:', '');
  if (!sqlitePath) throw new Error('DATABASE_URL must point to sqlite file');
  if (!fs.existsSync(sqlitePath)) throw new Error('sqlite target DB not found: ' + sqlitePath);

  const db = new Database(sqlitePath);
  const pendings = parsed.pendingConfirmations || [];
  let migrated = 0;
  const insert = db.prepare('INSERT INTO PendingConfirmation (id, chatId, action, intent, originalText, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const p of pendings) {
    try {
      insert.run(p.id || null, p.chatId || '', JSON.stringify(p.action || {}), p.intent ? (typeof p.intent === 'string' ? p.intent : JSON.stringify(p.intent)) : null, p.originalText || null, Math.floor(p.expiresAt || 0), p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString());
      migrated++;
    } catch (err) {
      // ignore duplicates or errors
    }
  }

  const storage = parsed.storage || {};
  const sinsert = db.prepare('INSERT INTO Storage (key, value) VALUES (?, ?)');
  for (const k of Object.keys(storage)) {
    try { sinsert.run(k, String(storage[k])); } catch (e) {}
  }

  return { migrated };
}

export default { runMigration };
