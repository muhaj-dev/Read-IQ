// Grounded Ask ★ — the star feature. Answers come ONLY from the student's own
// retrieved notes, and every grounded answer carries the source notes as
// citations (the "📌 From your notes" tags).
//
// The flow (see AGENTS.md → Retrieval & Grounding Rules):
//   1. retrieve the top note chunks for the question (lexical — lib/retrieval)
//   2. if NOTHING clears the gate → return the honest fallback WITHOUT calling the
//      model (this saves BTL credits and is the trust promise in action)
//   3. otherwise stream the answer with the retrieved chunks as the SOLE context
//   4. return the source notes as citations
//
// The model is also told to decline when the chunks don't actually answer; if it
// does, we drop the citations so a non-answer is never tagged as "from your notes".

import { useNotesStore } from '@/store/use-notes-store';
import type { Citation } from '@/types/chat';
import type { RetrievalHit } from '@/types/retrieval';

import { btlChatStream, btlPost, BtlError, DEFAULT_CHAT_MODEL } from './btl';
import { retrieveTopK } from './retrieval';

/** The exact sentence the model is told to use — and the fallback we show — when
 *  the notes don't cover the question. Kept identical everywhere so we can detect
 *  a declined answer and strip its citations. */
export const NOT_IN_NOTES = "I don't have that in your notes yet.";

/** Shown when the student hasn't saved a single note yet (nudge to add one). */
export const NO_NOTES_YET =
  "You haven't saved any notes yet. Add your first note and I'll answer straight from it.";

/** The marker the model replies with on "Generate more" when the notes hold
 *  nothing further — lets the UI retire the button instead of looping. */
const NOTHING_MORE = 'NOTHING_MORE';

/** How many note chunks feed the answer. Wider than a one-line lookup so a full
 *  "explain this topic" question has enough grounded material to answer in depth
 *  (the relative gate in retrieval still drops weakly-related chunks). */
const RETRIEVE_K = 8;
/** Output ceiling ≈ 500 words. The first answer is deliberately a short, focused
 *  study briefing (summary + what to revise) — not a wall of text that bores a
 *  tired student. The deeper detail is pulled in on demand via "Generate more". */
const ANSWER_MAX_TOKENS = 700;
/** How much SOURCE text (across all matched notes) we hand the model, in chars
 *  (~5k tokens). Retrieval finds the relevant notes; we then feed their FULL
 *  content — the extracted PDF / file text lives in the note body — so the answer
 *  is drawn from the whole note, not just the few chunks that matched. Best-
 *  matching notes fill the budget first; an over-long note is clipped, not dropped. */
const CONTEXT_CHAR_BUDGET = 20000;

const SYSTEM_PROMPT =
  'You are noteIQ, a calm university study companion. Answer the student\'s ' +
  'question using ONLY the numbered notes provided below. If the notes do not ' +
  `contain the answer, reply exactly: "${NOT_IN_NOTES}" and nothing else. Never ` +
  'use outside knowledge and never invent facts.\n\n' +
  'Keep this FIRST answer SHORT — a quick, focused study briefing the student can ' +
  'read in under a minute: aim for about 300 words and never exceed 500. Do NOT ' +
  'dump everything the notes contain; the student can tap "Generate more" for the ' +
  'deeper detail. Your job here is to orient them and point them at what matters — ' +
  'not to teach the whole topic. A tired student should feel oriented, not buried.\n\n' +
  'Give, drawn ONLY from the notes:\n' +
  '- A one- or two-sentence plain-paragraph summary of what the topic is about.\n' +
  '- The handful of key points that matter most — what to focus on and revise ' +
  'first. Put each key term on its own line in bold — e.g. "**Light-Dependent**" — ' +
  'immediately followed on the next line by a SHORT one-line explanation FROM THE ' +
  'NOTES. This renders as a definition card, so use that shape for each essential.\n' +
  '- If the notes make clear what is most important or most examinable, say so ' +
  'plainly in a closing sentence.\n\n' +
  'Only state what the notes ACTUALLY say — never add outside facts, examples, or ' +
  'definitions. If a note only NAMES a concept without explaining it, you may note ' +
  'it is covered but MUST NOT define it from your own knowledge. When unsure whether ' +
  'a detail is in the notes, leave it out. If the notes only touch on the topic ' +
  'briefly, keep the answer correspondingly short. Never pad, never repeat.\n\n' +
  'Format so a tired student can read it clearly:\n' +
  '- Open with the one/two-sentence summary as a plain paragraph.\n' +
  '- Then the key points as bold "**Term**" lines, each followed by a short meaning.\n' +
  '- Use a "- " bullet list ONLY for a genuine short list; a numbered list ("1. ", ' +
  '"2. ") only for a real step-by-step sequence. Keep any list tight.\n' +
  '- Bold key terms with **double asterisks**.\n' +
  '- No preamble, and do NOT use markdown "#" headings.';

