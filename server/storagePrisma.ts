import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getStorage(key: string) {
  try {
    const r = await prisma.storage.findUnique({ where: { key } as any });
    return r ? r.value : null;
  } catch (e: any) {
    console.warn('storagePrisma.getStorage failed:', e && e.message ? e.message : e);
    return null;
  }
}

export async function setStorage(key: string, value: string) {
  try {
    await prisma.storage.upsert({
      where: { key } as any,
      create: { key, value } as any,
      update: { value } as any,
    });
  } catch (e: any) {
    console.warn('storagePrisma.setStorage failed:', e && e.message ? e.message : e);
  }
}

export async function disconnect() {
  try { await prisma.$disconnect(); } catch (e) {}
}
