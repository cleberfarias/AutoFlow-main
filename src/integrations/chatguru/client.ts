export default class ChatGuruClient {
  base: string;
  constructor(baseUrl?: string) { 
    // Prefer explicit baseUrl param; fallback to Vite env var or '' for same-origin
    const envBase = typeof import.meta !== 'undefined' ? (import.meta.env.VITE_CHATGURU_API_BASE_URL || '') : '';
    this.base = (baseUrl || envBase || '').replace(/\/$/, '');
  }

  private async handleResponse(res: Response) {
    const text = await res.text();
    if (!res.ok) {
      let body = text;
      try { body = JSON.parse(text); } catch {}
      throw new Error(`Request failed ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
    }
    try { return JSON.parse(text); } catch { return text; }
  }

  async suggest(botId: string, patch: any) {
    const url = `${this.base}/api/autoflow/suggest`;
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bot_id: botId, patch })
    });
    return this.handleResponse(res as any);
  }

  async apply(botId: string, patch: any, mode: 'draft' | 'publish' = 'draft') {
    const url = `${this.base}/api/autoflow/apply`;
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bot_id: botId, patch, mode })
    });
    return this.handleResponse(res as any);
  }
}
