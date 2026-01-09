import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateWorkflowFromPrompt } from '../services/geminiService';

describe('generateWorkflowFromPrompt', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps steps and defaults fields when calling /api/generate', async () => {
    const mockResp = { steps: [ { id: 's1', type: 'TRIGGER', title: 'Start', description: 'Inicia', params: { inputs: [], outputs: [] }, nextSteps: [] } ] };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockResp } as any);

    const res = await generateWorkflowFromPrompt('Teste');
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('s1');
    expect(res[0].type).toBe('TRIGGER');
    expect(res[0].title).toBe('Start');
  });

  it('throws when api returns error', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ message: 'bad' }) } as any);
    await expect(generateWorkflowFromPrompt('Teste')).rejects.toThrow();
  });
});