export type Candidate = { intentId: string; intentName?: string; example?: string; score?: number };

function normalize(t: string) {
  return t
    .toLowerCase()
    .replace(/[.,!?;:\(\)"\-—_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordOverlap(a: string, b: string) {
  const wa = new Set(normalize(a).split(' ').filter(Boolean));
  const wb = new Set(normalize(b).split(' ').filter(Boolean));
  if (wa.size === 0 || wb.size === 0) return 0;
  let common = 0;
  wa.forEach(w => wb.has(w) && common++);
  return common / Math.max(wa.size, wb.size);
}

// Simple fallback re-ranker: use word overlap to score candidates, merge with their existing score if provided
export function reRank(text: string, candidates: Candidate[], opts?: { normalizeWeight?: number, existingWeight?: number }) {
  const normalizeWeight = opts?.normalizeWeight ?? 1.0;
  const existingWeight = opts?.existingWeight ?? 0.5;

  const scored = candidates.map(c => {
    const base = c.score ?? 0;
    const overlap = c.example ? wordOverlap(text, c.example) : 0;
    const combined = (existingWeight * base) + (normalizeWeight * overlap);
    return { ...c, overlap, combined };
  });

  scored.sort((a, b) => b.combined - a.combined);
  return scored;
}

export default { reRank };