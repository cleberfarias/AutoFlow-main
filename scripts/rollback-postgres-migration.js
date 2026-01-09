import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const srcPath = path.join(process.cwd(), 'data', 'db.json');
  if (!fs.existsSync(srcPath)) {
    console.warn('No data/db.json found, nothing to rollback');
    await prisma.$disconnect();
    return;
  }

  const raw = fs.readFileSync(srcPath, 'utf-8');
  let src;
  try {
    src = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse data/db.json:', e);
    process.exit(1);
  }

  const pendings = Array.isArray(src.pendingConfirmations) ? src.pendingConfirmations : [];
  const storage = src.storage || {};

  console.log(`Rolling back ${pendings.length} pendingConfirmations if present`);

  for (const p of pendings) {
    try {
      if (!p.id) continue;
      await prisma.pendingConfirmation.deleteMany({ where: { id: p.id } });
    } catch (e) {
      console.warn('Failed to rollback pending', p.id || p.chatId, e && e.message ? e.message : e);
    }
  }

  try {
    for (const k of Object.keys(storage || {})) {
      try {
        await prisma.storage.deleteMany({ where: { key: k } });
      } catch (e) {
        console.warn('Failed to rollback storage key', k, e && e.message ? e.message : e);
      }
    }
  } catch (e) {}

  console.log('Rollback completed.');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Rollback failed:', e && e.message ? e.message : e);
  try { await prisma.$disconnect(); } catch (e2) {}
  process.exit(1);
});
