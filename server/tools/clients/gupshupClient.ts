import fetch from 'node-fetch';

export async function sendMessage(args: any = {}, ctx: any = {}) {
  const base = process.env.GUPSHUP_FORWARD_URL || process.env.TOOLS_BASE_URL || 'http://localhost:5050';
  const { to, text } = args || {};
  if (!to || !text) throw new Error('missing_to_or_text');

  if (process.env.SKIP_WHATSAPP === '1') {
    return { messageId: 'mock-gupshup' };
  }

  const url = `${base}/api/poc/send-whatsapp`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, text, ctx }) });
  if (!res.ok) { const e: any = new Error('http_error'); e.status = res.status; throw e; }
  return res.json();
}

export default { sendMessage };
