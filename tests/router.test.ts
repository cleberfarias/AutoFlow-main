import { describe, it, expect, beforeEach, vi } from 'vitest';
import { routeMessage } from '../services/router';

describe('router', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('responde com tier RULES para "bom dia"', async () => {
    const result = await routeMessage('bom dia', { chatId: 'test' });
    expect(result.type).toBe('reply');
    expect(result.meta.tier).toBe('RULES');
    expect(result.meta.confidence).toBe(1.0);
    expect(result.payload.text).toContain('Bom dia');
  });

  it('responde com tier RULES para "obrigado"', async () => {
    const result = await routeMessage('obrigado', { chatId: 'test' });
    expect(result.type).toBe('reply');
    expect(result.meta.tier).toBe('RULES');
    expect(result.payload.text).toContain('nada');
  });

  it('responde com tier RULES para variações (acentos/pontuação)', async () => {
    const result = await routeMessage('Boa tarde!!!', { chatId: 'test' });
    expect(result.meta.tier).toBe('RULES');
    expect(result.payload.text).toContain('tarde');
  });

  it('escala para HEURISTIC quando score alto', async () => {
    // Mock intentService
    vi.doMock('../server/intentService', () => ({
      detectIntent: vi.fn().mockResolvedValue({
        intentId: 'schedule',
        intentName: 'Agendar',
        score: 0.85,
        method: 'exact'
      })
    }));

    const result = await routeMessage('quero agendar consulta', { chatId: 'test' });
    expect(result.type).toBe('action');
    expect(result.meta.tier).toBe('HEURISTIC');
    expect(result.payload.intentId).toBe('schedule');
  });

  it('retorna fallback LLM_FULL em caso de erro total', async () => {
    // Mock todos os serviços falhando
    vi.doMock('../server/intentService', () => ({
      detectIntent: vi.fn().mockRejectedValue(new Error('fail'))
    }));

    global.fetch = vi.fn().mockRejectedValue(new Error('network error'));

    const result = await routeMessage('texto aleatório', { chatId: 'test' });
    expect(result.type).toBe('reply');
    expect(result.meta.tier).toBe('LLM_FULL');
  });
});
