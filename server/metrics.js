const DEFAULT = {
  confirmations: 0,
  rejections: 0,
  expirations: 0,
  actions_executed: 0
};

const storage = (globalThis.__AUTOFLOW_METRICS__ = globalThis.__AUTOFLOW_METRICS__ || { ...DEFAULT });

export function increment(name, n = 1) {
  if (!(name in storage)) storage[name] = 0;
  storage[name] += n;
}

export function get(name) {
  return storage[name] || 0;
}

export function getAll() {
  return { ...storage };
}

export function reset() {
  Object.keys(storage).forEach(k => { storage[k] = DEFAULT[k] ?? 0; });
}

export default { increment, get, getAll, reset };
