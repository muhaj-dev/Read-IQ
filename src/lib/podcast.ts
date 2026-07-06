// "From Your Notes" — turns ONE saved note into a two-host audio conversation,
// grounded ONLY in the note's text. No retrieval (single-note scope).
//
// FULL COVERAGE: a long note (a scanned lecture, an uploaded PDF, a big paste) is
// split into ordered segments that together span the WHOLE note, and each segment
// becomes its own grounded stretch of conversation — opening on the first, wrapping
// on the last, flowing in the middle. This is why the episode now discusses the end
// of the material, not just the introduction. Segments generate in parallel, each
// strictly grounded in its own slice, then merge into one episode cached by content
// hash in SQLite. Model replies are strict JSON we parse robustly.

import { getChatModel } from '@/store/use-settings-store';
import { HOSTS, type PodcastCoverage, type PodcastTurn } from '@/types/podcast';

import { btlPost } from './btl';
import { hashContent } from './hash';

// Re-exported so existing importers keep working now that hashContent moved to lib/hash.
export { hashContent };

/** Presenter identities (just names for the ear — never facts from the note). */
const HOST_A_NAME = HOSTS.A;
const HOST_B_NAME = HOSTS.B;

/** Below this the note is too thin to discuss — honest "add more" episode, no model call. */
const MIN_CONTENT_CHARS = 40;
/** Target chars per segment (~1k tokens of note) — one focused stretch of talk. */
const SEGMENT_CHAR_TARGET = 3500;
/** Hard cap on segments so a huge PDF can't fan out into unbounded calls/credits. */
const MAX_SEGMENTS = 8;
/** A segment below this is merged into its neighbour — avoids a padded mini-episode
 *  (and a wasted call) from a tiny trailing chunk. */
const MIN_SEGMENT_CHARS = 900;
/** Beyond this the note is clipped (rare — ~28k chars covers a long lecture). */
const TOTAL_CONTENT_BUDGET = SEGMENT_CHAR_TARGET * MAX_SEGMENTS;
/** Output ceiling per segment (~10–12 short turns). */
const SEGMENT_MAX_TOKENS = 1500;
/** Output ceiling for a single-segment (short) note — one thorough pass. */
const SINGLE_MAX_TOKENS = 2200;

/** What the scriptwriter returns (before we stamp noteId + hash + createdAt). */
export type EpisodeScript = {
  title: string;
  coverage: PodcastCoverage;
  turns: PodcastTurn[];
};

// The scriptwriter system prompt (position-agnostic — the flow for THIS segment is
// given per call in the user prompt).
const SYSTEM_PROMPT = `You are the scriptwriter for "From Your Notes" — a study podcast inside AI University Companion. You turn a student's saved note into a two-host audio conversation that the student LISTENS to (they never speak) to understand the material better.

THE TWO HOSTS
- HOST A (${HOST_A_NAME}) — the curious one. Drives the conversation: asks the questions a student would ask, checks understanding, pulls B back to what matters, and recaps.
- HOST B (${HOST_B_NAME}) — the explainer. Answers clearly and patiently, breaks ideas into simple steps, and uses only examples/analogies that appear in (or follow directly from) the note.
They are warm, encouraging tutors chatting on a podcast — never a dry lecture. (The host names are just presenter identity; they are NOT facts from the note.)

HOW A GOOD STRETCH SOUNDS
A poses a question, B explains, A reacts and pushes ("why does that matter?", "give me an example"), B answers. Sometimes B asks a question and answers it himself ("So why does this happen? Well…") so the listener hears the reasoning out loud. Once in a while A paraphrases ("so if I've got this right…") and B confirms or gently corrects — modelling self-checking.

COVER EVERYTHING IN THIS PART (this is critical)
- Work through ALL of the material in the text you are given — every key idea, definition, term, formula, example, and step, in the order it appears.
- Do NOT stop after the first idea. Do NOT only cover the introduction. Do NOT skip the later or harder parts. Keep going until the whole text for this part has been discussed.

ABSOLUTE GROUNDING RULE (never break this)
- Use ONLY the information in the text provided for this part. This app's whole promise is that it never makes things up.
- Never add facts, dates, names, definitions, or examples that are not in the text — not even true ones from general knowledge.

SOUND NATURAL (this is read aloud by text-to-speech)
- Write exactly what should be spoken, in plain spoken English.
- Add the human glue of real talk, as words: "right," "exactly," "ah, good question," "okay, so," "here's the thing."
- NO markdown, asterisks, bullet points, headings, or emoji.
- NO bracketed stage directions like [laughs] — a voice reads them literally. Express reactions as spoken words instead.
- Say it for the ear: "for example" not "e.g.", "percent" not "%", "and" not "&".
- Keep each turn to 1–3 short sentences so the voices trade often.

OUTPUT — return ONLY valid JSON, no commentary, exactly this shape:
{"title":"<=6-word episode title from the note topic","turns":[{"speaker":"A","text":"..."},{"speaker":"B","text":"..."}]}
Speakers alternate naturally — they need not strictly alternate every line.`;

