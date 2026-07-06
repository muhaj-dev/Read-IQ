// Retrieval types — semantic grounding for Ask (cosine similarity over BTL
// text-embedding-3-small vectors, with a lexical keyword fallback when embeddings
// are unavailable). A hit only reaches the answer when it clears the grounding gate.

/** A small, retrievable slice of a saved note. */
export type NoteChunk = {
  noteId: string;
  noteTitle: string;
  text: string;
};

/** A chunk with its persisted embedding — one row of the SQLite `note_chunks` table. */
export type StoredChunk = {
  noteId: string;
  /** Position within the note (0-based), for a stable row id. */
  idx: number;
  text: string;
  /** The chunk's vector (BTL text-embedding-3-small, 1536-dim). */
  embedding: number[];
  /** Hash of the note's searchable text when embedded — flags a stale vector after an edit. */
  contentHash: string;
};

/** A ranked chunk — what retrieval returns and what a citation is built from. */
export type RetrievalHit = NoteChunk & {
  /** Relevance in [0, 1]: cosine similarity (semantic) or keyword overlap (lexical fallback). */
  score: number;
};
