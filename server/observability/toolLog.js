export function logTool(evt) {
  try {
    const out = {
      ts: new Date().toISOString(),
      tenantId: evt.tenantId || null,
      toolName: evt.toolName || null,
      latencyMs: evt.latencyMs || null,
      attempts: evt.attempts || 0,
      outcome: evt.outcome || null,
      breakerState: evt.breakerState || null,
      rateLimited: evt.rateLimited || false,
      errorCode: evt.errorCode || null
    };
    console.log('[toolLog]', JSON.stringify(out));
  } catch (e) {
    console.error('toolLog failed', e?.message || e);
  }
}

export default { logTool };
