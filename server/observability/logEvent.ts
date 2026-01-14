export function logEvent(evt) {
  try {
    const payload = {
      ts: new Date().toISOString(),
      tenantId: evt.tenantId || null,
      channel: evt.channel || null,
      chatId: evt.chatId || null,
      tier: evt.tier || null,
      durationMs: evt.durationMs || null,
      outcome: evt.outcome || null,
      tool: evt.tool || null
    };
    // emit as JSON on stdout for easy parsing
    console.log('[observability]', JSON.stringify(payload));
  } catch (e) {
    console.error('logEvent failed', e?.message || e);
  }
}

export default { logEvent };