export type AskResult = {
  /** True only when a real answer was drawn from retrieved notes. */
  grounded: boolean;
  content: string;
  citations: Citation[];
  /** The model hit the length cap mid-answer — there is more it could say, so the
   *  UI offers "Generate more". Never true for a fallback or a declined answer. */
  truncated: boolean;
};

type ChatCompletion = {
  choices?: { message?: { content?: string }; finish_reason?: string | null }[];
};

/** A generated answer plus whether it was cut off at the token cap. */
type Answer = { content: string; truncated: boolean };

/** Rough token count of an answer, for the non-streaming fallback (which carries
 *  no per-delta count). Estimates from words (~0.75 words/token) and chars (~4
 *  chars/token), taking the larger — biasing toward detecting a cut-off. */
function estimateTokens(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(Math.ceil(words / 0.75), Math.ceil(text.length / 4));
}

/**
 * Was the answer cut off at the length cap? btl-2 mislabels `finish_reason` as
 * 'stop' even when it stops at `max_tokens` (verified live), so we can't trust it
 * alone. On the streaming path we pass the emitted token count (~1 per delta),
 * which lands right at the cap on a real cut-off; the non-streaming fallback has
 * no such count, so it falls back to a length estimate. A rare false positive is
 * harmless — "Generate more" then gets the "nothing more" reply and retires.
 */
function isTruncated(text: string, finishReason: string | null, tokens?: number): boolean {
  if (finishReason === 'length') return true;
  // Emitted tokens landing within a few of the cap ⇒ the model was still going.
  if (tokens !== undefined) return tokens >= ANSWER_MAX_TOKENS - 8;
  return estimateTokens(text) >= ANSWER_MAX_TOKENS * 0.9;
}

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };

/**
 * The grounded context handed to the model: each unique matched note's FULL
 * content (best match first), numbered so citations line up. Retrieval located the
 * relevant notes; here we widen from the matched chunks to the whole note body —
 * which already contains any extracted PDF / uploaded-file text — so the answer can
 * be complete. Content is clipped to {@link CONTEXT_CHAR_BUDGET} best-first; the
 * matched chunk is used as a fallback if a note somehow isn't in the store.
 */
function buildContext(hits: RetrievalHit[]): string {
  const byId = new Map(useNotesStore.getState().notes.map((n) => [n.id, n]));
  const parts: string[] = [];
  const seen = new Set<string>();
  let used = 0;

  for (const hit of hits) {
    if (seen.has(hit.noteId) || used >= CONTEXT_CHAR_BUDGET) continue;
    seen.add(hit.noteId);
    const note = byId.get(hit.noteId);
    const title = note?.title ?? hit.noteTitle;
    const body = (note?.content ?? hit.text).trim();
    const room = CONTEXT_CHAR_BUDGET - used;
    const clipped = body.length > room ? `${body.slice(0, room)}…` : body;
    const block = `[${parts.length + 1}] ${title}\n${clipped}`;
    parts.push(block);
    used += block.length;
  }
  return parts.join('\n\n');
}