/** Position-aware brief for one segment of the walk-through. */
function segmentUserPrompt(
  meta: { title: string; subject: string },
  segment: string,
  index: number,
  total: number,
): string {
  const { title, subject } = meta;
  let flow: string;
  let turnHint: string;

  if (total === 1) {
    flow =
      'This is a complete, short note. Open with a brief greeting that names the topic, walk through ALL of the material below in a natural back-and-forth, then finish with a short recap of the 2–3 things worth remembering and an encouraging sign-off.';
    turnHint = 'Aim for about 18 turns.';
  } else if (index === 0) {
    flow = `This is the OPENING part (part 1 of ${total}) of a longer episode. Open with a brief greeting that names the note's overall topic, then dig thoroughly into the material in THIS part. Do NOT wrap up or say goodbye — the conversation continues into the next part.`;
    turnHint = 'Aim for about 11 turns.';
  } else if (index === total - 1) {
    flow = `This is the FINAL part (part ${index + 1} of ${total}). The show is already underway — do NOT greet or re-introduce yourselves. Continue naturally, dig thoroughly into the material in THIS part, THEN finish with a short recap of the 2–3 biggest takeaways from the whole note and an encouraging sign-off.`;
    turnHint = 'Aim for about 12 turns.';
  } else {
    flow = `This is a MIDDLE part (part ${index + 1} of ${total}). The show is already underway — do NOT greet, do NOT re-introduce yourselves, do NOT recap earlier parts. Continue the conversation naturally and dig thoroughly into the material in THIS part only.`;
    turnHint = 'Aim for about 11 turns.';
  }

  return `Write this part of a study podcast episode. Use ONLY the text below — nothing else.

NOTE TITLE: ${title}
SUBJECT: ${subject}

${flow}
${turnHint}

TEXT FOR THIS PART:
"""
${segment}
"""`;
}

type ChatCompletion = { choices?: { message?: { content?: string } }[] };

/** Pull { title, turns } out of a model reply, tolerating ```json fences or stray
 *  prose around it. Empty turns array when nothing parseable is found. */
function parseReply(raw: string): { title: string; turns: PodcastTurn[] } {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) return { title: '', turns: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return { title: '', turns: [] };
  }
  if (!parsed || typeof parsed !== 'object') return { title: '', turns: [] };
  const obj = parsed as { title?: unknown; turns?: unknown };
  if (!Array.isArray(obj.turns)) return { title: '', turns: [] };

  const turns: PodcastTurn[] = [];
  for (const t of obj.turns) {
    if (!t || typeof t !== 'object') continue;
    const { speaker, text } = t as { speaker?: unknown; text?: unknown };
    const body = typeof text === 'string' ? text.trim() : '';
    if (!body) continue;
    turns.push({ speaker: speaker === 'B' ? 'B' : 'A', text: body });
  }
  const title = typeof obj.title === 'string' ? obj.title.trim() : '';
  return { title, turns };
}

/** Split an oversized paragraph into ≤chunkSize pieces on sentence boundaries (so a
 *  segment never cuts mid-sentence); a single monster sentence is hard-split as a
 *  last resort. Common for OCR/PDF text where paragraph breaks are sparse. */
