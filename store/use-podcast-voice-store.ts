// Podcast voice store: per-host device voice + speaking speed, persisted to AsyncStorage.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import {
  DEFAULT_RATE,
  loadDeviceVoices,
  pickDefaultVoices,
  type DeviceVoice,
} from '@/lib/podcast-voices';
import type { PodcastSpeaker } from '@/types/podcast';

const STORAGE_KEY = 'podcast_voice_prefs';

/** The persisted choice: a voice id per host (null = system default) + speed. */
export type VoicePrefs = { A: string | null; B: string | null; rate: number };

const EMPTY: VoicePrefs = { A: null, B: null, rate: DEFAULT_RATE };

async function persist(prefs: VoicePrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    // Never crash over storage — the in-memory prefs still drive playback.
    console.warn('[podcast] failed to persist voice prefs', err);
  }
}

type VoiceState = {
  prefs: VoicePrefs;
  /** The curated device voices offered in the picker (empty on web / none). */
  voices: DeviceVoice[];
  loaded: boolean;
  /** Load device voices + saved prefs once; resolves smart defaults on first run. */
  init: () => Promise<void>;
  /** Set the voice for one host and persist. */
  setVoice: (speaker: PodcastSpeaker, identifier: string) => Promise<void>;
  /** Set the speaking speed and persist. */
  setRate: (rate: number) => Promise<void>;
};

export const usePodcastVoiceStore = create<VoiceState>((set, get) => ({
  prefs: EMPTY,
  voices: [],
  loaded: false,

  init: async () => {
    if (get().loaded) return;
    const voices = await loadDeviceVoices();
    const fallback = pickDefaultVoices(voices);
    const ids = new Set(voices.map((v) => v.identifier));

    let stored: Partial<VoicePrefs> = {};
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) stored = JSON.parse(raw) as Partial<VoicePrefs>;
    } catch (err) {
      console.warn('[podcast] failed to load voice prefs', err);
    }

    // Keep a saved pick only if that voice still exists; else fall back to the smart default.
    const keep = (id: unknown, dflt: string | null): string | null =>
      typeof id === 'string' && ids.has(id) ? id : dflt;

    const prefs: VoicePrefs = {
      A: keep(stored.A, fallback.A),
      B: keep(stored.B, fallback.B),
      rate: typeof stored.rate === 'number' ? stored.rate : DEFAULT_RATE,
    };

    set({ prefs, voices, loaded: true });
    // Persist the resolved defaults so the first-run picks are stable next launch.
    await persist(prefs);
  },

  setVoice: async (speaker, identifier) => {
    const prefs: VoicePrefs = { ...get().prefs, [speaker]: identifier };
    set({ prefs });
    await persist(prefs);
  },

  setRate: async (rate) => {
    const prefs: VoicePrefs = { ...get().prefs, rate };
    set({ prefs });
    await persist(prefs);
  },
}));
