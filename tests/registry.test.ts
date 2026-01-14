import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerTool, callTool, _test_resetAll } from '../server/tools/registry';

beforeEach(() => {
  _test_resetAll();
});

describe('Tool Registry basic behaviors', () => {
  it('times out slow handlers', async () => {
    registerTool('slow', async () => {
      await new Promise(r => setTimeout(r, 200));
      return { ok: true };
    }, { timeoutMs: 50, maxRetries: 0, breaker: { enabled: false } });

    const res = await callTool('slow', {}, { tenantId: 't1' });
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('retries transient failures and succeeds', async () => {
    let called = 0;
    registerTool('flaky', async () => {
      called++;
      if (called === 1) {
        const e = new Error('server'); e.status = 503; throw e;
      }
      return { ok: true, called };
    }, { maxRetries: 1, backoffMs: 1, breaker: { enabled: false } });

    const res = await callTool('flaky', {}, { tenantId: 't1' });
    expect(res.success).toBe(true);
    expect(res.result.ok).toBe(true);
  });

  it('opens circuit after repeated failures', async () => {
    registerTool('alwaysFail', async () => { throw new Error('boom'); }, { maxRetries: 0, breaker: { enabled: true, failureThreshold: 3, resetTimeoutMs: 10000 } });

    for (let i = 0; i < 3; i++) {
      const r = await callTool('alwaysFail', {}, { tenantId: 't1' });
      expect(r.success).toBe(false);
    }

    const r2 = await callTool('alwaysFail', {}, { tenantId: 't1' });
    expect(r2.success).toBe(false);
    expect(r2.error).toBe('circuit_open');
  });

  it('rate limits per tenant', async () => {
    registerTool('counted', async () => ({ ok: true }), { rateLimit: { enabled: true, perTenantPerMinute: 2 }, breaker: { enabled: false } });
    const a = await callTool('counted', {}, { tenantId: 't-1' });
    expect(a.success).toBe(true);
    const b = await callTool('counted', {}, { tenantId: 't-1' });
    expect(b.success).toBe(true);
    const c = await callTool('counted', {}, { tenantId: 't-1' });
    expect(c.success).toBe(false);
    expect(c.error).toBe('rate_limited');
  });

  it('selects whatsapp web mock when SKIP_WHATSAPP=1', async () => {
    process.env.SKIP_WHATSAPP = '1';
    // registry registers whatsapp.web.sendMessage by default
    registerTool('whatsapp.web.sendMessage', async (args) => ({ msg: 'ok' }));
    const r = await callTool('whatsapp.web.sendMessage', { to: '55', text: 'oi' }, { tenantId: 't1' });
    expect(r.success).toBe(true);
  });
});
