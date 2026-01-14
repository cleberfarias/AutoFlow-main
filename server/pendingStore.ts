// Compatibility wrapper: delegate pending store operations to Prisma-backed implementation
// This ensures existing imports of `pendingStore.js` continue to work while we migrate fully to Prisma.
import * as pp from './pendingPrisma.ts';

export async function getAllPendings() { return await pp.getAllPendings(); }
export async function getPendingByChatId(chatId: string) { return await pp.getPendingByChatId(chatId); }
export async function insertPending(p: any) { return await pp.insertPending(p); }
export async function deletePendingByChatId(chatId: string) { return await pp.deletePendingByChatId(chatId); }
export async function popPendingByChatId(chatId: string) { return await pp.popPendingByChatId(chatId); }
export async function removeExpired(nowMs: number) { return await pp.removeExpired(nowMs); }
export function safeParse(s: any) { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } }
