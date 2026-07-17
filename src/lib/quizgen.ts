// The quiz generator — turns ONE note into MCQs grounded ONLY in its text. No
// retrieval (single-note scope); the model returns strict JSON we parse and
// validate. Thin notes short-circuit with no model call; store caches by hash.

import { getChatModel } from '@/store/use-settings-store';
import type { QuizOption, QuizQuestion } from '@/types/quiz';

import { aiPost } from './ai';

/** Fallback question target when a caller doesn't ask for a specific count. */
const DEFAULT_TARGET = 10;
/** Below this the note is too thin to quiz — return empty, no model call. */
const MIN_CONTENT_CHARS = 140;
/** A real quiz needs at least this many valid questions; fewer ⇒ treat as empty. */
const MIN_QUESTIONS = 2;
/** How much of the note the generator gets (~4k tokens); a long note is clipped. */
const CONTENT_CHAR_BUDGET = 16000;
/** Roughly the output tokens one four-option MCQ (with explanation) costs. */
const TOKENS_PER_QUESTION = 95;
/** Hard ceiling on output tokens, so even the longest ask stays bounded. */
const MAX_OUTPUT_TOKENS = 4000;
/** Cap on previously-asked prompts sent back as "don't repeat these". */
const MAX_AVOID = 80;

const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

/** Fisher–Yates shuffle (in place, returns the same array). */
function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** Re-letter a question's options into a random A–D order, moving `answerKey`
 *  with the correct option's text. De-biases the model's strong tendency to park
 *  the correct answer under one letter (usually B). Index-based (not text-based)
 *  so duplicate option texts can't misplace the answer. Cosmetic + free — safe to
 *  run on cached questions too. */
export function shuffleQuestionOptions(q: QuizQuestion): QuizQuestion {
  const correctIndex = q.options.findIndex((o) => o.key === q.answerKey);
  if (correctIndex === -1) return q; // malformed — leave untouched
  const order = shuffle(q.options.map((_, i) => i));
  const options: QuizOption[] = order.map((from, i) => ({
    key: OPTION_KEYS[i] ?? q.options[from].key,
    text: q.options[from].text,
  }));
  const answerKey = OPTION_KEYS[order.indexOf(correctIndex)] ?? q.answerKey;
  return { ...q, options, answerKey };
}

function systemPrompt(count: number): string {
  return `You are the quiz writer for AI University Companion. You turn ONE student's saved note into multiple-choice revision questions that test whether they understood the material.

ABSOLUTE GROUNDING RULE (never break this)
- Write questions and answers using ONLY the information in the note provided. This app's whole promise is that it never makes things up.
- Never test a fact, name, date, or definition that is not in the note — not even a true one from general knowledge.
- The correct answer must be clearly supported by the note. The three wrong options (distractors) must be plausible but clearly wrong according to the note.
- If the note is thin and only supports a few solid questions, write fewer. Do not pad with weak or repetitive questions.

EACH QUESTION
- Tests one clear idea from the note.
- Has exactly four options labelled A, B, C, D — one correct, three plausible distractors.
- Carries a short "topic": a 1–3 word concept label naming what the question is about (for example "Calvin cycle", "Big O", "Mitosis"). Keep topics consistent so the same concept reuses the same label.
- Carries a short "explanation": ONE precise sentence (about 15 words, never more than 25) saying why the correct answer is right, drawn ONLY from the note. This is shown to a student who got the question wrong, so make it clear and grounded — no outside facts.

WRITING STYLE
- Plain, clear exam-style language. No markdown, asterisks, or emoji.
- Do not reference "the note" in the question text (say the fact, not "according to the note").
- Keep each option short.

OUTPUT — return ONLY valid JSON, no commentary, exactly this shape:
{"questions":[{"topic":"<1-3 words>","question":"<the question>","options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"A","explanation":"<one short sentence>"}]}
Aim for ${count} distinct questions (write fewer only if the note genuinely can't support that many). "answer" must be one of "A","B","C","D".`;
}

function userPrompt(title: string, subject: string, content: string, avoid: string[]): string {
  const base = `Write multiple-choice revision questions from this note. Use ONLY what is below.

NOTE TITLE: ${title}
SUBJECT: ${subject}

NOTE CONTENT:
"""
${content}
"""`;

  if (avoid.length === 0) return base;

  // Steer a re-attempt toward material the student hasn't been quizzed on yet.
  const list = avoid.slice(0, MAX_AVOID).map((q) => `- ${q}`).join('\n');
  return `${base}

ALREADY ASKED — the student has already answered these, so do NOT repeat or lightly reword any of them. Write brand-new questions covering DIFFERENT facts, angles, or details from the note:
${list}`;
}

