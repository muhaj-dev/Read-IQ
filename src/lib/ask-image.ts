// Helpers for the Ask tab's image-attach flow: turn a question into a filing
// topic, and turn a read-out image into a saveable note (source 'scan').

import { plainTextToHtml } from '@/lib/rich-text';
import type { NoteInput } from '@/types/note';

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const STOP_WORDS = new Set([
  'what', 'whats', 'is', 'the', 'a', 'an', 'of', 'in', 'on', 'to', 'for', 'and',
  'explain', 'tell', 'me', 'about', 'this', 'that', 'how', 'why', 'does', 'do',
  'can', 'you', 'please', 'here', 'these', 'from', 'image', 'photo', 'picture',
]);

/** A short subject to file the saved image under, drawn from the question. */
export function inferTopic(question: string, fallbackText: string): string {
  const words = question
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  const pick = words.slice(0, 4).join(' ').trim();
  const source = pick || fallbackText.split('\n').map((l) => l.trim()).find(Boolean) || 'Imported image';
  const title = source.slice(0, 48).trim();
  return title.charAt(0).toUpperCase() + title.slice(1);
}

/** Build the note saved when the student keeps an attached image in their memory. */
export function buildImageNoteInput(imageText: string, topic: string, uri: string): NoteInput {
  return {
    title: topic,
    subject: topic,
    content: imageText,
    contentHtml: plainTextToHtml(imageText),
    source: 'scan',
    tags: topic ? [topic] : [],
    attachments: [{ id: createId(), name: 'Attached photo', meta: 'Image', uri, kind: 'image' }],
  };
}
