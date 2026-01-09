import Fuse from 'fuse.js';

export type Candidate = { intentId: string; intentName?: string; example?: string; score?: number };

// Re-ranker using Fuse.js (fuzzy search on examples) then combining with existing score
export function reRank(text: string, candidates: Candidate[], opts?: { normalizeWeight?: number, existingWeight?: number }) {
  const normalizeWeight = opts?.normalizeWeight ?? 1.0;
  const existingWeight = opts?.existingWeight ?? 0.5;

  const fuse = new Fuse(candidates, { keys: ['example'], includeScore: true, threshold: 0.6 });
  const fuseResults = fuse.search(text);
  const fuseMap = new Map<string, number>();
  for (const r of fuseResults) {
    const example = r.item.example || '';
    const sim = 1 - (r.score ?? 1); // convert Fuse score (0=exact,1=worst) to similarity 0..1
    fuseMap.set(example, sim);
  }

  const scored = candidates.map(c => {
    const base = c.score ?? 0;
    const fuseScore = c.example ? (fuseMap.get(c.example) ?? 0) : 0;
    const combined = (existingWeight * base) + (normalizeWeight * fuseScore);
    return { ...c, fuseScore, combined };
  });

  scored.sort((a, b) => b.combined - a.combined);
  return scored;
}

export default { reRank };