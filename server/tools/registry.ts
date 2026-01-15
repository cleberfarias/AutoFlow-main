import fetch from 'node-fetch';
import { logTool } from '../observability/toolLog.ts';
import { sendMessage as gupshupSend } from './clients/gupshupClient.ts';

type ToolEntry = { name: string; handler: Function; config: any };

const tools = new Map<string, ToolEntry>();
const breakers = new Map<string, any>();
const rateLimits = new Map<string, any>();

const DEFAULT_CONFIG = {
  timeoutMs: 4000,
  actionTimeoutMs: 8000,
  maxRetries: 2,
  backoffMs: 200,
  backoffMultiplier: 2,
  breaker: { enabled: true, failureThreshold: 5, resetTimeoutMs: 30000, halfOpenMaxCalls: 2 },
  rateLimit: { enabled: true, perTenantPerMinute: 120 }
};

function now() { return Date.now(); }

export function registerTool(name: string, handler: Function, config: any = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...(config || {}) };
  tools.set(name, { name, handler, config: cfg });
  // eslint-disable-next-line no-console
  console.log(`[Tool Registry] Registered: ${name}`);
}

export function listTools() {
  return Array.from(tools.values()).map(t => ({ name: t.name, config: t.config }));
}

function _getBreakerKey(toolName: string, tenantId?: string) {
  return `${tenantId || 'default'}::${toolName}`;
}

function _getRateKey(toolName: string, tenantId?: string) {
  return `${tenantId || 'default'}::${toolName}`;
}

function _isTransientError(err: any) {
  if (!err) return false;
  if (err.name === 'AbortError') return true;
  if (err.status && (err.status === 429 || (err.status >= 500 && err.status < 600))) return true;
  return false;
}

async function _callHandlerWithTimeout(handler: Function, args: any, context: any, timeoutMs: number) {
  const ac = new AbortController();
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs));
  const handlerPromise = (async () => {
    const ctx = { ...(context || {}), signal: ac.signal };
    return await handler(args, ctx);
  })();

  try {
    const result = await Promise.race([handlerPromise, timeoutPromise]);
    return result;
  } catch (err: any) {
    if (String(err) === 'Error: timeout') {
      const e: any = new Error('timeout'); e.code = 'timeout'; e.name = 'AbortError';
      throw e;
    }
    throw err;
  } finally {
    try { ac.abort(); } catch (e) {}
  }
}

