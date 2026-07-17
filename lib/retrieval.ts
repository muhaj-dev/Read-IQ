// Retrieval — the trust engine behind "answers only from your notes".
//
// Primary path is SEMANTIC: embed the question, cosine-rank it against the note
// chunk vectors stored at save time (see lib/embeddings.ts), and gate on absolute
// cosine similarity. This matches on meaning, not shared words — "how do plants make
// food from sunlight" finds a photosynthesis note that never uses those words.
//
// Fallback is LEXICAL (IDF-weighted keyword overlap): used only when embeddings are
// unavailable (offline, no credits, not configured) or a note isn't embedded yet, so
// nothing ever breaks. Empty result = the honest "not in your notes" — Ask must not
// call the model then. retrieveTopK's signature/return is unchanged, so chat.ts is untouched.

import { useNotesStore } from '@/store/use-notes-store';
import type { Note } from '@/types/note';
import type { NoteChunk, RetrievalHit, StoredChunk } from '@/types/retrieval';

import { btlEmbed, isBtlConfigured } from './btl';
import { chunkNote, cosineSimilarity, noteSearchableText } from './chunk';
import { getAllNoteChunks } from './db';
import { hashContent } from './hash';

// --- Grounding gates ---------------------------------------------------------
/** Semantic gate: min cosine similarity to count as a real match. Tuned live against
 *  text-embedding-3-small (2026-07-06): off-topic questions peaked at 0.18, real
 *  matches bottomed at 0.38 — 0.28 sits in that gap with ~0.1 margin each side, biased
 *  to admit real matches since the LLM's own "reply NOT_IN_NOTES" prompt backstops the rest. */
const COSINE_MIN = 0.28;
/** Lexical gate (fallback): minimum weighted-overlap score to count as a real match. */
const MIN_SCORE = 0.2;
/** Lexical relative gate: drop chunks below this fraction of the best lexical score. */
const REL_RATIO = 0.55;

// --- Lexical fallback: tokenizing + IDF-weighted overlap scoring --------------

// Stopwords carry no topic signal. Includes instructional filler ("explain",
// "define", …) common to exam questions, which would otherwise match anything.
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'for', 'is',
  'are', 'was', 'were', 'be', 'been', 'it', 'its', 'this', 'that', 'these', 'those',
  'as', 'by', 'with', 'from', 'into', 'about', 'what', 'which', 'who', 'how', 'why',
  'when', 'where', 'do', 'does', 'did', 'can', 'could', 'will', 'would', 'i', 'you',
  'me', 'my', 'we', 'they', 'them', 'their', 'so', 'if', 'then', 'than', 'there',
  // instructional / filler words
  'explain', 'define', 'describe', 'discuss', 'list', 'outline', 'summarize',
  'summarise', 'identify', 'state', 'give', 'tell', 'mention', 'provide', 'show',
  'main', 'also', 'using', 'use', 'used', 'some', 'any', 'many', 'much', 'more',
  'most', 'such', 'each', 'between', 'within', 'during', 'need', 'want', 'get',
]);

/** Light suffix folding so singular/plural & simple inflections match during
 *  retrieval ("communication" ↔ "communications", "studies" ↔ "study"). Only
 *  widens matching — it never invents overlap, so the grounding gate stays honest. */
function foldSuffix(token: string): string {
  if (token.length <= 4) return token; // too short to fold safely
  if (token.endsWith('ies')) return `${token.slice(0, -3)}y`; // studies → study
  if (token.endsWith('ss')) return token; // class, process — the 's' isn't a plural
  if (token.endsWith('s')) return token.slice(0, -1); // communications → communication
  return token;
}

/** Lowercase alphanumeric tokens, minus stopwords and single characters, each
 *  suffix-folded so a query matches a note that only differs by plural form. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(foldSuffix);
}

type Idf = { weight: Map<string, number>; fallback: number };

/** IDF across chunks: distinctive terms weigh high, filler low. `fallback` weights
 *  a query term absent from every note (correctly makes matching harder). */
