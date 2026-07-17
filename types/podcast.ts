// "From Your Notes" podcast — a two-host conversation scripted strictly from one note.

/** Which host is speaking. Stable routing key, independent of the display name. */
export type PodcastSpeaker = 'A' | 'B';

/** The two presenter names (for the ear, not facts): A asks, B explains. */
export const HOSTS: Record<PodcastSpeaker, string> = { A: 'Maya', B: 'Leo' };

/** How fully the note became an episode; 'partial' = thin note, brief episode. */
export type PodcastCoverage = 'full' | 'partial';

/** One spoken line in the conversation. */
export type PodcastTurn = {
  speaker: PodcastSpeaker;
  text: string;
};

/** A generated episode, cached in SQLite by note id + content hash. */
export type PodcastEpisode = {
  noteId: string;
  /** Hash of the note content the script was written from — cache-invalidation key. */
  contentHash: string;
  /** ≤6-word episode title from the note's topic. */
  title: string;
  coverage: PodcastCoverage;
  turns: PodcastTurn[];
  createdAt: string;
};