/** The shared OpenAI-compatible request body for a grounded answer. */
function chatRequest(messages: ChatMsg[]): Record<string, unknown> {
  return { model: DEFAULT_CHAT_MODEL, temperature: 0.2, max_tokens: ANSWER_MAX_TOKENS, messages };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A transient runtime failure worth retrying (a 5xx gateway hiccup or a dropped
 *  connection) — as opposed to auth / credits / not-configured, which won't fix
 *  themselves on a retry. */
function isTransient(err: unknown): err is BtlError {
  return err instanceof BtlError && (err.kind === 'server' || err.kind === 'network');
}

/**
 * Get the answer text for a prepared chat request, resilient to the BTL runtime's
 * intermittent streaming 500s.
 *
 * Attempt 1 streams (the hero moment — the answer types itself out). If that fails
 * transiently BEFORE any token arrives, fall back to a normal non-streaming
 * completion, which the gateway serves far more reliably; the whole answer then
 * appears at once after the typing indicator. Once tokens have streamed we never
 * retry (it would duplicate them) — the error surfaces instead.
 */
async function generateAnswer(
  request: Record<string, unknown>,
  onToken: ((delta: string) => void) | undefined,
  signal: AbortSignal | undefined,
): Promise<Answer> {
  let emitted = false;
  const emit = (delta: string) => {
    emitted = true;
    onToken?.(delta);
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      if (attempt === 0) {
        const { text, finishReason, tokens } = await btlChatStream(request, emit, signal);
        const content = text.trim();
        return { content, truncated: isTruncated(content, finishReason, tokens) };
      }
      const res = await btlPost<ChatCompletion>('chat/completions', request, signal);
      const choice = res.choices?.[0];
      const content = (choice?.message?.content ?? '').trim();
      return { content, truncated: isTruncated(content, choice?.finish_reason ?? null) };
    } catch (err) {
      const lastAttempt = attempt === 2;
      if (emitted || !isTransient(err) || lastAttempt) throw err;
      await delay(500); // brief backoff, then retry as a non-streaming call
    }
  }
  return { content: '', truncated: false }; // unreachable — loop returns or throws
}

/** Build one citation per unique source note (hits arrive best-first). */
function toCitations(hits: RetrievalHit[]): Citation[] {
  const seen = new Set<string>();
  const citations: Citation[] = [];
  for (const hit of hits) {
    if (seen.has(hit.noteId)) continue;
    seen.add(hit.noteId);
    citations.push({
      noteId: hit.noteId,
      noteTitle: hit.noteTitle,
      snippet: hit.text.slice(0, 160).trim(),
    });
  }
  return citations;
}

/**
 * Answer a question strictly from the student's saved notes.
 *
 * `onToken` receives each streamed delta so the UI can type the answer out live;
 * `signal` cancels an in-flight stream. Resolves to an {@link AskResult}; throws a
 * BtlError only on a runtime failure (the caller shows `.friendly`).
 */
