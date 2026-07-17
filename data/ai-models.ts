// The AI chat models the student can pick in Settings → AI Model.
// Every option is a real slug behind the BTL Runtime gateway; the id is sent
// verbatim as `model` in the request. Grounding is unaffected by the choice —
// this only changes which model on the runtime writes the answer.

import { DEFAULT_CHAT_MODEL } from '@/lib/btl';

export type AiModel = {
  /** The BTL model slug sent in the request body. */
  id: string;
  /** Friendly name shown in the picker + the Settings row. */
  label: string;
  /** Who's behind the model, on the gateway. */
  provider: string;
  /** One calm line on what it's good for. */
  description: string;
  /** btl-2 — the tested default. */
  recommended?: boolean;
};

export const AI_MODELS: AiModel[] = [
  {
    id: DEFAULT_CHAT_MODEL, // 'btl-2'
    label: 'readIQ Default',
    provider: 'Bad Theory Labs',
    description: 'Fast, grounded, and tuned for study answers. The tested default.',
    recommended: true,
  },
  {
    id: 'gpt-4.1-mini',
    label: 'GPT-4.1 mini',
    provider: 'OpenAI',
    description: 'Sharp reasoning for trickier questions about your notes.',
  },
  {
    id: 'claude-haiku-4-5',
    label: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    description: 'Quick and careful — sticks closely to what your notes say.',
  },
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    provider: 'Google',
    description: 'Fast, with a large window for longer notes.',
  },
];

/** The friendly label for a model id — falls back to the id, then the default. */
export function modelLabelFor(id: string): string {
  return AI_MODELS.find((m) => m.id === id)?.label ?? id ?? 'readIQ Default';
}

/** Is this id one we offer? Guards a stale persisted value after the list changes. */
export function isKnownModel(id: string): boolean {
  return AI_MODELS.some((m) => m.id === id);
}
