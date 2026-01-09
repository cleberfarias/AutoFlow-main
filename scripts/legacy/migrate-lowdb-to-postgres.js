import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

export async function runMigration(sourcePath) {
  const prisma = new PrismaClient();
  const srcPath = sourcePath ? path.resolve(sourcePath) : (process.env.MIGRATE_SOURCE ? path.resolve(process.env.MIGRATE_SOURCE) : path.join(process.cwd(), 'data', 'db.json'));
  if (!fs.existsSync(srcPath)) {
    console.warn('No data/db.json found, skipping migration');
    return { migrated: 0 };
  }

  const raw = fs.readFileSync(srcPath, 'utf-8');
  let src;
  try {
    src = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse data/db.json:', e);
    throw e;
  }

  const pendings = Array.isArray(src.pendingConfirmations) ? src.pendingConfirmations : [];
  const storage = src.storage || {};

  console.log(`Found ${pendings.length} pendingConfirmations to migrate`);

  for (const p of pendings) {
    try {
      const id = p.id || `pc_${Date.now()}_${Math.floor(Math.random()*9999)}`;
      console.log('Migrating pending', id);
      const expires = p.expiresAt != null ? BigInt(String(p.expiresAt)) : null;
      const createdAt = p.createdAt ? new Date(p.createdAt) : new Date();
      await prisma.pendingConfirmation.upsert({
        where: { id },
        update: {
          chatId: p.chatId,
          action: JSON.stringify(p.action || {}),
          intent: p.intent ? JSON.stringify(p.intent) : null,
          originalText: p.originalText || null,
          expiresAt: expires,
          createdAt
        },
        create: {
          id,
          chatId: p.chatId,
          action: JSON.stringify(p.action || {}),
          intent: p.intent ? JSON.stringify(p.intent) : null,
          originalText: p.originalText || null,
          expiresAt: expires,
          createdAt
        }
      });
    } catch (e) {
      console.warn('Failed to migrate pending', p.id || p.chatId, e && e.message ? e.message : e);
    }
  }

  // If storage contains a key 'db' with full state, store it in Storage
  try {
    if (storage && Object.keys(storage).length > 0) {
      for (const [k, v] of Object.entries(storage)) {
        try {
          await prisma.storage.upsert({ where: { key: k }, update: { value: typeof v === 'string' ? v : JSON.stringify(v) }, create: { key: k, value: typeof v === 'string' ? v : JSON.stringify(v) } });
        } catch (e) {
          console.warn('Failed to migrate storage key', k, e && e.message ? e.message : e);
        }
      }
    }
  } catch (e) {
    console.warn('No storage to migrate or migration failed', e && e.message ? e.message : e);
  }

  console.log('Migration to Postgres (via Prisma) completed.');
  try { await prisma.$disconnect(); } catch (e) {}
  return { migrated: pendings.length };
}

// Run when executed directly
if (process.argv[1] && process.argv[1].endsWith('migrate-lowdb-to-postgres.js')) {
  runMigration().then(async (r) => { try { await prisma.$disconnect(); } catch(e){} }).catch(async (e) => { console.error('Migration failed:', e && e.message ? e.message : e); try { await prisma.$disconnect(); } catch (e2) {} process.exit(1); });
}
