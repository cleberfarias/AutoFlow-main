import db from './db.js';

export async function forwardMessage(fromChatId, target, text, options = {}) {
  if (!db.data) await db.read();
  if (!db.data.forwards) db.data.forwards = [];
  const createdAt = new Date().toISOString();
  const record = { id: `f_${Date.now()}_${Math.floor(Math.random() * 9999)}`, fromChatId, target, text, options, createdAt };
  db.data.forwards.push(record);
  try {
    await db.write();
  } catch (err) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const dbPath = path.join(process.cwd(), 'data', 'db.json');
      fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2));
    } catch (err2) {
      console.error('Fallback write failed in forwardMessage:', err2);
    }
  }
  return record;
}

export async function getForwards(forChatId) {
  if (!db.data) await db.read();
  if (!db.data.forwards) return [];
  return db.data.forwards.filter(f => f.fromChatId === forChatId);
}

export default { forwardMessage, getForwards };