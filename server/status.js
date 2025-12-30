import db from './db.js';

export async function setChatStatus(chatId, status) {
  if (!db.data) await db.read();
  if (!db.data.chats) db.data.chats = {};
  db.data.chats[chatId] = db.data.chats[chatId] || {};
  db.data.chats[chatId].status = status;
  try { await db.write(); } catch (err) { /* best-effort */ }
  return db.data.chats[chatId];
}

export async function getChatStatus(chatId) {
  if (!db.data) await db.read();
  if (!db.data.chats) return null;
  return db.data.chats[chatId]?.status || null;
}

export default { setChatStatus, getChatStatus };