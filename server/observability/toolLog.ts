export function logTool(evt: {
  tenantId?: string | null;
  toolName?: string | null;
  latencyMs?: number | null;
  attempts?: number;
  outcome?: string | null;
  breakerState?: string | null;
  rateLimited?: boolean;
  errorCode?: any;
}) {
  try {
    const out = {
      ts: new Date().toISOString(),
      tenantId: evt.tenantId || null,
      toolName: evt.toolName || null,
      latencyMs: evt.latencyMs ?? null,
      attempts: evt.attempts ?? 0,
      outcome: evt.outcome || null,
      breakerState: evt.breakerState || null,
      rateLimited: evt.rateLimited || false,
      errorCode: evt.errorCode || null
    };
    // eslint-disable-next-line no-console
    console.log('[toolLog]', JSON.stringify(out));
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('toolLog failed', e?.message || e);
  }
}

export default { logTool };
