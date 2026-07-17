// Grounded Ask ★ — answers ONLY from retrieved notes, gated: no hit → honest
// fallback, no model call. Grounded answers carry source citations; a declined
// answer drops its citations so a non-answer is never tagged "from your notes".

import { useNotesStore } from '@/store/use-notes-store';
import { getChatModel } from '@/store/use-settings-store';
import type { Citation } from '@/types/chat';
import type { RetrievalHit } from '@/types/retrieval';

import { aiChatStream, aiPost, AiError } from './ai';
import { retrieveTopK } from './retrieval';

/** The decline sentence — used identically as prompt instruction, fallback, and detector. */
export const NOT_IN_NOTES = "I don't have that in your notes yet.";

/** Shown when the student hasn't saved a single note yet (nudge to add one). */
export const NO_NOTES_YET =
  "You haven't saved any notes yet. Add your first note and I'll answer straight from it.";

/** Model's "nothing further" marker on "Generate more" — lets the UI retire the button. */
const NOTHING_MORE = 'NOTHING_MORE';

/** How many note chunks feed the answer. */
const RETRIEVE_K = 8;
/** Output ceiling (~500 words) — first answer is a short study briefing. */
const ANSWER_MAX_TOKENS = 700;
/** Source-text budget in chars (~5k tokens); feeds full note bodies, best-first, clipped. */
const CONTEXT_CHAR_BUDGET = 20000;

const SYSTEM_PROMPT =
  'You are readIQ, a calm university study companion. Answer the student\'s ' +
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
  /** Hit the length cap mid-answer — UI offers "Generate more". */
  truncated: boolean;
};

type ChatCompletion = {
  choices?: { message?: { content?: string }; finish_reason?: string | null }[];
};

/** A generated answer plus whether it was cut off at the token cap. */
type Answer = { content: string; truncated: boolean };

/** Rough token count (words vs chars, larger) for the non-streaming fallback. */
function estimateTokens(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(Math.ceil(words / 0.75), Math.ceil(text.length / 4));
}

/** Was the answer cut off at the cap? btl-2 mislabels `finish_reason`, so also
 *  check emitted `tokens` (streaming) or a length estimate (non-streaming). */
function isTruncated(text: string, finishReason: string | null, tokens?: number): boolean {
  if (finishReason === 'length') return true;
  // Emitted tokens landing within a few of the cap ⇒ the model was still going.
  if (tokens !== undefined) return tokens >= ANSWER_MAX_TOKENS - 8;
  return estimateTokens(text) >= ANSWER_MAX_TOKENS * 0.9;
}

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };

/** Numbered grounded context: each matched note's full body, best-first, clipped to budget. */
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
  return { model: getChatModel(), temperature: 0.2, max_tokens: ANSWER_MAX_TOKENS, messages };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A transient failure worth retrying (5xx or dropped connection), unlike auth/credits. */
function isTransient(err: unknown): err is AiError {
  return err instanceof AiError && (err.kind === 'server' || err.kind === 'network');
}

/** Answer a prepared request: attempt 1 streams; a pre-token transient failure
 *  falls back to a non-streaming completion. Never retries once tokens streamed. */
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
        const { text, finishReason, tokens } = await aiChatStream(request, emit, signal);
        const content = text.trim();
        return { content, truncated: isTruncated(content, finishReason, tokens) };
      }
      const res = await aiPost<ChatCompletion>('chat/completions', request, signal);
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

/** Answer a question strictly from saved notes. `onToken` streams deltas; throws BtlError on failure. */
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
  // A declined ("not in your notes") reply isn't grounded: no tags, no "Generate more".
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

/** Continue a cut-off grounded answer ("Generate more"): carries on from the same
 *  notes without repeating; empty + `exhausted` when nothing's left. Throws BtlError. */
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
  'You are readIQ, a helpful university study companion. The student has explicitly ' +
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

/** A general-knowledge answer for the opt-in "beyond your notes" path — not grounded. */
export type BeyondResult = { content: string; truncated: boolean };

/** Answer from general knowledge (opt-in only), ending with References. Throws BtlError. */
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

// ── Attached-image answers ──────────────────────────────────────────────────
// A photo attached to a question is the student's OWN material, so it's a valid
// grounding source. Two paths: if the image's topic is already in their notes we
// answer strictly from notes + image (grounded, cited); if it isn't, the store
// asks the student whether to save it, then we answer from the image itself.

/** A blank/short question with an image means "read this photo and explain it". */
const DEFAULT_IMAGE_QUESTION = 'Explain what this image shows.';

const IMAGE_GROUNDED_SYSTEM_PROMPT =
  SYSTEM_PROMPT +
  '\n\nThe student also attached an IMAGE; its text is given as source [IMG]. Treat ' +
  'it exactly like the notes — a real source you may answer from — but still never ' +
  'add outside facts beyond what the notes and the image actually say.';

const IMAGE_OPEN_SYSTEM_PROMPT =
  'You are readIQ, a calm university study companion. The student attached an image ' +
  'that is NOT in their saved notes. Use the text read out of that image (below) as ' +
  'your PRIMARY source, and you MAY draw on general knowledge to explain it clearly ' +
  'and accurately — be honest that this goes beyond their saved notes.\n\n' +
  'Keep it SHORT and readable — aim for about 250 words, never exceed 400. Open with ' +
  'one or two sentences that answer directly, then the key points. Put each key term ' +
  'on its own line in bold ("**Term**") followed by a short one-line meaning. Bold ' +
  'only the most important terms. No "#" headings, no padding.';

export type ImageAskResult = AskResult & { fromImage: true };

/** Answer strictly from the student's notes AND their attached image. Returns null
 *  when the topic isn't in the notes (the store then offers to save the image). */
export async function answerImageGrounded(
  question: string,
  imageText: string,
  opts: { onToken?: (delta: string) => void; signal?: AbortSignal } = {},
): Promise<ImageAskResult | null> {
  const q = question.trim() || DEFAULT_IMAGE_QUESTION;
  const hits = await retrieveTopK(q, RETRIEVE_K);
  if (hits.length === 0) return null; // not in notes → caller asks to save it

  const context = `[IMG] Attached image\n${imageText.trim()}\n\n${buildContext(hits)}`;
  const request = chatRequest([
    { role: 'system', content: IMAGE_GROUNDED_SYSTEM_PROMPT },
    { role: 'user', content: `Notes:\n${context}\n\nQuestion: ${q}` },
  ]);
  const { content, truncated } = await generateAnswer(request, opts.onToken, opts.signal);
  const declined = content.toLowerCase().startsWith("i don't have that in your notes");
  if (!content || declined) {
    return { grounded: false, content: content || NOT_IN_NOTES, citations: [], truncated: false, fromImage: true };
  }
  return { grounded: true, content, citations: toCitations(hits), truncated, fromImage: true };
}

/** Answer from the attached image's text (+ general knowledge to explain it), for a
 *  topic not in the notes — used after the student picks "save" or "answer once". */
export async function answerImageOpen(
  question: string,
  imageText: string,
  opts: { onToken?: (delta: string) => void; signal?: AbortSignal } = {},
): Promise<BeyondResult> {
  const q = question.trim() || DEFAULT_IMAGE_QUESTION;
  const request = chatRequest([
    { role: 'system', content: IMAGE_OPEN_SYSTEM_PROMPT },
    { role: 'user', content: `Text read from the image:\n${imageText.trim()}\n\nQuestion: ${q}` },
  ]);
  return generateAnswer(request, opts.onToken, opts.signal);
}
