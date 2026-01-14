import fs from 'fs';
import path from 'path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'db.json');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const adapter = new JSONFile(dbPath);
const db: Low<any> = new Low(adapter);

// Setup SQLite storage mirror so other modules can read persisted JSON state
let sqliteDb: any = null;
try {
  // Determine sqlite path safely:
  let sqlitePath: string | null = null;
  if (process.env.SQLITE_MIRROR_PATH) {
    sqlitePath = process.env.SQLITE_MIRROR_PATH;
  } else if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:')) {
    sqlitePath = process.env.DATABASE_URL.replace('file:', '');
  } else {
    sqlitePath = path.join(process.cwd(), 'dev.db');
  }

  // dynamic import of better-sqlite3 (may not be available in tests)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Database: any = (await import('better-sqlite3')).default || (await import('better-sqlite3'));
  sqliteDb = new Database(sqlitePath);
  sqliteDb.prepare('CREATE TABLE IF NOT EXISTS storage (key TEXT PRIMARY KEY, value TEXT)').run();
} catch (e: any) {
  console.warn('SQLite not available for storage mirror:', e?.message ?? e);
}

// Wrap write to be more robust in environments where atomic rename may fail (e.g., CI / concurrent tests)
const _originalWrite = db.write?.bind(db);
db.write = async function () {
  if (typeof _originalWrite === 'function') {
    try {
      await _originalWrite();
    } catch (err) {
      try {
        fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2));
      } catch (err2) {
        throw err;
      }
    }
  } else {
    fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2));
  }

  // Mirror to sqlite storage if available
  try {
    if (sqliteDb) {
      const val = JSON.stringify(db.data);
      sqliteDb.prepare('INSERT INTO storage(key,value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('db', val);
    }
  } catch (e: any) {
    console.error('Failed to write storage mirror to sqlite:', e?.message ?? e);
  }

  // Also try to mirror into Prisma Storage if available
  try {
    const sp = await import('./storagePrisma.ts');
    try { await sp.setStorage('db', JSON.stringify(db.data)); } catch (e) {}
  } catch (e) {
    // ignore dynamic import failure
  }
};

// Initialize DB: prefer Prisma storage mirror, then sqlite mirror if present
try {
  try {
    const sp = await import('./storagePrisma.ts');
    const val = await sp.getStorage('db');
    if (val) {
      try { db.data = JSON.parse(val); } catch (e) { console.warn('Failed to parse prisma storage value, falling back to other sources:', (e as any)?.message ?? e); }
    }
  } catch (e) {
    // ignore — prisma not available or failed
  }

  if (!db.data && sqliteDb) {
    const row = sqliteDb.prepare('SELECT value FROM storage WHERE key = ?').get('db');
    if (row && row.value) {
      try { db.data = JSON.parse(row.value); } catch (e) { console.warn('Failed to parse sqlite storage value, falling back to file:', (e as any)?.message ?? e); }
    }
  }

  await db.read();
  if (!db.data) db.data = { clients: [] };
  try { await db.write(); } catch (e) {}
} catch (err) {
  console.error('DB init warning:', err);
}

export default db;
