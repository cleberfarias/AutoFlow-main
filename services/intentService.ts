import fs from "fs";
import path from "path";
import LRU from "lru-cache";
import cosineSimilarity from "compute-cosine-similarity";

export type Intent = {
  id: string;
  name: string;
  examples: string[];
};

export type IntentMatch = {
  intentId: string | null;
  intentName?: string | null;
  score: number; // 0..1
  matchedExample?: string | null;
  method: "exact" | "semantic" | "fallback";
  explanation?: string;
  entities?: Record<string, string>;
};

let INTENTS: Intent[] | null = null;
let EMBEDDINGS_CACHE: LRU<string, number[]> | null = null;

function loadIntents(): Intent[] {
  if (INTENTS) return INTENTS;
  const primary = path.resolve(process.cwd(), "data/intents.json");
  const fallback = path.resolve(process.cwd(), "fixtures", "intents.json");

  const p = fs.existsSync(primary) ? primary : (fs.existsSync(fallback) ? fallback : null);
  if (!p) {
    INTENTS = [];
    return INTENTS;
  }
  const raw = fs.readFileSync(p, "utf-8");
  const json = JSON.parse(raw);
  INTENTS = json.intents || [];
  return INTENTS;
}

function normalize(t: string) {
  return t
    .toLowerCase()
    .replace(/[\s\-—_]+/g, " ")
    .replace(/[.,!?;:\(\)"]+/g, "")
    .trim();
}

function simpleWordOverlapScore(a: string, b: string) {
  const wa = new Set(normalize(a).split(" ").filter(Boolean));
  const wb = new Set(normalize(b).split(" ").filter(Boolean));
  if (wa.size === 0 || wb.size === 0) return 0;
  let common = 0;
  wa.forEach((w) => wb.has(w) && common++);
  return common / Math.max(wa.size, wb.size);
}

async function computeEmbeddingsIfNeeded() {
  // If we already populated an LRU cache, return a plain object view to keep callers compatible
  if (EMBEDDINGS_CACHE) {
    const obj: Record<string, number[]> = {};
    EMBEDDINGS_CACHE.forEach((v, k) => (obj[k] = v));
    if (Object.keys(obj).length > 0) return obj;
  }
  // During tests we skip external embedding calls to keep tests fast and deterministic
  if (process.env.NODE_ENV === "test") { EMBEDDINGS_CACHE = null; return null; }
  const apiKey = (process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY);
  if (!apiKey) { EMBEDDINGS_CACHE = null; return null; }
  try {
    const { getOpenAI } = await import("./openaiClient");
    const openai = getOpenAI();
    const intents = loadIntents();
    EMBEDDINGS_CACHE = new LRU<string, number[]>({ max: 5000 });
    for (const it of intents) {
      for (const ex of it.examples) {
        const key = `${it.id}:::${ex}`;
        try {
          const res = await openai.embeddings.create({ model: "text-embedding-3-small", input: ex });
          const emb = res.data[0].embedding as number[];
          EMBEDDINGS_CACHE.set(key, emb);
        } catch (err) {
          // skip if embedding fails
        }
      }
    }
    const obj: Record<string, number[]> = {};
    EMBEDDINGS_CACHE.forEach((v, k) => (obj[k] = v));
    return obj;
  } catch (err) {
    return null;
  }
}

function cosine(a: number[], b: number[]) {
  try {
    // use library for consistent behavior
    return (cosineSimilarity(a, b) as number) || 0;
  } catch {
    // fallback to manual implementation
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
  }
}

export async function detectIntent(text: string): Promise<IntentMatch> {
  const intents = loadIntents();
  const normalized = normalize(text);

  // 1) exact match
  for (const it of intents) {
    for (const ex of it.examples) {
      if (normalize(ex) === normalized) {
        return {
          intentId: it.id,
          intentName: it.name,
          score: 1,
          matchedExample: ex,
          method: "exact",
          explanation: "Exact example match"
        };
      }
    }
  }

  // 2) local heuristic semantic (word overlap) — gather top candidates
  let candidates: { intent?: Intent; example?: string; score: number }[] = [];
  for (const it of intents) {
    for (const ex of it.examples) {
      const s = simpleWordOverlapScore(text, ex);
      if (s > 0) candidates.push({ intent: it, example: ex, score: s });
    }
  }

  // Use a re-ranker to resolve between multiple close candidates. If embeddings are available later,
  // they will further influence the ranking. Dynamic import to avoid cycles in tests.
  if (candidates.length > 1) {
    try {
      const { reRank } = await import('./reRanker.js');
      const ranked = reRank(text, candidates.map(c => ({ intentId: c.intent?.id ?? '', intentName: c.intent?.name, example: c.example, score: c.score })), { normalizeWeight: 1.0, existingWeight: 0.7 });
      const top = ranked[0];
      return {
        intentId: top.intentId || null,
        intentName: top.intentName || null,
        score: Math.min(1, top.combined ?? 0),
        matchedExample: top.example,
        method: 'semantic',
        explanation: 'Re-ranked local candidates'
      };
    } catch (err) {
      // fallthrough to embeddings or single candidate
    }
  }

  // 3) embeddings (if available) - try to improve ranking
  const embeddings = await computeEmbeddingsIfNeeded();
  if (embeddings && Object.keys(embeddings).length > 0) {
    try {
      const { getOpenAI } = await import("./openaiClient");
      const openai = getOpenAI();
      const embRes = await openai.embeddings.create({ model: "text-embedding-3-small", input: text });
      const textEmb = embRes.data[0].embedding as number[];
      let bestEmb = { intent: undefined as Intent | undefined, example: undefined as string | undefined, score: -1 };
      for (const key of Object.keys(embeddings)) {
        const emb = embeddings[key];
        const sim = cosine(textEmb, emb);
        if (sim > bestEmb.score) {
          const [intentId, example] = key.split(":::");
          const intent = intents.find((i) => i.id === intentId);
          bestEmb = { intent, example, score: sim };
        }
      }

      // If we had multiple heuristic candidates, run re-ranker that can combine existing score and embedding sim
      if (candidates.length > 0) {
        try {
          const { reRank } = await import('./reRanker.js');
          // prepare candidates combining heuristic score and embedding similarity where available
          const mergedCandidates: any[] = [];
          for (const c of candidates) {
            const key = `${c.intent?.id}:::${c.example}`;
            const emb = embeddings[key];
            const sim = emb ? cosine(textEmb, emb) : 0;
            mergedCandidates.push({ intentId: c.intent?.id ?? '', intentName: c.intent?.name, example: c.example, score: c.score * 0.6 + sim * 0.8 });
          }
          const ranked = reRank(text, mergedCandidates, { normalizeWeight: 1.0, existingWeight: 0.7 });
          const top = ranked[0];
          if (top && top.intentId) {
            return {
              intentId: top.intentId || null,
              intentName: top.intentName || null,
              score: Math.min(1, top.combined ?? 0),
              matchedExample: top.example,
              method: 'semantic',
              explanation: 'Re-ranked with embeddings'
            };
          }
        } catch (err) {
          // ignore re-rank failures and fall back to bestEmb
        }
      }

      if (bestEmb.score > (candidates[0]?.score || 0)) {
        return {
          intentId: bestEmb.intent?.id ?? null,
          intentName: bestEmb.intent?.name ?? null,
          score: Math.max(0, Math.min(1, bestEmb.score)),
          matchedExample: bestEmb.example,
          method: "semantic",
          explanation: "Similarity by embeddings"
        };
      }
    } catch (err) {
      // ignore embedding failures
    }
  }

  if (candidates.length > 0) {
    // pick top heuristic candidate
    candidates.sort((a,b) => b.score - a.score);
    const best = candidates[0];
    const normalizedScore = Math.min(1, best.score);
    return {
      intentId: best.intent?.id ?? null,
      intentName: best.intent?.name ?? null,
      score: normalizedScore,
      matchedExample: best.example,
      method: "semantic",
      explanation: "Local semantic heuristic (word overlap)"
    };
  }

  // fallback
  return {
    intentId: null,
    intentName: null,
    score: 0,
    method: "fallback",
    explanation: "No good match found"
  };
}

export async function listIntents(): Promise<Intent[]> {
  return loadIntents();
}
