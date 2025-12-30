import { describe, it, expect, vi } from 'vitest';
import * as S from '../server/status';

describe('status module', () => {
  it('sets and gets chat status', async () => {
    const s = await S.setChatStatus('chat_status_1', 'waiting');
    expect(s.status).toBe('waiting');
    const got = await S.getChatStatus('chat_status_1');
    expect(got).toBe('waiting');
  });
});