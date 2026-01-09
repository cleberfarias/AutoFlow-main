import fs from 'fs';
import path from 'path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'db.json');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const adapter = new JSONFile(dbPath);
const db = new Low(adapter);

// Wrap write to be more robust in environments where atomic rename may fail (e.g., CI / concurrent tests)
const _originalWrite = db.write?.bind(db);
db.write = async function () {
  if (typeof _originalWrite === 'function') {
    try {
      return await _originalWrite();
    } catch (err) {
      try {
        // Fallback: write file synchronously to avoid rename-related races
        fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2));
        return;
      } catch (err2) {
        // If even fallback fails, rethrow original error
        throw err;
      }
    }
  }
  // If original write not available, use fallback
  fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2));
};

// Initialize DB
try {
  await db.read();
  if (!db.data) db.data = { clients: [] };
  await db.write();
} catch (err) {
  console.error('DB init warning:', err);
}

export default db;
