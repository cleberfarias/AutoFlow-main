import fs from 'fs';
import path from 'path';

function loadIntents() {
  const primary = path.resolve(process.cwd(), 'data/intents.json');
  const fallback = path.resolve(process.cwd(), 'fixtures', 'intents.json');
  const p = fs.existsSync(primary) ? primary : (fs.existsSync(fallback) ? fallback : null);
  if (!p) return [];
  try {
    const raw = fs.readFileSync(p, 'utf-8');
    const json = JSON.parse(raw);
    return json.intents || [];
  } catch (err) {
    return [];
  }
}

function normalize(t) {
  return (t || '')
    .toLowerCase()
    .replace(/[\s\-—_]+/g, ' ')
    .replace(/[.,!?;:\(\)"]+/g, '')
    .trim();
}

function simpleWordOverlapScore(a, b) {
  const wa = new Set(normalize(a).split(' ').filter(Boolean));
  const wb = new Set(normalize(b).split(' ').filter(Boolean));
  if (wa.size === 0 || wb.size === 0) return 0;
  let common = 0;
  wa.forEach(w => wb.has(w) && common++);
  return common / Math.max(wa.size, wb.size);
}

export async function detectIntent(text) {
  const intents = loadIntents();
  const normalized = normalize(text);

  // exact match
  for (const it of intents) {
    for (const ex of it.examples) {
      if (normalize(ex) === normalized) {
        return { intentId: it.id, intentName: it.name, score: 1, matchedExample: ex, method: 'exact' };
      }
    }
  }

  // heuristic similarity
  let best = { intent: null, example: null, score: 0 };
  for (const it of intents) {
    for (const ex of it.examples) {
      const s = simpleWordOverlapScore(text, ex);
      if (s > best.score) best = { intent: it, example: ex, score: s };
    }
  }

  if (best.score > 0) {
    return { intentId: best.intent?.id || null, intentName: best.intent?.name || null, score: best.score, matchedExample: best.example, method: 'semantic' };
  }

  // fallback
  return { intentId: null, intentName: null, score: 0, method: 'fallback' };
}

export { detectIntent };
