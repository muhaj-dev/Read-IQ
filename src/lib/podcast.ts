// "From Your Notes" — turns ONE saved note into a two-host audio conversation,
// grounded ONLY in the note's text. No retrieval (single-note scope); the model
// returns strict JSON we parse robustly, cached in SQLite by content hash.

import { getChatModel } from '@/store/use-settings-store';
import { HOSTS, type PodcastCoverage, type PodcastTurn } from '@/types/podcast';

import { btlPost } from './btl';
import { hashContent } from './hash';

// Re-exported so existing importers keep working now that hashContent moved to lib/hash.
export { hashContent };

/** Presenter identities (just names for the ear — never facts from the note). */
const HOST_A_NAME = HOSTS.A;
const HOST_B_NAME = HOSTS.B;
/** Episode shape targets (about 2–3 minutes of audio once spoken). */
const TARGET_TURNS = 16;
const TARGET_MINUTES = '2–3';

/** Below this the note is too thin to discuss — honest "add more" episode, no model call. */
const MIN_CONTENT_CHARS = 40;
/** How much of the note the scriptwriter gets (~5k tokens); a long note is clipped. */
const CONTENT_CHAR_BUDGET = 16000;
/** Output ceiling — ~16 short turns fit well under this; a thin note uses less. */
const SCRIPT_MAX_TOKENS = 1600;

/** What the scriptwriter returns (before we stamp noteId + hash + createdAt). */
export type EpisodeScript = {
  title: string;
  coverage: PodcastCoverage;
  turns: PodcastTurn[];
};

// The scriptwriter system prompt.
const SYSTEM_PROMPT = `You are the scriptwriter for "From Your Notes" — a short AI study podcast inside AI University Companion. You turn ONE student's saved note into a two-host audio conversation that the student LISTENS to (they never speak) to understand the material better.

THE TWO HOSTS
- HOST A (${HOST_A_NAME}) — the curious one. Drives the conversation: asks the questions a student would ask, checks understanding, pulls B back to what matters, and recaps.
- HOST B (${HOST_B_NAME}) — the explainer. Answers clearly and patiently, breaks ideas into simple steps, and uses only examples/analogies that appear in (or follow directly from) the note.
They are warm, encouraging tutors chatting on a podcast — never a dry lecture. (The host names are just presenter identity; they are NOT facts from the note.)

THE FLOW — the shape of every episode
1. Cold open: A greets the listener and names the note's topic in one sentence.
2. Body: a real back-and-forth. A poses a question, B explains, A reacts and pushes ("why does that matter?", "give me an example"), B answers. Sometimes B asks a question and answers it himself ("So why does this happen? Well…") so the listener hears the reasoning out loud. Move through the note's key ideas in a logical order.
3. Understanding check: once or twice, A paraphrases ("so if I've got this right…") and B confirms or gently corrects — modelling how to self-check.
4. Wrap-up: A recaps the 2–3 things worth remembering, in plain words, and signs off encouragingly.
The student is only ever a listener — never address them a question to answer.

ABSOLUTE GROUNDING RULE (never break this)
- Use ONLY the information in the note provided. This app's whole promise is that it never makes things up.
- Never add facts, dates, names, definitions, or examples that are not in the note — not even true ones from general knowledge.
- If the note is short or thin, keep the episode short. Do not pad it.
- If the note doesn't contain enough to discuss, return a brief, honest episode where the hosts say the note is only a few lines so far and gently suggest the student add more — and set "coverage" to "partial".

SOUND NATURAL (this is read aloud by text-to-speech)
- Write exactly what should be spoken, in plain spoken English.
- Add the human glue of real talk, as words: "right," "exactly," "ah, good question," "okay, so," "here's the thing." This makes the two voices feel alive.
- NO markdown, asterisks, bullet points, headings, or emoji.
- NO bracketed stage directions like [laughs] — a voice reads them literally. Express reactions as spoken words instead.
- Say it for the ear: "for example" not "e.g.", "percent" not "%", "and" not "&".
- Keep each turn to 1–3 short sentences so the voices trade often.

OUTPUT — return ONLY valid JSON, no commentary, exactly this shape:
{"title":"<=6-word episode title from the note topic","coverage":"full"|"partial","turns":[{"speaker":"A","text":"..."},{"speaker":"B","text":"..."}]}
Aim for about ${TARGET_TURNS} turns (~${TARGET_MINUTES} minutes of audio). Speakers alternate naturally — they need not strictly alternate every line.`;

function userPrompt(title: string, subject: string, content: string): string {
  return `Make a study podcast episode from this note. Use ONLY what is below.

NOTE TITLE: ${title}
SUBJECT: ${subject}

NOTE CONTENT:
"""
${content}
"""`;
}

type ChatCompletion = { choices?: { message?: { content?: string } }[] };

/** Pull the JSON object out of a model reply, tolerating ```json fences or stray
 *  prose around it. Returns null if nothing parseable is found. */
function parseScript(raw: string): EpisodeScript | null {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const obj = parsed as { title?: unknown; coverage?: unknown; turns?: unknown };
  if (!Array.isArray(obj.turns)) return null;

  const turns: PodcastTurn[] = [];
  for (const t of obj.turns) {
    if (!t || typeof t !== 'object') continue;
    const { speaker, text } = t as { speaker?: unknown; text?: unknown };
    const body = typeof text === 'string' ? text.trim() : '';
    if (!body) continue;
    turns.push({ speaker: speaker === 'B' ? 'B' : 'A', text: body });
  }
  if (turns.length === 0) return null;

  const title = typeof obj.title === 'string' && obj.title.trim() ? obj.title.trim() : '';
  const coverage: PodcastCoverage = obj.coverage === 'partial' ? 'partial' : 'full';
  return { title, coverage, turns };
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

/** Write a grounded episode script from a note (ONLY its text). Near-empty notes
 *  short-circuit to the thin-note episode; unparseable replies do too. Throws BtlError. */
export async function generateEpisodeScript(note: {
  title: string;
  subject: string | null;
  content: string;
}): Promise<EpisodeScript> {
  const content = note.content.trim();
  const title = note.title.trim() || 'Your note';

  if (content.length < MIN_CONTENT_CHARS) return thinNoteEpisode(title);

  const clipped =
    content.length > CONTENT_CHAR_BUDGET ? `${content.slice(0, CONTENT_CHAR_BUDGET)}…` : content;

  // Plain chat + robust parser, not a `response_format` field (unverified here, could 400).
  const res = await btlPost<ChatCompletion>('chat/completions', {
    model: getChatModel(),
    temperature: 0.6, // warmer than Ask — the hosts should sound alive, not clinical
    max_tokens: SCRIPT_MAX_TOKENS,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt(title, note.subject ?? 'General', clipped) },
    ],
  });

  const reply = res.choices?.[0]?.message?.content ?? '';
  const script = parseScript(reply);
  // A malformed reply is rare with JSON mode; fall back honestly rather than error.
  if (!script) return thinNoteEpisode(title);

  return { ...script, title: script.title || title };
}