type ChatCompletion = { choices?: { message?: { content?: string } }[] };

type RawQuestion = {
  topic?: unknown;
  question?: unknown;
  options?: unknown;
  answer?: unknown;
  explanation?: unknown;
};

/** Coerce one raw JSON question into a validated QuizQuestion, or null if it is
 *  malformed (missing options, an out-of-range answer, empty prompt, …). */
function toQuestion(raw: RawQuestion, index: number, note: { id: string; title: string }): QuizQuestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const prompt = typeof raw.question === 'string' ? raw.question.trim() : '';
  if (!prompt) return null;

  const src = raw.options;
  if (!src || typeof src !== 'object') return null;
  const map = src as Record<string, unknown>;

  const options: QuizOption[] = [];
  for (const key of OPTION_KEYS) {
    const text = typeof map[key] === 'string' ? (map[key] as string).trim() : '';
    if (!text) return null; // all four options must be present and non-empty
    options.push({ key, text });
  }

  const answerKey = typeof raw.answer === 'string' ? raw.answer.trim().toUpperCase() : '';
  if (!OPTION_KEYS.includes(answerKey as (typeof OPTION_KEYS)[number])) return null;

  const topic = typeof raw.topic === 'string' && raw.topic.trim() ? raw.topic.trim() : note.title;
  const explanation = typeof raw.explanation === 'string' ? raw.explanation.trim() : '';

  // Randomise the answer's letter — the model parks it under B far too often.
  return shuffleQuestionOptions({
    id: `${note.id}-q${index}`,
    topic,
    prompt,
    options,
    answerKey,
    explanation,
    sourceNoteId: note.id,
    sourceNoteTitle: note.title,
  });
}

/** Pull the questions array out of a model reply, tolerating ```json fences or
 *  stray prose around the JSON. Returns [] if nothing parseable is found. */
function parseQuestions(raw: string, note: { id: string; title: string }, limit: number): QuizQuestion[] {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== 'object') return [];
  const list = (parsed as { questions?: unknown }).questions;
  if (!Array.isArray(list)) return [];

  const questions: QuizQuestion[] = [];
  for (const item of list) {
    const q = toQuestion(item as RawQuestion, questions.length + 1, note);
    if (q) questions.push(q);
  }
  return questions.slice(0, limit);
}

/** Options for one generation pass. */
export type GenerateQuizOptions = {
  /** How many questions to aim for. Defaults to DEFAULT_TARGET. */
  count?: number;
  /** Prompts already put to the student — the model is told to write different
   *  ones, so a re-attempt never repeats questions. */
  avoid?: string[];
};

/** Generate grounded MCQs from a note (ONLY its text). Thin notes or unparseable
 *  replies return []; throws BtlError only on a runtime failure. */
export async function generateQuiz(
  note: {
    id: string;
    title: string;
    subject: string | null;
    content: string;
  },
  opts: GenerateQuizOptions = {},
): Promise<QuizQuestion[]> {
  const content = note.content.trim();
  if (content.length < MIN_CONTENT_CHARS) return [];

  const count = opts.count ?? DEFAULT_TARGET;
  const avoid = opts.avoid ?? [];
  const title = note.title.trim() || 'Your note';
  const clipped =
    content.length > CONTENT_CHAR_BUDGET ? `${content.slice(0, CONTENT_CHAR_BUDGET)}…` : content;

  // Scale the output budget with the ask, but keep a hard ceiling.
  const maxTokens = Math.min(MAX_OUTPUT_TOKENS, count * TOKENS_PER_QUESTION + 300);

  // Plain chat + robust parser, not a `response_format` field (unverified here).
  const res = await aiPost<ChatCompletion>('chat/completions', {
    model: getChatModel(),
    // Low for accuracy; a re-attempt lifts it to explore different corners.
    temperature: avoid.length > 0 ? 0.6 : 0.3,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt(count) },
      { role: 'user', content: userPrompt(title, note.subject ?? 'General', clipped, avoid) },
    ],
  });

  const reply = res.choices?.[0]?.message?.content ?? '';
  const questions = parseQuestions(reply, { id: note.id, title }, count);
  return questions.length >= MIN_QUESTIONS ? questions : [];
}
