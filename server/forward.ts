import db from './db.ts';

export async function forwardMessage(fromChatId: string, target: string, text: string, options: any = {}) {
  if (!db.data) await db.read();
  if (!db.data.forwards) db.data.forwards = [];
  const createdAt = new Date().toISOString();
  const record = { id: `f_${Date.now()}_${Math.floor(Math.random() * 9999)}`, fromChatId, target, text, options, createdAt } as any;
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

export async function getForwards(forChatId: string) {
  if (!db.data) await db.read();
  if (!db.data.forwards) return [];
  return db.data.forwards.filter((f: any) => f.fromChatId === forChatId);
}

export default { forwardMessage, getForwards };
