// The proxy enforces this model server-side; the setting is intentionally a
// single OpenAI option so a client cannot switch providers.

import { DEFAULT_CHAT_MODEL } from '@/lib/ai';

export type AiModel = {
  id: string;
  label: string;
  provider: string;
  description: string;
  recommended?: boolean;
};

export const AI_MODELS: AiModel[] = [
  {
    id: DEFAULT_CHAT_MODEL,
    label: 'GPT-5.6',
    provider: 'OpenAI',
    description: 'Used through readIQ’s secure study-assistant proxy.',
    recommended: true,
  },
];

export function modelLabelFor(id: string): string {
  return AI_MODELS.find((model) => model.id === id)?.label ?? 'GPT-5.6';
}

export function isKnownModel(id: string): boolean {
  return AI_MODELS.some((model) => model.id === id);
}
