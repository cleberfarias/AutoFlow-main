import db from './db.ts';

export async function recordChatAction(entry: any) {
  // entry: { chatId, intentId, intentScore, actionType, text, timestamp }
  if (!db.data) await db.read();
  if (!db.data.chatActions) db.data.chatActions = [];
  const record = { id: `ca_${Date.now()}_${Math.floor(Math.random() * 9999)}`, ...entry } as any;
  db.data.chatActions.push(record);
  try {
    await db.write();
  } catch (err) {
    console.error('recordChatAction failed:', err);
    try {
      const fs = await import('fs');
      const path = await import('path');
      const dbPath = path.join(process.cwd(), 'data', 'db.json');
      fs.writeFileSync(dbPath, JSON.stringify(db.data, null, 2));
    } catch (err2) {
      console.error('recordChatAction fallback write failed:', err2);
    }
  }
  return record;
}

export default { recordChatAction };
