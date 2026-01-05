export default class ChatGuruClient {
  base: string;
  constructor(baseUrl = '') { this.base = baseUrl || ''; }

  async suggest(botId: string, patch: any) {
    const res = await fetch(`${this.base}/api/autoflow/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bot_id: botId, patch })
    });
    if (!res.ok) throw new Error('Suggest request failed');
    return res.json();
  }

  async apply(botId: string, patch: any, mode: 'draft' | 'publish' = 'draft') {
    const res = await fetch(`${this.base}/api/autoflow/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bot_id: botId, patch, mode })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`apply failed: ${res.status} ${txt}`);
    }
    return res.json();
  }
}
