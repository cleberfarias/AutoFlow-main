import { describe, it, expect, vi } from 'vitest';
import { handleMessage } from '../services/intentHandler';

describe('intentHandler', () => {
  it('returns clarification when score below threshold', async () => {
    process.env.INTENT_CONFIDENCE_THRESHOLD = '0.9';
    const res = await handleMessage('Quanto custa o zapgpt?');
    expect(res.clarification).toContain('Você quis dizer');
    expect(res.action).toBeNull();
  });

  it('returns action when score above threshold', async () => {
    process.env.INTENT_CONFIDENCE_THRESHOLD = '0.1';
    const res = await handleMessage('Quanto custa o zapgpt?');
    expect(res.action).not.toBeNull();
    expect(res.action?.type).toBe('ASSISTANT_GPT');
  });
});