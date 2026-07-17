// Note → AI summary, grounded ONLY in the note's text. Summarize once at upload
// and persist it (see use-notes-store); this spends BTL credits.

import { getChatModel } from '@/store/use-settings-store';

import { aiPost } from './ai';

type ChatResponse = {
  choices?: { message?: { content?: string } }[];
};

// Cap the input so a long PDF doesn't burn tokens.
const MAX_INPUT_CHARS = 6000;

const SYSTEM_PROMPT =
  'You are AI University Companion. Summarize ONLY the student\'s note below in ' +
  '2-3 short, calm sentences a student can skim before revising. Use only what the ' +
  'note says — never add outside facts, definitions, or opinions. Return only the ' +
  'summary text: no preamble, headings, bullet points, or markdown.';

/** Summarize a note's text via BTL; empty if none returned. Throws BtlError (callers treat as "no summary"). */
export async function summarizeNoteText(content: string): Promise<string> {
  const text = content.trim();
  if (!text) return '';

  const res = await aiPost<ChatResponse>('chat/completions', {
    model: getChatModel(),
    temperature: 0.2,
    max_tokens: 180,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Note:\n${text.slice(0, MAX_INPUT_CHARS)}` },
    ],
  });

  return (res.choices?.[0]?.message?.content ?? '').trim();
}
