// Podcast store: one cached "From Your Notes" episode per note, generated via the BTL runtime.

import { create } from 'zustand';

import { BtlError } from '@/lib/btl';
import { getPodcastEpisode, savePodcastEpisode } from '@/lib/db';
import { generateEpisodeScript, hashContent } from '@/lib/podcast';
import type { Note } from '@/types/note';
import type { PodcastEpisode } from '@/types/podcast';

/** Per-note generation lifecycle for the Listen screen. */
export type EpisodeStatus = 'idle' | 'loading' | 'generating' | 'ready' | 'error';

const GENERIC_ERROR = 'Something went wrong writing your episode. Please try again.';

type PodcastState = {
  /** Cached episodes by note id (loaded from SQLite, then kept fresh on generate). */
  episodes: Record<string, PodcastEpisode>;
  /** Generation lifecycle by note id. */
  status: Record<string, EpisodeStatus>;
  /** Friendly error copy by note id (set only when status is 'error'). */
  error: Record<string, string>;
  /** Read the note's cached episode from SQLite into memory (no model call). */
  load: (noteId: string) => Promise<void>;
  /** Write (or rewrite) the note's episode through the runtime and cache it. */
  generate: (note: Note) => Promise<void>;
  /** True when the cached episode was written from the note's CURRENT text. */
  isFresh: (note: Note) => boolean;
};

const setNoteState = <T,>(map: Record<string, T>, id: string, value: T): Record<string, T> => ({
  ...map,
  [id]: value,
});

export const usePodcastStore = create<PodcastState>((set, get) => ({
  episodes: {},
  status: {},
  error: {},

  load: async (noteId) => {
    // Already generating or loaded this session → nothing to do (avoid a spinner flash).
    const current = get().status[noteId];
    if (current === 'generating' || current === 'ready') return;
    set((s) => ({ status: setNoteState(s.status, noteId, 'loading') }));
    try {
      const episode = await getPodcastEpisode(noteId);
      set((s) => ({
        episodes: episode ? setNoteState(s.episodes, noteId, episode) : s.episodes,
        status: setNoteState(s.status, noteId, episode ? 'ready' : 'idle'),
      }));
    } catch (err) {
      console.warn('[podcast] failed to load episode', err);
      set((s) => ({ status: setNoteState(s.status, noteId, 'idle') }));
    }
  },

  generate: async (note) => {
    if (get().status[note.id] === 'generating') return;
    set((s) => ({
      status: setNoteState(s.status, note.id, 'generating'),
      error: setNoteState(s.error, note.id, ''),
    }));
    try {
      const script = await generateEpisodeScript(note);
      const episode: PodcastEpisode = {
        noteId: note.id,
        contentHash: hashContent(note.content),
        title: script.title,
        coverage: script.coverage,
        turns: script.turns,
        createdAt: new Date().toISOString(),
      };
      // Best-effort cache — a failed write just means we regenerate next time.
      try {
        await savePodcastEpisode(episode);
      } catch (err) {
        console.warn('[podcast] failed to cache episode', err);
      }
      set((s) => ({
        episodes: setNoteState(s.episodes, note.id, episode),
        status: setNoteState(s.status, note.id, 'ready'),
      }));
    } catch (err) {
      const friendly = err instanceof BtlError ? err.friendly : GENERIC_ERROR;
      set((s) => ({
        status: setNoteState(s.status, note.id, 'error'),
        error: setNoteState(s.error, note.id, friendly),
      }));
    }
  },

  isFresh: (note) => {
    const episode = get().episodes[note.id];
    return !!episode && episode.contentHash === hashContent(note.content);
  },
}));
