import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export type ConversationState = {
  tenantId: string;
  chatId: string;
  channel: string;
  stage: string;
  vars: Record<string, any>;
  lastIntent?: string | null;
  lastUserText?: string | null;
  updatedAt: number;
  ttlMs?: number | null;
};

const DB_PATH = path.join(process.cwd(), 'data', 'state.json');
let MEM_STORE: Record<string, ConversationState> | null = null;

function key(tenantId: string, chatId: string) {
  return `${tenantId}::${chatId}`;
}

function ensureLoaded() {
  if (MEM_STORE) return;
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      MEM_STORE = JSON.parse(raw || '{}');
    } else {
      MEM_STORE = {};
    }
  } catch (e) {
    MEM_STORE = {};
  }
}

function persist() {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(MEM_STORE, null, 2));
  } catch (e) {
    // ignore
  }
}

export function getState(tenantId: string, chatId: string): ConversationState | null {
  ensureLoaded();
  const k = key(tenantId, chatId);
  const s = MEM_STORE![k];
  if (!s) return null;
  if (s.ttlMs && Date.now() - s.updatedAt > (s.ttlMs || 0)) {
    delete MEM_STORE![k];
    persist();
    return null;
  }
  return { ...s };
}

export function setState(tenantId: string, chatId: string, patch: Partial<ConversationState>): ConversationState {
  ensureLoaded();
  const k = key(tenantId, chatId);
  const prev = MEM_STORE![k] || {
    tenantId,
    chatId,
    channel: patch.channel || 'whatsapp_web',
    stage: 'idle',
    vars: {},
    lastIntent: null,
    lastUserText: null,
    updatedAt: Date.now(),
    ttlMs: patch.ttlMs || null
  };
  const merged = { ...prev, ...patch, updatedAt: Date.now() } as ConversationState;
  MEM_STORE![k] = merged;
  persist();
  return { ...merged };
}

export function clearState(tenantId: string, chatId: string) {
  ensureLoaded();
  const k = key(tenantId, chatId);
  delete MEM_STORE![k];
  persist();
}

export function touch(tenantId: string, chatId: string) {
  ensureLoaded();
  const k = key(tenantId, chatId);
  const s = MEM_STORE![k];
  if (!s) return null;
  s.updatedAt = Date.now();
  persist();
  return { ...s };
}
