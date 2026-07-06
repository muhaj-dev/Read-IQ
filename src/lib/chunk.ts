// Pure note chunking + vector math — no store, no BTL, no DB imports. Shared by the
// read side (retrieval.ts ranks stored chunks) and the write side (embeddings.ts
// embeds them), so both split a note identically. Keeping it store-free avoids an
// import cycle (store → embeddings → chunk, and retrieval → chunk, one-directional).

import type { Note } from '@/types/note';
import type { NoteChunk } from '@/types/retrieval';

/** Roughly a few sentences per chunk so a citation points to a precise place. */
const CHUNK_WORDS = 60;
/** Sentences of overlap between chunks, so a boundary match isn't lost. */
const CHUNK_OVERLAP = 1;

// Split into sentences without lookbehind (Hermes-safe).
function splitSentences(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.match(/[^.!?]+[.!?]*/g) ?? [])
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/** Break note text into small, lightly-overlapping chunks (~CHUNK_WORDS each). */
export function chunkText(text: string): string[] {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];

  const chunks: string[] = [];
  let current: string[] = [];
  let words = 0;
  const countWords = (parts: string[]) =>
    parts.reduce((n, s) => n + s.split(' ').length, 0);

  for (const sentence of sentences) {
    const w = sentence.split(' ').length;
    // Flush before overflow, carrying the tail sentence(s) forward as overlap.
    if (words + w > CHUNK_WORDS && current.length > 0) {
      chunks.push(current.join(' '));
      current = CHUNK_OVERLAP > 0 ? current.slice(-CHUNK_OVERLAP) : [];
      words = countWords(current);
    }
    current.push(sentence);
    words += w;
  }
  if (current.length > 0) chunks.push(current.join(' '));
  return chunks;
}

/** The text a note is chunked (and embedded/hashed) from: the title + subject lead
 *  the body so a topic named only in the title is still found by a short question.
 *  Chunking and the staleness hash both derive from THIS, so they never disagree. */
export function noteSearchableText(note: Note): string {
  const header = [note.title, note.subject].filter(Boolean).join(' ').trim();
  return header ? `${header}.\n${note.content}` : note.content;
}

/** Chunk one saved note, tagging every chunk with its source for citations. */
export function chunkNote(note: Note): NoteChunk[] {
  return chunkText(noteSearchableText(note)).map((text) => ({
    noteId: note.id,
    noteTitle: note.title,
    text,
  }));
}

/** Cosine similarity of two equal-length vectors, in [-1, 1]. 0 if either is empty
 *  or a zero vector. This is the semantic-relevance score the grounding gate reads. */
export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