function buildIdf(corpus: string[][]): Idf {
  const df = new Map<string, number>();
  for (const terms of corpus) {
    for (const t of new Set(terms)) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const n = corpus.length;
  const weight = new Map<string, number>();
  for (const [t, d] of df) weight.set(t, Math.log(1 + n / d));
  return { weight, fallback: Math.log(1 + n) };
}

// Weighted-overlap score in [0, 1]: question weight the chunk covers, plus a small
// density nudge. Matching the rare topic word beats matching several filler words.
function scoreChunk(queryTerms: Set<string>, chunkTerms: string[], idf: Idf): number {
  if (queryTerms.size === 0 || chunkTerms.length === 0) return 0;

  const counts = new Map<string, number>();
  for (const t of chunkTerms) counts.set(t, (counts.get(t) ?? 0) + 1);

  let totalWeight = 0;
  let matchedWeight = 0;
  let matchedHits = 0;
  for (const term of queryTerms) {
    const w = idf.weight.get(term) ?? idf.fallback;
    totalWeight += w;
    const c = counts.get(term) ?? 0;
    if (c > 0) {
      matchedWeight += w;
      matchedHits += c;
    }
  }
  if (totalWeight === 0) return 0;

  const coverage = matchedWeight / totalWeight;
  const density = Math.min(matchedHits / chunkTerms.length, 1);
  return coverage * 0.85 + density * 0.15;
}

/** Rank chunks against a question by lexical overlap, keeping only those past the gate. */
export function rankChunks(query: string, chunks: NoteChunk[]): RetrievalHit[] {
  const queryTerms = new Set(tokenize(query));
  if (queryTerms.size === 0) return [];

  const corpus = chunks.map((chunk) => tokenize(chunk.text));
  const idf = buildIdf(corpus);

  return chunks
    .map((chunk, i) => ({ ...chunk, score: scoreChunk(queryTerms, corpus[i], idf) }))
    .filter((hit) => hit.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);
}

/** Lexical top-K over a set of notes: chunk, keyword-rank, apply the absolute +
 *  relative gates. Synchronous — used as the fallback and for not-yet-embedded notes. */
export function lexicalTopK(query: string, notes: Note[], k = 4): RetrievalHit[] {
  const chunks = notes.flatMap(chunkNote);
  const ranked = rankChunks(query, chunks);
  if (ranked.length === 0) return [];
  const cutoff = ranked[0].score * REL_RATIO;
  return ranked.filter((hit) => hit.score >= cutoff).slice(0, k);
}

// --- Semantic (primary) path -------------------------------------------------

/** Cosine-rank stored vectors against the query. Returns null to signal "vectors
 *  unavailable — fall back to lexical"; a non-null result (even []) is authoritative,
 *  where [] is the honest "not in your notes". Notes not yet freshly embedded are
 *  covered lexically so a real note is never invisible during the embed window. */
async function vectorTopK(query: string, notes: Note[], k: number): Promise<RetrievalHit[] | null> {
  if (!isBtlConfigured()) return null;

  let queryVec: number[];
  try {
    [queryVec] = await btlEmbed([query]);
  } catch {
    return null; // offline / credits / server → lexical fallback
  }

  let stored: StoredChunk[];
  try {
    stored = await getAllNoteChunks();
  } catch {
    return null;
  }

  const byId = new Map(notes.map((n) => [n.id, n]));
  const freshHash = new Map(notes.map((n) => [n.id, hashContent(noteSearchableText(n))]));

  // Rank only chunks whose note still exists AND whose vector matches its current text.
  const embeddedFresh = new Set<string>();
  const vectorHits: RetrievalHit[] = [];
  for (const c of stored) {
    const note = byId.get(c.noteId);
    if (!note || c.contentHash !== freshHash.get(c.noteId)) continue;
    embeddedFresh.add(c.noteId);
    const score = cosineSimilarity(queryVec, c.embedding);
    if (score >= COSINE_MIN) {
      vectorHits.push({ noteId: c.noteId, noteTitle: note.title, text: c.text, score });
    }
  }
  vectorHits.sort((a, b) => b.score - a.score);

  // Just-saved / offline-saved / still-backfilling notes have no fresh vector yet —
  // cover them lexically so retrieval never "forgets" a note it hasn't embedded.
  const pending = notes.filter((n) => !embeddedFresh.has(n.id) && n.content.trim().length > 0);
  const lexicalHits = pending.length > 0 ? lexicalTopK(query, pending, k) : [];

  // Semantic hits first (stronger), lexical stand-ins after, capped at K.
  return [...vectorHits, ...lexicalHits].slice(0, k);
}

/** Top-K note chunks for a question, best-first. Returns `[]` when nothing clears the
 *  grounding gate — the caller shows the honest fallback. Semantic when embeddings are
 *  available, lexical otherwise. */
export async function retrieveTopK(query: string, k = 4): Promise<RetrievalHit[]> {
  const q = query.trim();
  const { notes } = useNotesStore.getState();
  if (!q || notes.length === 0) return [];

  const semantic = await vectorTopK(q, notes, k);
  if (semantic !== null) return semantic;

  // Embeddings unavailable → lexical over every note (the original behaviour).
  return lexicalTopK(q, notes, k);
}
