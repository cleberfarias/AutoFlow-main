// Simple in-memory dedupe store for event idempotency (MVP)
const store = new Map();

export function has(eventId) {
  if (!eventId) return false;
  const entry = store.get(eventId);
  if (!entry) return false;
  // check expiration
  if (Date.now() > entry.expireAt) {
    store.delete(eventId);
    return false;
  }
  return true;
}

export function set(eventId, ttlMs = 60_000) {
  if (!eventId) return;
  const expireAt = Date.now() + ttlMs;
  store.set(eventId, { expireAt });
  // schedule cleanup
  setTimeout(() => {
    const e = store.get(eventId);
    if (e && Date.now() > e.expireAt) store.delete(eventId);
  }, ttlMs + 1000);
}

export function clearAll() {
  store.clear();
}

export default { has, set, clearAll };
