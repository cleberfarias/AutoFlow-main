import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export type ProposedAction = {
  type: 'TOOL_CALL' | 'ACTION';
  tool?: string;
  args?: any;
  actionName?: string;
  payload?: any;
};

export type PendingConfirmation = {
  id: string;
  tenantId: string;
  chatId: string;
  channel: string;
  createdAt: number;
  expiresAt: number;
  promptText: string;
  proposedAction: ProposedAction;
  meta?: Record<string, any>;
};

const DB_PATH = path.join(process.cwd(), 'data', 'confirmations.json');
let MEM: Record<string, PendingConfirmation> | null = null;

function key(t: string, c: string) { return `${t}::${c}`; }

function ensure() {
  if (MEM) return;
  try {
    if (fs.existsSync(DB_PATH)) MEM = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8') || '{}');
    else MEM = {};
  } catch (e) { MEM = {}; }
}

function persist() {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(MEM, null, 2));
  } catch (e) {}
}

export function createConfirmation(conf: Omit<PendingConfirmation, 'id' | 'createdAt'>): PendingConfirmation {
  ensure();
  const k = key(conf.tenantId, conf.chatId);
  const existing = MEM![k];
  if (existing && existing.expiresAt > Date.now()) {
    // idempotent: reuse
    return { ...existing };
  }
  const now = Date.now();
  const pc: PendingConfirmation = {
    ...conf,
    id: uuidv4(),
    createdAt: now
  } as PendingConfirmation;
  MEM![k] = pc;
  persist();
  return { ...pc };
}

export function getConfirmation(tenantId: string, chatId: string): PendingConfirmation | null {
  ensure();
  const k = key(tenantId, chatId);
  const v = MEM![k];
  if (!v) return null;
  if (v.expiresAt <= Date.now()) {
    delete MEM![k];
    persist();
    return null;
  }
  return { ...v };
}

export function resolveConfirmation(tenantId: string, chatId: string): void {
  ensure();
  const k = key(tenantId, chatId);
  delete MEM![k];
  persist();
}

export function cleanupExpired(now = Date.now()): number {
  ensure();
  let removed = 0;
  for (const k of Object.keys(MEM!)) {
    const v = MEM![k];
    if (v.expiresAt <= now) { delete MEM![k]; removed++; }
  }
  if (removed) persist();
  return removed;
}
