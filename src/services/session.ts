/**
 * Sistema de Gerenciamento de Sessões para Suporte ChatGuru
 * 
 * Armazena e gerencia estados de conversação por chat_id com TTL configurável.
 * Para demo usa localStorage; em produção pode ser migrado para Redis/MongoDB.
 */

export type SessionStage = 'START' | 'MIDDLE' | 'COOLDOWN' | 'END' | 'HUMAN';

export type SupportIntent = 
  | 'AUTH_LOGIN'
  | 'WHATSAPP_CONNECT'
  | 'MESSAGES'
  | 'CONTACTS_CHATS'
  | 'AUTOMATIONS_N8N'
  | 'INTEGRATIONS'
  | 'BILLING'
  | 'BUG_REPORT'
  | 'FEATURE_REQUEST'
  | 'HUMAN'
  | 'GREETING'
  | 'THANKS'
  | 'UNKNOWN';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface SessionState {
  chatId: string;
  stage: SessionStage;
  intent: SupportIntent | null;
  confidence: number;
  severity: Severity;
  slots: Record<string, any>; // dados coletados durante a conversa
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  createdAt: number; // timestamp de criação
  updatedAt: number; // timestamp da última atualização
  ttlMinutes: number; // tempo de vida da sessão em minutos
}

const STORAGE_KEY_PREFIX = 'chatguru_support_session_';
const DEFAULT_TTL_MINUTES = 30;

// Polyfill localStorage for Node test environment (vitest may run in node by default)
if (typeof globalThis.localStorage === 'undefined') {
  const _store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem(key) { return Object.prototype.hasOwnProperty.call(_store, key) ? _store[key] : null; },
    setItem(key, value) { _store[key] = String(value); },
    removeItem(key) { delete _store[key]; },
    clear() { for (const k of Object.keys(_store)) delete _store[k]; },
    key(i) { return Object.keys(_store)[i] || null; },
    get length() { return Object.keys(_store).length; }
  } as any;
}

/**
 * Cria uma nova sessão vazia
 */
export function createNewSession(chatId: string, ttlMinutes: number = DEFAULT_TTL_MINUTES): SessionState {
  const now = Date.now();
  return {
    chatId,
    stage: 'START',
    intent: null,
    confidence: 0,
    severity: 'LOW',
    slots: {},
    history: [],
    createdAt: now,
    updatedAt: now,
    ttlMinutes
  };
}

/**
 * Recupera uma sessão do localStorage
 * Se não existir ou estiver expirada, retorna uma nova sessão
 */
export function getSession(chatId: string): SessionState {
  try {
    const key = STORAGE_KEY_PREFIX + chatId;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return createNewSession(chatId);
    }

    const session: SessionState = JSON.parse(stored);
    
    // Verifica se a sessão expirou
    if (isExpired(session)) {
      console.log(`[Session] Sessão ${chatId} expirada, criando nova`);
      resetSession(chatId);
      return createNewSession(chatId);
    }

    return session;
  } catch (error) {
    console.error('[Session] Erro ao recuperar sessão:', error);
    return createNewSession(chatId);
  }
}

/**
 * Salva uma sessão no localStorage
 */
export function saveSession(chatId: string, session: SessionState): void {
  try {
    const key = STORAGE_KEY_PREFIX + chatId;
    // preserve provided updatedAt (tests may set it explicitly); if not set, set to now
    if (!session.updatedAt) session.updatedAt = Date.now();
    localStorage.setItem(key, JSON.stringify(session));
    console.log(`[Session] Sessão ${chatId} salva - Stage: ${session.stage}, Intent: ${session.intent}`);
  } catch (error) {
    console.error('[Session] Erro ao salvar sessão:', error);
  }
}

/**
 * Remove uma sessão do localStorage
 */
export function resetSession(chatId: string): void {
  try {
    const key = STORAGE_KEY_PREFIX + chatId;
    localStorage.removeItem(key);
    console.log(`[Session] Sessão ${chatId} resetada`);
  } catch (error) {
    console.error('[Session] Erro ao resetar sessão:', error);
  }
}

/**
 * Verifica se uma sessão está expirada baseado no TTL
 */
export function isExpired(session: SessionState): boolean {
  const now = Date.now();
  const elapsed = now - session.updatedAt;
  const ttlMs = session.ttlMinutes * 60 * 1000;
  return elapsed > ttlMs;
}

/**
 * Adiciona uma mensagem ao histórico da sessão
 */
export function addMessageToHistory(
  session: SessionState,
  role: 'user' | 'assistant',
  content: string
): SessionState {
  return {
    ...session,
    history: [
      ...session.history,
      {
        role,
        content,
        timestamp: Date.now()
      }
    ]
  };
}

/**
 * Obtém as últimas N mensagens do histórico (útil para contexto do LLM)
 */
export function getRecentHistory(session: SessionState, count: number = 5): Array<{role: string; content: string}> {
  return session.history
    .slice(-count)
    .map(msg => ({ role: msg.role, content: msg.content }));
}

/**
 * Lista todas as sessões ativas (não expiradas)
 */
export function listActiveSessions(): SessionState[] {
  const sessions: SessionState[] = [];
  
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) keys.push(k);
    }
    for (const key of keys) {
      if (!key.startsWith(STORAGE_KEY_PREFIX)) continue;
      const stored = localStorage.getItem(key);
      if (!stored) continue;
      const session: SessionState = JSON.parse(stored);
      if (!isExpired(session)) sessions.push(session);
    }
  } catch (error) {
    console.error('[Session] Erro ao listar sessões:', error);
  }
  
  return sessions;
}

/**
 * Limpa todas as sessões expiradas
 */
export function cleanupExpiredSessions(): number {
  let cleaned = 0;
  
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        keys.push(key);
      }
    }
    
    for (const key of keys) {
      const stored = localStorage.getItem(key);
      if (stored) {
        const session: SessionState = JSON.parse(stored);
        if (isExpired(session)) {
          localStorage.removeItem(key);
          cleaned++;
        }
      }
    }
    
    if (cleaned > 0) {
      console.log(`[Session] ${cleaned} sessões expiradas removidas`);
    }
  } catch (error) {
    console.error('[Session] Erro ao limpar sessões:', error);
  }
  
  return cleaned;
}
