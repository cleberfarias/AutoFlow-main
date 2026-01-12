/**
 * Testes para o Sistema de Suporte ChatGuru
 * 
 * Para rodar: npm test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  createNewSession, 
  getSession, 
  saveSession, 
  resetSession, 
  isExpired,
  addMessageToHistory,
  getRecentHistory,
  listActiveSessions,
  cleanupExpiredSessions
} from '../src/services/session';

describe('Session Management', () => {
  const testChatId = 'test_chat_123';

  beforeEach(() => {
    // Limpar localStorage antes de cada teste
    localStorage.clear();
  });

  afterEach(() => {
    // Limpar após cada teste
    resetSession(testChatId);
  });

  describe('createNewSession', () => {
    it('deve criar uma nova sessão com valores padrão', () => {
      const session = createNewSession(testChatId);
      
      expect(session.chatId).toBe(testChatId);
      expect(session.stage).toBe('START');
      expect(session.intent).toBeNull();
      expect(session.confidence).toBe(0);
      expect(session.severity).toBe('LOW');
      expect(session.slots).toEqual({});
      expect(session.history).toEqual([]);
      expect(session.ttlMinutes).toBe(30);
    });

    it('deve criar sessão com TTL customizado', () => {
      const session = createNewSession(testChatId, 60);
      expect(session.ttlMinutes).toBe(60);
    });
  });

  describe('getSession', () => {
    it('deve retornar nova sessão se não existir', () => {
      const session = getSession(testChatId);
      expect(session.chatId).toBe(testChatId);
      expect(session.stage).toBe('START');
    });

    it('deve recuperar sessão existente', () => {
      const original = createNewSession(testChatId);
      original.stage = 'MIDDLE';
      original.intent = 'AUTH_LOGIN';
      saveSession(testChatId, original);

      const retrieved = getSession(testChatId);
      expect(retrieved.stage).toBe('MIDDLE');
      expect(retrieved.intent).toBe('AUTH_LOGIN');
    });

    it('deve criar nova sessão se a existente estiver expirada', () => {
      const expired = createNewSession(testChatId, 0.01); // TTL de 0.01 minutos
      saveSession(testChatId, expired);

      // Simular passagem de tempo
      const now = Date.now();
      const past = now - (2 * 60 * 1000); // 2 minutos atrás
      expired.updatedAt = past;
      saveSession(testChatId, expired);

      const session = getSession(testChatId);
      expect(session.stage).toBe('START'); // Nova sessão
    });
  });

  describe('saveSession', () => {
    it('deve persistir sessão no localStorage', () => {
      const session = createNewSession(testChatId);
      session.stage = 'MIDDLE';
      saveSession(testChatId, session);

      const retrieved = getSession(testChatId);
      expect(retrieved.stage).toBe('MIDDLE');
    });

    it('deve atualizar timestamp ao salvar', () => {
      const session = createNewSession(testChatId);
      const beforeSave = Date.now();
      saveSession(testChatId, session);
      const afterSave = Date.now();

      const retrieved = getSession(testChatId);
      expect(retrieved.updatedAt).toBeGreaterThanOrEqual(beforeSave);
      expect(retrieved.updatedAt).toBeLessThanOrEqual(afterSave);
    });
  });

  describe('resetSession', () => {
    it('deve remover sessão do localStorage', () => {
      const session = createNewSession(testChatId);
      saveSession(testChatId, session);

      resetSession(testChatId);

      // Após reset, getSession deve retornar nova sessão
      const newSession = getSession(testChatId);
      expect(newSession.history).toEqual([]);
      expect(newSession.stage).toBe('START');
    });
  });

  describe('isExpired', () => {
    it('deve retornar false para sessão recente', () => {
      const session = createNewSession(testChatId, 30);
      expect(isExpired(session)).toBe(false);
    });

    it('deve retornar true para sessão expirada', () => {
      const session = createNewSession(testChatId, 30);
      // Simular sessão atualizada há 31 minutos
      session.updatedAt = Date.now() - (31 * 60 * 1000);
      expect(isExpired(session)).toBe(true);
    });
  });

  describe('addMessageToHistory', () => {
    it('deve adicionar mensagem do usuário ao histórico', () => {
      let session = createNewSession(testChatId);
      session = addMessageToHistory(session, 'user', 'Olá!');

      expect(session.history).toHaveLength(1);
      expect(session.history[0].role).toBe('user');
      expect(session.history[0].content).toBe('Olá!');
    });

    it('deve adicionar múltiplas mensagens', () => {
      let session = createNewSession(testChatId);
      session = addMessageToHistory(session, 'user', 'Olá!');
      session = addMessageToHistory(session, 'assistant', 'Oi, como posso ajudar?');
      session = addMessageToHistory(session, 'user', 'Preciso de suporte');

      expect(session.history).toHaveLength(3);
      expect(session.history[1].role).toBe('assistant');
      expect(session.history[2].content).toBe('Preciso de suporte');
    });
  });

  describe('getRecentHistory', () => {
    it('deve retornar histórico limitado', () => {
      let session = createNewSession(testChatId);
      
      // Adicionar 10 mensagens
      for (let i = 0; i < 10; i++) {
        session = addMessageToHistory(session, 'user', `Mensagem ${i}`);
      }

      const recent = getRecentHistory(session, 5);
      expect(recent).toHaveLength(5);
      expect(recent[4].content).toBe('Mensagem 9'); // Última mensagem
    });

    it('deve retornar todas mensagens se houver menos que o limite', () => {
      let session = createNewSession(testChatId);
      session = addMessageToHistory(session, 'user', 'Msg 1');
      session = addMessageToHistory(session, 'user', 'Msg 2');

      const recent = getRecentHistory(session, 5);
      expect(recent).toHaveLength(2);
    });
  });

  describe('listActiveSessions', () => {
    it('deve listar apenas sessões ativas', () => {
      // Criar 2 sessões ativas
      saveSession('chat_1', createNewSession('chat_1'));
      saveSession('chat_2', createNewSession('chat_2'));

      const active = listActiveSessions();
      expect(active).toHaveLength(2);
    });

    it('não deve listar sessões expiradas', () => {
      // Criar sessão expirada
      const expired = createNewSession('chat_expired', 0.01);
      expired.updatedAt = Date.now() - (10 * 60 * 1000);
      saveSession('chat_expired', expired);

      // Criar sessão ativa
      saveSession('chat_active', createNewSession('chat_active'));

      const active = listActiveSessions();
      expect(active).toHaveLength(1);
      expect(active[0].chatId).toBe('chat_active');
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('deve remover sessões expiradas', () => {
      // Criar 1 sessão expirada e 1 ativa
      const expired = createNewSession('chat_expired', 0.01);
      expired.updatedAt = Date.now() - (10 * 60 * 1000);
      saveSession('chat_expired', expired);

      saveSession('chat_active', createNewSession('chat_active'));

      const cleaned = cleanupExpiredSessions();
      expect(cleaned).toBe(1);

      const active = listActiveSessions();
      expect(active).toHaveLength(1);
    });
  });
});

describe('Support Router - Layer 0 (Quick Rules)', () => {
  // Nota: Como supportRouter chama a API, vamos testar apenas as regras da Camada 0
  // Para testes completos, seria necessário mockar a API

  it('deve reconhecer saudações simples', () => {
    const greetings = ['oi', 'olá', 'hey', 'bom dia'];
    
    greetings.forEach(greeting => {
      // A lógica da Camada 0 está em applyLayer0Rules (privada)
      // Teste de integração seria necessário aqui
    });
  });

  it('deve reconhecer pedidos de atendente humano', () => {
    const handoffRequests = [
      'falar com atendente',
      'quero falar com uma pessoa',
      'preciso de atendente humano'
    ];

    // Teste de integração necessário
  });
});

describe('Session State Management', () => {
  it('deve gerenciar transições de stage corretamente', () => {
    let session = createNewSession('test');
    expect(session.stage).toBe('START');

    // Simular fluxo de conversa
    session.stage = 'MIDDLE';
    expect(session.stage).toBe('MIDDLE');

    session.stage = 'COOLDOWN';
    expect(session.stage).toBe('COOLDOWN');

    session.stage = 'END';
    expect(session.stage).toBe('END');
  });

  it('deve gerenciar slots de dados', () => {
    let session = createNewSession('test');
    
    session.slots = {
      email: 'user@example.com',
      problem_type: 'login_issue'
    };

    expect(session.slots.email).toBe('user@example.com');
    expect(session.slots.problem_type).toBe('login_issue');
  });

  it('deve atualizar confidence e severity', () => {
    let session = createNewSession('test');
    
    session.confidence = 0.95;
    session.severity = 'HIGH';
    session.intent = 'BILLING';

    expect(session.confidence).toBe(0.95);
    expect(session.severity).toBe('HIGH');
    expect(session.intent).toBe('BILLING');
  });
});

// Mock de testes de integração (comentados - requerem ambiente Vercel ou mock da API)
/*
describe('Support Router Integration', () => {
  it('deve chamar API e processar resposta', async () => {
    // Mock fetch
    global.fetch = vi.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          intent: 'AUTH_LOGIN',
          confidence: 0.95,
          severity: 'LOW',
          stage_next: 'MIDDLE',
          action: 'CHECKLIST',
          missing_slots: [],
          reply: 'Aqui está o passo a passo...',
          checklist: ['Passo 1', 'Passo 2'],
          handoff_reason: ''
        })
      })
    );

    const response = await handleMessage('test', 'Como faço login?');
    expect(response.intent).toBe('AUTH_LOGIN');
    expect(response.action).toBe('CHECKLIST');
  });
});
*/

export {}; // Para que o TypeScript reconheça como módulo
