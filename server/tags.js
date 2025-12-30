import db from './db.js';

export async function addTag(chatId, tag) {
  if (!db.data) await db.read();
  if (!db.data.chatTags) db.data.chatTags = {};
  if (!db.data.chatTags[chatId]) db.data.chatTags[chatId] = [];
  if (!db.data.chatTags[chatId].includes(tag)) db.data.chatTags[chatId].push(tag);
  try { await db.write(); } catch (err) { /* best-effort */ }
  return db.data.chatTags[chatId];
}

export async function getTags(chatId) {
  if (!db.data) await db.read();
  if (!db.data.chatTags) return [];
  return db.data.chatTags[chatId] || [];
}

export async function removeTag(chatId, tag) {
  if (!db.data) await db.read();
  if (!db.data.chatTags || !db.data.chatTags[chatId]) return false;
  const before = db.data.chatTags[chatId].length;
  db.data.chatTags[chatId] = db.data.chatTags[chatId].filter(t => t !== tag);
  if (db.data.chatTags[chatId].length !== before) {
    try { await db.write(); } catch (err) {}
    return true;
  }
  return false;
}

export default { addTag, getTags, removeTag };