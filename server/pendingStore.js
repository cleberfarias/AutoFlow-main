// Compatibility wrapper: delegate pending store operations to Prisma-backed implementation
// This ensures any existing imports of `pendingStore.js` continue to work while we migrate fully to Prisma.
import * as pp from './pendingPrisma.js';

export async function getAllPendings() {
  return await pp.getAllPendings();
}

export async function getPendingByChatId(chatId) {
  return await pp.getPendingByChatId(chatId);
}

export async function insertPending(p) {
  return await pp.insertPending(p);
}

export async function deletePendingByChatId(chatId) {
  return await pp.deletePendingByChatId(chatId);
}

export async function popPendingByChatId(chatId) {
  return await pp.popPendingByChatId(chatId);
}

export async function removeExpired(nowMs) {
  return await pp.removeExpired(nowMs);
}

export function safeParse(s) { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } }