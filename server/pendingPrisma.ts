import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getAllPendings() {
  const rows = await prisma.pendingConfirmation.findMany({ orderBy: { createdAt: 'asc' } as any }) as any[];
  return rows.map(r => ({
    id: r.id,
    chatId: r.chatId,
    action: safeParse(r.action),
    intent: safeParse(r.intent),
    originalText: r.originalText,
    expiresAt: Number(r.expiresAt) || null,
    createdAt: r.createdAt
  }));
}

export async function getPendingByChatId(chatId: string) {
  const r = await prisma.pendingConfirmation.findFirst({ where: { chatId } as any }) as any;
  if (!r) return null;
  return { id: r.id, chatId: r.chatId, action: safeParse(r.action), intent: safeParse(r.intent), originalText: r.originalText, expiresAt: Number(r.expiresAt) || null, createdAt: r.createdAt };
}

export async function insertPending(p: any) {
  const id = p.id || `pc_${Date.now()}_${Math.floor(Math.random()*9999)}`;
  const createdAt = p.createdAt ? new Date(p.createdAt) : new Date();
  await prisma.pendingConfirmation.create({ data: { id, chatId: p.chatId, action: JSON.stringify(p.action || {}), intent: p.intent ? JSON.stringify(p.intent) : null, originalText: p.originalText || null, expiresAt: Number(p.expiresAt) || null, createdAt } as any });
  return { id, chatId: p.chatId, action: p.action, intent: p.intent || null, originalText: p.originalText || null, expiresAt: Number(p.expiresAt) || null, createdAt };
}

export async function deletePendingByChatId(chatId: string) {
  const rows = await prisma.pendingConfirmation.findMany({ where: { chatId } as any, select: { id: true } as any }) as any[];
  await prisma.pendingConfirmation.deleteMany({ where: { chatId } as any });
  return rows.map(r => r.id);
}

export async function popPendingByChatId(chatId: string) {
  const r = await prisma.pendingConfirmation.findFirst({ where: { chatId } as any }) as any;
  if (!r) return null;
  await prisma.pendingConfirmation.delete({ where: { id: r.id } as any });
  return { id: r.id, chatId: r.chatId, action: safeParse(r.action), intent: safeParse(r.intent), originalText: r.originalText, expiresAt: Number(r.expiresAt) || null, createdAt: r.createdAt };
}

export async function removeExpired(nowMs: number) {
  const rows = await prisma.pendingConfirmation.findMany({ where: { expiresAt: { lte: nowMs } } as any }) as any[];
  if (!rows || rows.length === 0) return [];
  const ids = rows.map(r => r.id);
  await prisma.pendingConfirmation.deleteMany({ where: { id: { in: ids } } as any });
  return rows.map(r => ({ id: r.id, chatId: r.chatId, action: safeParse(r.action), intent: safeParse(r.intent), originalText: r.originalText, expiresAt: Number(r.expiresAt) || null, createdAt: r.createdAt }));
}

function safeParse(s: string | null) { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } }

export async function disconnect() { await prisma.$disconnect(); }
