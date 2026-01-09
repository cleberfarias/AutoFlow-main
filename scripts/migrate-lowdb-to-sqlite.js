import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const dbPath = path.join(process.cwd(), 'dev.db');
const sourcePath = path.join(process.cwd(), 'data', 'db.json');

if (!fs.existsSync(sourcePath)) {
  console.error('Source db.json not found:', sourcePath);
  process.exit(1);
}

const raw = fs.readFileSync(sourcePath, 'utf-8');
const src = JSON.parse(raw);
const pendings = src.pendingConfirmations || [];

if (!fs.existsSync(dbPath)) {
  console.error('Target sqlite db not found. Run `npx prisma db push` first to create schema (DATABASE_URL=file:./dev.db in .env)');
  process.exit(1);
}

const db = new Database(dbPath);
const insert = db.prepare(`INSERT INTO PendingConfirmation (id, chatId, action, intent, originalText, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`);

let count = 0;
for (const p of pendings) {
  try {
    insert.run(p.id || null, p.chatId || '', JSON.stringify(p.action || {}), p.intent ? JSON.stringify(p.intent) : null, p.originalText || null, Math.floor(p.expiresAt || 0), p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString());
    count++;
  } catch (err) {
    console.warn('Failed to insert pending', p.id, err.message);
  }
}

console.log(`Imported ${count} pending confirmations`);
