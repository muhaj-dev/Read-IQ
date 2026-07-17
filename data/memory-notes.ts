import type { AppIconName } from '@/components/ui/app-icon';

// Shared Memory Panel card type (real notes mapped in lib/note-view.ts).

/** Drive-style file tint for a note's icon tile (see the memory mock). */
export type NoteTint = 'indigo' | 'neutral' | 'green' | 'amber' | 'red';

export type MemoryNote = {
  id: string;
  title: string;
  subject: string;
  /** e.g. "Text • 245 words" — the source + size line under the title. */
  meta: string;
  /** Relative save date shown top-right ("Today", "May 20"). */
  when: string;
  /** How often the AI has answered from this note — proof it is remembered. */
  aiUsedCount: number;
  icon: Extract<AppIconName, 'description' | 'article'>;
  tint: NoteTint;
};
