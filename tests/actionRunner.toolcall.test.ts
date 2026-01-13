import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runAction } from '../services/actionRunner';

describe('actionRunner TOOL_CALL', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('executa tool com sucesso quando registry retorna success', async () => {
    // Mock tool registry
    vi.doMock('../server/tools/registry.js', () => ({
      callTool: vi.fn().mockResolvedValue({
        success: true,
        result: { found: true, suggestedStart: '2025-01-15T10:00:00Z' }
      })
    }));

    const action = {
      type: 'TOOL_CALL',
      params: {
        toolName: 'calendar.findAvailability',
        args: { serviceId: 's1' }
      }
    };

    const result = await runAction(action, { chatId: 'test' });
    expect(result.ok).toBe(true);
    expect(result.type).toBe('TOOL_CALL');
    expect(result.text).toContain('sucesso');
  });

  it('retorna erro quando toolName não é fornecido', async () => {
    const action = {
      type: 'TOOL_CALL',
      params: {}
    };

    const result = await runAction(action, { chatId: 'test' });
    expect(result.ok).toBe(false);
    expect(result.raw).toContain('missing_toolName');
  });

  it('retorna erro quando tool falha', async () => {
    vi.doMock('../server/tools/registry.js', () => ({
      callTool: vi.fn().mockResolvedValue({
        success: false,
        error: 'Tool not found'
      })
    }));

    const action = {
      type: 'TOOL_CALL',
      params: {
        toolName: 'invalid.tool',
        args: {}
      }
    };

    const result = await runAction(action, { chatId: 'test' });
    expect(result.ok).toBe(false);
    expect(result.text).toContain('Não foi possível executar');
  });

  it('mantém compatibilidade com actions existentes', async () => {
    const action = {
      type: 'RESPONDER',
      params: { text: 'Olá {MSG_TEXT}' }
    };

    const result = await runAction(action, { MSG_TEXT: 'mundo' });
    expect(result.ok).toBe(true);
    expect(result.type).toBe('RESPONDER');
    expect(result.text).toBe('Olá mundo');
  });
});
