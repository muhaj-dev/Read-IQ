// Note-detail view model for the Details / Reader / Edit screens, derived from a saved note.

import { useMemo } from 'react';

import { relativeDay, sourceLabel, wordCount } from '@/lib/note-view';
import { htmlToRichBlocks, type RichBlock } from '@/lib/rich-blocks';
import { firstInlineImageSrc, plainTextToHtml } from '@/lib/rich-text';
import { useNotesStore } from '@/store/use-notes-store';
import type { Note, NoteAttachment, NoteComment, PdfAnnotations } from '@/types/note';

/** Key Topics chip tone → topic* theme tokens (see the note-details mock). */
export type TopicTone = 'green' | 'red' | 'amber' | 'blue';

export type KeyTopic = {
  label: string;
  tone: TopicTone;
};

export type NoteStat = {
  value: string;
  label: string;
};

export type NoteDetail = {
  id: string;
  title: string;
  subject: string;
  /** Neutral pills after the subject ("Text", "245 words"). */
  badges: string[];
  aiSummary: string;
  /** Revealed by "Show more". */
  aiSummaryMore: string;
  keyTopics: KeyTopic[];
  stats: [NoteStat, NoteStat, NoteStat];
  /** `image` is only set when the note carries an inline image. */
  preview: { heading: string; excerpt: string; image?: string | null };
  /** Formatting-preserving reader blocks (headings, marks, lists, images). */
  reader: RichBlock[];
  /** HTML the WebView reader renders — saved annotations, else freshly derived content. */
  readerHtml: string;
  /** Comment-marker bodies for the reader, keyed to `<mark data-cid>` anchors. */
  comments: NoteComment[];
  // Edit Note draft fields
  tags: string[];
  /** Plain-text projection of the note (grounding source of truth). */
  content: string;
  /** Rich HTML the editor opens with; null → derive from `content`. */
  contentHtml: string | null;
  attachments: NoteAttachment[];
  /** PDF Reader highlights/comments (null until the first PDF annotation). */
  pdfAnnotations: PdfAnnotations | null;
};

/** A blank draft for the Add Note / Add Document form (paste + upload flows). */
export const emptyNoteDraft = {
  title: '',
  subject: 'General',
  tags: [] as string[],
  content: '',
  contentHtml: '',
  attachments: [] as NoteAttachment[],
};

const TOPIC_TONES: TopicTone[] = ['green', 'red', 'amber', 'blue'];

// Honest placeholder shown until a note has a real AI summary.
const SUMMARY_PLACEHOLDER = {
  summary: 'No AI summary yet for this note.',
  more: 'Ask a question about it and answers will be grounded here, with a citation.',
};

/** Split a summary into a one-line gist + the rest (revealed by "Show more"). */
function splitSummary(aiSummary: string | null): { summary: string; more: string } {
  const text = aiSummary?.trim();
  if (!text) return SUMMARY_PLACEHOLDER;
  const match = text.match(/^(.*?[.!?])\s+(.+)$/s);
  if (match && match[2].trim()) return { summary: match[1].trim(), more: match[2].trim() };
  return { summary: text, more: '' };
}

/** Ordered reader blocks: written content, then image attachments. */
function buildReaderBlocks(note: Note): RichBlock[] {
  const html = note.contentHtml?.trim() || plainTextToHtml(note.content);
  const blocks = html ? htmlToRichBlocks(html) : [];

  // Image attachments render after the written content so they're visible too.
  note.attachments.forEach((att) => {
    if (att.kind === 'image' && att.uri) blocks.push({ kind: 'image', src: att.uri });
  });

  return blocks;
}

/** Reader HTML when the note has no saved annotations: content + image attachments as <img>. */
function buildReaderHtml(note: Note): string {
  const base = note.contentHtml?.trim() || plainTextToHtml(note.content);
  const images = note.attachments
    .filter((att) => att.kind === 'image' && att.uri)
    .map((att) => `<img src="${att.uri}" alt="${att.name}">`)
    .join('');
  return `${base}${images}`;
}

/** Build the Note Details / Reader shape from a saved note. */
function toNoteDetail(note: Note): NoteDetail {
  const words = wordCount(note.content);
  const trimmed = note.content.trim();
  const summary = splitSummary(note.aiSummary);

  return {
    id: note.id,
    title: note.title,
    subject: note.subject ?? 'General',
    badges: [sourceLabel(note.source), `${words} words`],
    aiSummary: summary.summary,
    aiSummaryMore: summary.more,
    keyTopics: note.tags.slice(0, 4).map((label, i) => ({ label, tone: TOPIC_TONES[i % 4] })),
    stats: [
      { value: '0', label: 'AI References' },
      { value: String(words), label: 'Words' },
      { value: relativeDay(note.createdAt), label: 'Added' },
    ],
    preview: {
      heading: note.title,
      excerpt: trimmed ? `${trimmed.slice(0, 160)}${trimmed.length > 160 ? '…' : ''}` : 'No content yet.',
      image: firstInlineImageSrc(note.contentHtml),
    },
    reader: buildReaderBlocks(note),
    readerHtml: note.readerHtml ?? buildReaderHtml(note),
    comments: note.comments,
    tags: note.tags,
    content: note.content,
    contentHtml: note.contentHtml,
    attachments: note.attachments,
    pdfAnnotations: note.pdfAnnotations,
  };
}

/** Reactive Note Details for `id`; re-renders on edit/delete, null if the note is gone. */
export function useNoteDetail(id: string): NoteDetail | null {
  const note = useNotesStore((s) => s.notes.find((n) => n.id === id));
  return useMemo(() => (note ? toNoteDetail(note) : null), [note]);
}
