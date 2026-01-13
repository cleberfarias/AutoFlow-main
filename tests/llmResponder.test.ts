import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateResponse } from '../services/llmResponder';

describe('llmResponder', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retorna texto quando endpoint retorna sucesso', async () => {
    const mockResp = { response: 'Olá, como posso ajudar?' };
    global.fetch = vi.fn().mockResolvedValue({ 
      ok: true, 
      json: async () => mockResp 
    } as any);

    const res = await generateResponse('Olá');
    expect(res).toBe('Olá, como posso ajudar?');
  });

  it('retorna fallback quando endpoint falha', async () => {
    global.fetch = vi.fn().mockResolvedValue({ 
      ok: false, 
      status: 500 
    } as any);

    const res = await generateResponse('teste');
    expect(res).toContain('temporariamente indisponível');
  });

  it('retorna fallback em erro de rede', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const res = await generateResponse('teste');
    expect(res).toContain('não foi possível conectar');
  });

  it('usa fallback se response estiver vazio', async () => {
    const mockResp = { response: '' };
    global.fetch = vi.fn().mockResolvedValue({ 
      ok: true, 
      json: async () => mockResp 
    } as any);

    const res = await generateResponse('teste');
    expect(res).toBe('Desculpe, não consegui gerar uma resposta adequada.');
  });

  it('passa opts corretamente para o endpoint', async () => {
    const mockResp = { response: 'Resposta customizada' };
    const fetchSpy = vi.fn().mockResolvedValue({ 
      ok: true, 
      json: async () => mockResp 
    } as any);
    global.fetch = fetchSpy;

    await generateResponse('teste', { 
      model: 'gpt-4', 
      maxTokens: 100, 
      systemPrompt: 'Você é um expert' 
    });

    expect(fetchSpy).toHaveBeenCalledWith('/api/autoflow/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: 'teste', 
        opts: { 
          model: 'gpt-4', 
          maxTokens: 100, 
          systemPrompt: 'Você é um expert' 
        } 
      })
    });
  });
});
