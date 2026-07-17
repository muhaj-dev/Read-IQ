// View helpers that turn a stored Note into the display shapes the built UI
// already expects (the Memory Panel card + shared date/word/label formatting).

import type { MemoryNote, NoteTint } from '@/data/memory-notes';
import type { Note, NoteSource } from '@/types/note';

const SOURCE_LABEL: Record<NoteSource, string> = {
  paste: 'Text',
  file: 'File',
  scan: 'Scan',
  voice: 'Audio',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Today" / "Yesterday" / "Jul 4" — the save date shown on a note card. */
export function relativeDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function sourceLabel(source: NoteSource): string {
  return SOURCE_LABEL[source];
}

function sourceIcon(source: NoteSource): MemoryNote['icon'] {
  return source === 'file' ? 'description' : 'article';
}

// A stable, evenly-spread tint per note so the Memory Panel stays colourful
// without needing a stored colour.
const TINTS: NoteTint[] = ['indigo', 'neutral', 'green', 'amber', 'red'];

function tintForId(id: string): NoteTint {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return TINTS[hash % TINTS.length];
}

/** Map a stored Note onto the Memory Panel card shape (see memory-notes.ts). */
export function toMemoryNote(note: Note): MemoryNote {
  return {
    id: note.id,
    title: note.title,
    subject: note.subject ?? 'General',
    meta: `${SOURCE_LABEL[note.source]} • ${wordCount(note.content)} words`,
    when: relativeDay(note.createdAt),
    // Fresh notes have no AI references yet; retrieval increments this later.
    aiUsedCount: 0,
    icon: sourceIcon(note.source),
    tint: tintForId(note.id),
  };
}
