import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getStorage(key) {
  try {
    const r = await prisma.storage.findUnique({ where: { key } });
    return r ? r.value : null;
  } catch (e) {
    console.warn('storagePrisma.getStorage failed:', e && e.message ? e.message : e);
    return null;
  }
}

export async function setStorage(key, value) {
  try {
    await prisma.storage.upsert({
      where: { key },
      create: { key, value },
      update: { value }
    });
  } catch (e) {
    console.warn('storagePrisma.setStorage failed:', e && e.message ? e.message : e);
  }
}

export async function disconnect() {
  try { await prisma.$disconnect(); } catch (e) {}
}
