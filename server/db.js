import fs from 'fs';
import path from 'path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'db.json');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const adapter = new JSONFile(dbPath);
const db = new Low(adapter);

// Initialize DB
try {
  await db.read();
  if (!db.data) db.data = { clients: [] };
  await db.write();
} catch (err) {
  console.error('DB init warning:', err);
}

export default db;