export async function askFromNotes(
  question: string,
  opts: { onToken?: (delta: string) => void; signal?: AbortSignal } = {},
): Promise<AskResult> {
  const q = question.trim();
  if (!q) return { grounded: false, content: NOT_IN_NOTES, citations: [], truncated: false };

  // The gate: retrieve first. No hit → no model call, honest fallback.
  const hits = await retrieveTopK(q, RETRIEVE_K);
  if (hits.length === 0) {
    const hasNotes = useNotesStore.getState().notes.length > 0;
    const content = hasNotes ? NOT_IN_NOTES : NO_NOTES_YET;
    return { grounded: false, content, citations: [], truncated: false };
  }

  const request = chatRequest([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Notes:\n${buildContext(hits)}\n\nQuestion: ${q}` },
  ]);
  const { content, truncated } = await generateAnswer(request, opts.onToken, opts.signal);
  // Honour the model declining: an empty or "not in your notes" reply is NOT
  // grounded, so we show no source tags (and no "Generate more") under it.
  const declined = content.toLowerCase().startsWith("i don't have that in your notes");
  if (!content || declined) {
    return { grounded: false, content: content || NOT_IN_NOTES, citations: [], truncated: false };
  }

  return { grounded: true, content, citations: toCitations(hits), truncated };
}

export type ContinueResult = AskResult & {
  /** The notes hold no further detail worth adding — the UI hides "Generate more". */
  exhausted: boolean;
};

/**
 * Continue a grounded answer that was cut off at the length cap — powers
 * "Generate more". Re-retrieves the same notes and asks the model to carry on
 * strictly from them WITHOUT repeating what it already wrote. Resolves with only
 * the new text (empty + `exhausted` when there is nothing left to add). Throws a
 * BtlError on a runtime failure, exactly like {@link askFromNotes}.
 */
export async function continueAnswer(
  question: string,
  priorAnswer: string,
  opts: { onToken?: (delta: string) => void; signal?: AbortSignal } = {},
): Promise<ContinueResult> {
  const q = question.trim();
  const hits = await retrieveTopK(q, RETRIEVE_K);
  if (hits.length === 0) {
    return { grounded: false, content: '', citations: [], truncated: false, exhausted: true };
  }

  const request = chatRequest([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Notes:\n${buildContext(hits)}\n\nQuestion: ${q}` },
    { role: 'assistant', content: priorAnswer },
    {
      role: 'user',
      content:
        'The student wants more, so go DEEPER now. Continue using ONLY the notes: ' +
        'explain the detail your short briefing above left out — the how and why, ' +
        'the remaining key points, and any steps or examples the notes contain. Do ' +
        'not repeat anything above; start mid-flow with no reintroduction. Keep it ' +
        'readable (about 400 words). If the notes hold nothing more worth adding, ' +
        `reply exactly: "${NOTHING_MORE}".`,
    },
  ]);
  const { content, truncated } = await generateAnswer(request, opts.onToken, opts.signal);
  const exhausted = !content || content.trim().toUpperCase().startsWith(NOTHING_MORE);
  const citations = toCitations(hits);
  if (exhausted) {
    return { grounded: true, content: '', citations, truncated: false, exhausted: true };
  }
  return { grounded: true, content, citations, truncated, exhausted: false };
}

const BEYOND_SYSTEM_PROMPT =
  'You are noteIQ, a helpful university study companion. The student has explicitly ' +
  'asked for help BEYOND their saved notes, so answer from your own general ' +
  'knowledge.\n\n' +
  'Keep it SHORT and precise — a quick, easy-to-read explanation the student can ' +
  'grasp fast. Aim for about 200 words and never exceed 350. Get straight to the ' +
  'point; do not pad.\n\n' +
  'Write in plain, simple language:\n' +
  '- Open with one or two sentences that directly answer the question.\n' +
  '- If it helps, add a short "- " bullet list of the key points — keep each bullet ' +
  'to one tight line.\n' +
  '- Bold only the one or two most important terms with **double asterisks**. No ' +
  '"#" headings, no long paragraphs, no "**Term**"-on-its-own-line definition cards.\n\n' +
  'Finish with a line that is exactly "References:" followed by a short "- " list of ' +
  'the real, well-known sources your explanation draws on (a standard textbook, an ' +
  'established encyclopaedia, or a widely-accepted body of knowledge). Only list ' +
  'sources you are genuinely confident exist — never fabricate specific citations, ' +
  'authors, page numbers, or URLs.';

/** A general-knowledge answer for the opt-in "answer from outside your notes" path.
 *  Not grounded in the student's notes — the UI marks it clearly as such and shows
 *  the References the model listed. */
export type BeyondResult = { content: string; truncated: boolean };

/**
 * Answer a question from the model's GENERAL KNOWLEDGE, outside the student's
 * notes — only ever called when the student explicitly opts in. The answer ends
 * with a References section and is rendered under a distinct "Beyond your notes"
 * header so the "From your notes" trust promise is never diluted. Throws a
 * BtlError on a runtime failure, like {@link askFromNotes}.
 */
export async function answerBeyondNotes(
  question: string,
  opts: { onToken?: (delta: string) => void; signal?: AbortSignal } = {},
): Promise<BeyondResult> {
  const request = chatRequest([
    { role: 'system', content: BEYOND_SYSTEM_PROMPT },
    { role: 'user', content: question.trim() },
  ]);
  return generateAnswer(request, opts.onToken, opts.signal);
}
