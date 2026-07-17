// User store: profile + study metrics (streak, AI-answer count), persisted to AsyncStorage.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { nextStreak } from '@/lib/study-stats';
import type { ProfileInput, UserProfile } from '@/types/user';

const STORAGE_KEY = 'user_profile';

const EMPTY: UserProfile = {
  name: '',
  email: '',
  studyingFor: '',
  goal: '',
  streak: 0,
  aiAnswers: 0,
  lastActiveDate: null,
  createdAt: '',
};

async function persist(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    // Never crash over storage — the in-memory value still drives the UI.
    console.warn('[user] failed to persist profile', err);
  }
}

type UserState = {
  profile: UserProfile;
  loaded: boolean;
  /** Load the persisted profile once on app start (stamps createdAt on first run). */
  init: () => Promise<void>;
  /** Save name / course / goal from onboarding (or a later profile edit). */
  setProfile: (fields: ProfileInput) => Promise<void>;
  /** Advance the streak for today's visit — call once on app open. */
  recordDailyActivity: () => Promise<void>;
  /** Count a grounded Ask ★ answer (the Dashboard's "AI Answers" stat). */
  incrementAiAnswers: () => Promise<void>;
};

export const useUserStore = create<UserState>((set, get) => ({
  profile: EMPTY,
  loaded: false,

  init: async () => {
    if (get().loaded) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserProfile>;
        set({ profile: { ...EMPTY, ...parsed }, loaded: true });
        return;
      }
      // First-ever launch: stamp createdAt so semester progress has an anchor.
      const created: UserProfile = { ...EMPTY, createdAt: new Date().toISOString() };
      set({ profile: created, loaded: true });
      await persist(created);
    } catch (err) {
      console.warn('[user] failed to load profile', err);
      set({ loaded: true });
    }
  },

  setProfile: async (fields) => {
    const current = get().profile;
    const next: UserProfile = {
      ...current,
      name: fields.name?.trim() ?? current.name,
      email: fields.email?.trim() ?? current.email,
      studyingFor: fields.studyingFor?.trim() ?? current.studyingFor,
      goal: fields.goal?.trim() ?? current.goal,
      // Guarantee an anchor even if onboarding runs before init stamped one.
      createdAt: current.createdAt || new Date().toISOString(),
    };
    set({ profile: next });
    await persist(next);
  },

  recordDailyActivity: async () => {
    const current = get().profile;
    const advanced = nextStreak(current);
    if (!advanced) return; // already counted today
    const next: UserProfile = { ...current, ...advanced };
    set({ profile: next });
    await persist(next);
  },

  incrementAiAnswers: async () => {
    const current = get().profile;
    const next: UserProfile = { ...current, aiAnswers: current.aiAnswers + 1 };
    set({ profile: next });
    await persist(next);
  },
}));
