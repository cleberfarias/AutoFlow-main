export function normalizeText(t: string) {
  return (t || '').toLowerCase().replace(/[\p{P}$+<=>^`|~]/gu, '').replace(/\s+/g, ' ').trim();
}

const YES = new Set(['sim','s','yes','y','ok','confirmo','confirm','claro']);
const NO = new Set(['não','nao','n','no','cancelar','cancel','na']);

export function isYes(text: string): boolean {
  const n = normalizeText(text).replace(/[^\w\s]/g, '');
  if (!n) return false;
  // take first token
  const token = n.split(' ')[0];
  return YES.has(token);
}

export function isNo(text: string): boolean {
  const n = normalizeText(text).replace(/[^\w\s]/g, '');
  if (!n) return false;
  const token = n.split(' ')[0];
  return NO.has(token);
}
