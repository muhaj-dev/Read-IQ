// Embedding write-path: chunk a note → embed each chunk via BTL → persist the
// vectors in SQLite, once per note. Embedding is a one-time cost per note (cached
// forever), so it happens on save/edit and via a launch backfill — never per
// question. The read side (retrieval.ts) cosine-ranks these stored vectors.
//
// Everything here is best-effort: if embeddings are unavailable (offline, no credits,
// not configured), we leave the note un-embedded and retrieval falls back to lexical,
// so the app never breaks — it just isn't semantic until a later embed succeeds.

import type { Note } from '@/types/note';
import type { StoredChunk } from '@/types/retrieval';

import { btlEmbed, isBtlConfigured } from './btl';
import { chunkNote, noteSearchableText } from './chunk';
import { deleteNoteChunks, getNoteChunkHashes, replaceNoteChunks } from './db';
import { hashContent } from './hash';

// Re-exported for AGENTS.md alignment ("embeddings.ts — cosine similarity helper");
// the implementation lives in the store-free chunk module to avoid an import cycle.
export { cosineSimilarity } from './chunk';

/** Chunk, embed, and persist one note's vectors, replacing any prior set. Returns
 *  true when vectors were stored (or the note is empty), false when embeddings were
 *  unavailable — the caller then relies on the lexical fallback. Never throws. */
export async function embedAndStoreNote(note: Note): Promise<boolean> {
  const chunks = chunkNote(note);
  // An empty note has nothing to embed — clear any stale vectors and report success.
  if (chunks.length === 0) {
    await deleteNoteChunks(note.id).catch(() => {});
    return true;
  }
  if (!isBtlConfigured()) return false;

  let vectors: number[][];
  try {
    vectors = await btlEmbed(chunks.map((c) => c.text));
  } catch {
    return false; // offline / credits / server → leave lexical to cover this note
  }

  const contentHash = hashContent(noteSearchableText(note));
  const rows: StoredChunk[] = chunks.map((c, i) => ({
    noteId: note.id,
    idx: i,
    text: c.text,
    embedding: vectors[i],
    contentHash,
  }));
  try {
    await replaceNoteChunks(note.id, rows);
    return true;
  } catch {
    return false;
  }
}

/** Backfill: embed any note whose stored vectors are missing or stale (its text
 *  changed since it was embedded). Runs once on app launch; sequential to avoid a
 *  burst of calls, and fully guarded so a failure just leaves lexical to cover it. */
export async function syncNoteEmbeddings(notes: Note[]): Promise<void> {
  if (!isBtlConfigured() || notes.length === 0) return;

  let have: Map<string, string>;
  try {
    have = await getNoteChunkHashes();
  } catch {
    return;
  }

  const stale = notes.filter((n) => have.get(n.id) !== hashContent(noteSearchableText(n)));
  for (const note of stale) {
    const ok = await embedAndStoreNote(note);
    // Stop early if embeddings have gone unavailable — the rest stays on lexical.
    if (!ok && !isBtlConfigured()) break;
  }
}