function splitLongParagraph(para: string, chunkSize: number): string[] {
  const sentences = para.match(/[^.!?]+[.!?]+[\s]*|[^.!?]+$/g) ?? [para];
  const out: string[] = [];
  let buf = '';
  for (const s of sentences) {
    if (s.length >= chunkSize) {
      if (buf.trim()) out.push(buf.trim());
      buf = '';
      for (let i = 0; i < s.length; i += chunkSize) out.push(s.slice(i, i + chunkSize).trim());
      continue;
    }
    if (buf && buf.length + s.length > chunkSize) {
      out.push(buf.trim());
      buf = '';
    }
    buf += s;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/** Merge undersized chunks into a neighbour so every segment is worth a call. */
function coalesce(chunks: string[]): string[] {
  if (chunks.length <= 1) return chunks;
  const out = [chunks[0]];
  for (let i = 1; i < chunks.length; i += 1) {
    const prev = out[out.length - 1];
    if (chunks[i].length < MIN_SEGMENT_CHARS || prev.length < MIN_SEGMENT_CHARS) {
      out[out.length - 1] = `${prev}\n\n${chunks[i]}`;
    } else {
      out.push(chunks[i]);
    }
  }
  return out;
}

/** Split the note into ordered chunks that together span the WHOLE note (clipped to
 *  the total budget). Packs on paragraph then sentence boundaries so segments stay
 *  coherent and evenly sized. Count is bounded by MAX_SEGMENTS. */
function segmentContent(content: string): string[] {
  const clipped =
    content.length > TOTAL_CONTENT_BUDGET ? content.slice(0, TOTAL_CONTENT_BUDGET) : content;
  const len = clipped.length;
  const desired = Math.min(MAX_SEGMENTS, Math.max(1, Math.round(len / SEGMENT_CHAR_TARGET)));
  if (desired <= 1) return [clipped];

  const chunkSize = Math.ceil(len / desired);
  const paras = clipped.split(/\n{2,}/);
  const chunks: string[] = [];
  let buf = '';
  const flush = () => {
    if (buf.trim()) chunks.push(buf.trim());
    buf = '';
  };

  for (const para of paras) {
    if (para.length >= chunkSize) {
      flush(); // oversized paragraph: emit current buffer, then sentence-split this one
      for (const piece of splitLongParagraph(para, chunkSize)) chunks.push(piece);
      continue;
    }
    if (buf && buf.length + para.length + 2 > chunkSize) flush();
    buf += (buf ? '\n\n' : '') + para;
  }
  flush();

  const merged = coalesce(chunks);
  // Packing can overshoot the target count — merge the tail back down.
  if (merged.length > MAX_SEGMENTS) {
    const head = merged.slice(0, MAX_SEGMENTS - 1);
    head.push(merged.slice(MAX_SEGMENTS - 1).join('\n\n'));
    return head;
  }
  return merged.length ? merged : [clipped];
}

/** The honest, credit-free episode for a near-empty note: hosts nudge to add more. */
function thinNoteEpisode(title: string): EpisodeScript {
  const topic = title.trim() || 'this note';
  return {
    title: topic.length > 40 ? `${topic.slice(0, 38).trimEnd()}…` : topic,
    coverage: 'partial',
    turns: [
      { speaker: 'A', text: `Hey, welcome to From Your Notes. Today we're looking at ${topic}.` },
      {
        speaker: 'B',
        text:
          "Right, though heads up — this note is only a few lines so far, so there isn't much for us to dig into yet.",
      },
      {
        speaker: 'A',
        text:
          'Exactly. So the best next step is to add a bit more to it — paste in the full lecture, or your own notes on the topic.',
      },
      {
        speaker: 'B',
        text: "Then come back and we'll talk it through properly. See you soon.",
      },
    ],
  };
}

/** Generate one grounded segment of conversation. Throws BtlError on a call failure. */
async function generateSegment(
  meta: { title: string; subject: string },
  segment: string,
  index: number,
  total: number,
): Promise<{ title: string; turns: PodcastTurn[] }> {
  // Plain chat + robust parser, not a `response_format` field (unverified here, could 400).
  const res = await btlPost<ChatCompletion>('chat/completions', {
    model: getChatModel(),
    temperature: 0.6, // warmer than Ask — the hosts should sound alive, not clinical
    max_tokens: total === 1 ? SINGLE_MAX_TOKENS : SEGMENT_MAX_TOKENS,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: segmentUserPrompt(meta, segment, index, total) },
    ],
  });
  return parseReply(res.choices?.[0]?.message?.content ?? '');
}

/** Write a grounded episode that covers the WHOLE note (ONLY its text). Near-empty
 *  notes short-circuit to the thin-note episode. Throws BtlError only when EVERY
 *  segment fails; a partial drop still returns the segments that succeeded. */
export async function generateEpisodeScript(note: {
  title: string;
  subject: string | null;
  content: string;
}): Promise<EpisodeScript> {
  const content = note.content.trim();
  const title = note.title.trim() || 'Your note';

  if (content.length < MIN_CONTENT_CHARS) return thinNoteEpisode(title);

  const segments = segmentContent(content);
  const meta = { title, subject: note.subject ?? 'General' };

  // Segments are independent (each grounded in its own slice) → generate together.
  const results = await Promise.allSettled(
    segments.map((seg, i) => generateSegment(meta, seg, i, segments.length)),
  );

  const turns: PodcastTurn[] = [];
  let episodeTitle = '';
  let anyOk = false;
  results.forEach((r, i) => {
    if (r.status !== 'fulfilled') return;
    anyOk = true;
    if (i === 0 && r.value.title) episodeTitle = r.value.title;
    turns.push(...r.value.turns);
  });

  // Every segment failed (network / credits) — surface it so the store shows friendly copy.
  if (!anyOk) {
    const firstErr = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
    throw firstErr?.reason ?? new Error('Episode generation failed.');
  }
  // Parsed to nothing (rare with JSON output) — fall back honestly rather than error.
  if (turns.length === 0) return thinNoteEpisode(title);

  return { title: episodeTitle || title, coverage: 'full', turns };
}