export async function callTool(toolName: string, args: any = {}, context: any = {}) {
  const tool = tools.get(toolName);
  const tenantId = context?.tenantId || 'default';
  const meta: any = { attempts: 0, breakerState: 'CLOSED', rateLimited: false };

  if (!tool) {
    return { success: false, error: `tool_not_found`, meta };
  }

  const cfg = tool.config || DEFAULT_CONFIG;

  if (cfg.rateLimit?.enabled) {
    const key = _getRateKey(toolName, tenantId);
    const slot = rateLimits.get(key) || { count: 0, windowStart: now() };
    if (now() - slot.windowStart > 60_000) {
      slot.count = 0; slot.windowStart = now();
    }
    if (slot.count >= (cfg.rateLimit?.perTenantPerMinute || DEFAULT_CONFIG.rateLimit.perTenantPerMinute)) {
      meta.rateLimited = true;
      logTool({ tenantId, toolName, latencyMs: 0, attempts: 0, outcome: 'rate_limited', breakerState: 'CLOSED' });
      return { success: false, error: 'rate_limited', meta };
    }
    slot.count += 1;
    rateLimits.set(key, slot);
  }

  const breakerKey = _getBreakerKey(toolName, tenantId);
  const breaker = breakers.get(breakerKey) || { state: 'CLOSED', failureCount: 0, openedUntil: 0, halfOpenCalls: 0 };
  meta.breakerState = breaker.state;
  if (breaker.state === 'OPEN' && now() < breaker.openedUntil) {
    logTool({ tenantId, toolName, latencyMs: 0, attempts: 0, outcome: 'circuit_open', breakerState: 'OPEN' });
    return { success: false, error: 'circuit_open', meta };
  }

  const maxAttempts = Math.max(1, 1 + (cfg.maxRetries || 0));
  let lastErr: any = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    meta.attempts = attempt;
    const start = now();
    try {
      if (breaker.state === 'HALF_OPEN' && breaker.halfOpenCalls >= (cfg.breaker?.halfOpenMaxCalls || DEFAULT_CONFIG.breaker.halfOpenMaxCalls)) {
        return { success: false, error: 'circuit_half_open_limited', meta };
      }
      if (breaker.state === 'HALF_OPEN') breaker.halfOpenCalls = (breaker.halfOpenCalls || 0) + 1;

      const timeoutMs = cfg.timeoutMs || DEFAULT_CONFIG.timeoutMs;
      const result = await _callHandlerWithTimeout(tool.handler, args, context, timeoutMs);

      breaker.failureCount = 0;
      breaker.state = 'CLOSED';
      breaker.halfOpenCalls = 0;
      breakers.set(breakerKey, breaker);

      const latencyMs = now() - start;
      logTool({ tenantId, toolName, latencyMs, attempts: attempt, outcome: 'success', breakerState: breaker.state });
      return { success: true, result, meta };
    } catch (err: any) {
      lastErr = err;
      const latencyMs = now() - start;
      breaker.failureCount = (breaker.failureCount || 0) + 1;
      if (cfg.breaker?.enabled && breaker.failureCount >= (cfg.breaker?.failureThreshold || DEFAULT_CONFIG.breaker.failureThreshold)) {
        breaker.state = 'OPEN';
        breaker.openedUntil = now() + (cfg.breaker?.resetTimeoutMs || DEFAULT_CONFIG.breaker.resetTimeoutMs);
      }
      breakers.set(breakerKey, breaker);

      logTool({ tenantId, toolName, latencyMs, attempts: attempt, outcome: 'failure', breakerState: breaker.state, errorCode: err?.code || err?.status || String(err) });

      const transient = _isTransientError(err);
      if (!transient) {
        return { success: false, error: err?.message || String(err), meta };
      }

      if (attempt === maxAttempts) break;

      const backoffBase = cfg.backoffMs || DEFAULT_CONFIG.backoffMs;
      const backoff = Math.floor(backoffBase * Math.pow(cfg.backoffMultiplier || DEFAULT_CONFIG.backoffMultiplier, attempt - 1));
      const jitter = Math.floor(Math.random() * 100);
      await new Promise(r => setTimeout(r, backoff + jitter));
    }
  }

  return { success: false, error: lastErr?.message || String(lastErr), meta };
}

export function _test_resetAll() {
  tools.clear(); breakers.clear(); rateLimits.clear();
}

// --- Register core tools ---
registerTool('calendar.findAvailability', async (args: any) => {
  const base = process.env.TOOLS_BASE_URL || 'http://localhost:5050';
  const res = await fetch(`${base}/api/poc/find-availability`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  if (!res.ok) { const e: any = new Error('http_error'); e.status = res.status; throw e; }
  return res.json();
});

registerTool('calendar.createAppointment', async (args: any) => {
  const base = process.env.TOOLS_BASE_URL || 'http://localhost:5050';
  const res = await fetch(`${base}/api/poc/create-appointment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  if (!res.ok) { const e: any = new Error('http_error'); e.status = res.status; throw e; }
  return res.json();
});

registerTool('http.request', async (args: any, ctx: any) => {
  const { method = 'GET', url, headers = {}, body } = args || {};
  if (!url) throw new Error('missing_url');
  if (!/^https?:\/\//i.test(url)) throw new Error('invalid_url');
  const maxSize = 1_000_000;
  const timeoutMs = args.timeoutMs || 5000;
  const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: ac.signal });
    clearTimeout(id);
    const text = await res.text();
    if (text.length > maxSize) throw new Error('response_too_large');
    let parsed = null;
    try { parsed = JSON.parse(text); } catch (e) {}
    return { status: res.status, headers: Object.fromEntries((res as any).headers?.entries ? (res as any).headers.entries() : []), bodyText: text, bodyJson: parsed };
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') { const e: any = new Error('timeout'); e.code = 'timeout'; throw e; }
    throw err;
  }
});

registerTool('whatsapp.gupshup.sendMessage', async (args: any, ctx: any) => {
  return await gupshupSend(args, ctx);
}, { timeoutMs: 5000, maxRetries: 1 });

registerTool('whatsapp.web.sendMessage', async (args: any, ctx: any) => {
  if (process.env.SKIP_WHATSAPP === '1') return { messageId: 'mock' };
  const base = process.env.WHATSAPP_WEB_FORWARD_URL || 'http://localhost:5050/api/poc/send-whatsapp';
  const res = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: args.to, text: args.text, ctx }) });
  if (!res.ok) { const e: any = new Error('http_error'); e.status = res.status; throw e; }
  return res.json();
});
