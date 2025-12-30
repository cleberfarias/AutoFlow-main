import db from './db.js';

export async function createFunnel(funnelId, name) {
  if (!db.data) await db.read();
  if (!db.data.funnels) db.data.funnels = {};
  db.data.funnels[funnelId] = db.data.funnels[funnelId] || { id: funnelId, name, steps: {} };
  db.data.funnels[funnelId].name = name || db.data.funnels[funnelId].name;
  try { await db.write(); } catch (e) {}
  return db.data.funnels[funnelId];
}

export async function addFunnelStep(funnelId, stepId, name) {
  if (!db.data) await db.read();
  if (!db.data.funnels || !db.data.funnels[funnelId]) return null;
  db.data.funnels[funnelId].steps[stepId] = { id: stepId, name };
  try { await db.write(); } catch (e) {}
  return db.data.funnels[funnelId].steps[stepId];
}

export async function setChatFunnel(chatId, funnelId, stepId) {
  if (!db.data) await db.read();
  if (!db.data.chats) db.data.chats = {};
  db.data.chats[chatId] = db.data.chats[chatId] || {};
  db.data.chats[chatId].funnelId = funnelId || null;
  db.data.chats[chatId].funnelStepId = stepId || null;
  try { await db.write(); } catch (e) {}
  return db.data.chats[chatId];
}

export async function getChatFunnel(chatId) {
  if (!db.data) await db.read();
  if (!db.data.chats) return null;
  return db.data.chats[chatId] || null;
}

export async function getFunnel(funnelId) {
  if (!db.data) await db.read();
  if (!db.data.funnels) return null;
  return db.data.funnels[funnelId] || null;
}

export default { createFunnel, addFunnelStep, setChatFunnel, getChatFunnel, getFunnel };