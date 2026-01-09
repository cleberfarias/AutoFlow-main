import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const TMP_DB = path.join(process.cwd(), `tmp-test-${process.pid}.db`);
const DB_JSON = path.join(process.cwd(), `tmp-db-source-${process.pid}.json`);
const ORIGINAL_DB_JSON = DB_JSON + '.bak'; // not used but keep for compatibility

describe('migrate-lowdb-to-postgres script', () => {
  beforeAll(() => {
    // backup original db.json if exists
    if (fs.existsSync(DB_JSON)) fs.copyFileSync(DB_JSON, ORIGINAL_DB_JSON);
    // prepare a simple db.json
    const sample = {
      pendingConfirmations: [
        { id: `pc_test_${process.pid}_${Date.now()}`, chatId: `t_test_${process.pid}`, action: { type: 'RESPONDER', params: { text: 'Hi' } }, intent: { intentId: 'greeting' }, originalText: 'oi', expiresAt: Date.now() + 100000, createdAt: new Date().toISOString() }
      ],
      storage: { testkey: `value_${process.pid}` }
    };
    fs.writeFileSync(DB_JSON, JSON.stringify(sample, null, 2));
  });

  afterAll(() => {
    try {
      if (fs.existsSync(ORIGINAL_DB_JSON)) {
        fs.copyFileSync(ORIGINAL_DB_JSON, DB_JSON);
        fs.unlinkSync(ORIGINAL_DB_JSON);
      } else {
        fs.unlinkSync(DB_JSON);
      }
      if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
    } catch (e) {}
  });

  it('migrates pending confirmations into DB', async () => {
    // set DATABASE_URL to an sqlite test file
    const env = { ...process.env, DATABASE_URL: `file:${TMP_DB}` };
    // ensure schema present
    execSync('npx prisma db push --schema=prisma/schema.prisma', { env, stdio: 'inherit' });
    // ensure current process points to the same DB for Prisma (module runMigration creates a client at runtime)
    process.env.DATABASE_URL = env.DATABASE_URL;
    // run migration script against the isolated file and capture output
    // run migration via direct import to avoid race issues in CI/workers
    const mod = await import('../scripts/migrate-lowdb-to-postgres.js');
    const res = await mod.runMigration(DB_JSON);
    expect(res && res.migrated).toBeGreaterThan(0);

    const prisma = new PrismaClient();
    const p = await prisma.pendingConfirmation.findFirst({ where: { chatId: `t_test_${process.pid}` } });
    await prisma.$disconnect();
    expect(p).not.toBeNull();
    expect(p.chatId).toBe(`t_test_${process.pid}`);
    // cleanup
    await prisma.pendingConfirmation.deleteMany({ where: { chatId: `t_test_${process.pid}` } });
    await prisma.storage.deleteMany({ where: { key: 'testkey' } });
    await prisma.$disconnect();
  }, 20000);
});
