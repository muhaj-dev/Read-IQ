// "From Your Notes" podcast — a two-host audio conversation generated from ONE
// saved note that the student LISTENS to (they never speak). The script is
// written strictly from the note's own text (the same grounding promise as Ask),
// so the hosts never invent facts outside the note.
//
// Stage 1 (built): a grounded SCRIPT — the two-host turns below, cached per note.
// Stage 2 (next): spoken audio, one voice per speaker. `speaker` stays 'A' | 'B'
// regardless of the host names in the text, so audio routing (A → voice 1,
// B → voice 2) is reliable even if the model calls them "Maya" / "Leo".

/** Which host is speaking. Stable routing key, independent of the display name. */
export type PodcastSpeaker = 'A' | 'B';

/** The two presenter identities. Just names for the ear — NOT facts from the note.
 *  A = the curious one (drives questions); B = the explainer. */
export const HOSTS: Record<PodcastSpeaker, string> = { A: 'Maya', B: 'Leo' };

/** How fully the note could be turned into an episode.
 *  'partial' is the honesty signal — the note is thin, so the episode is brief and
 *  the player nudges the student to add more (never faked depth). */
export type PodcastCoverage = 'full' | 'partial';

/** One spoken line in the conversation. */
export type PodcastTurn = {
  speaker: PodcastSpeaker;
  text: string;
};

/** A generated episode, cached in SQLite keyed by note id + content hash so it is
 *  only regenerated when the note actually changes (protects the credit budget). */
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
