// Onboarding-complete flag (AsyncStorage): lets the splash skip returning students to Home.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'onboarding_complete';

type OnboardingState = {
  /** True once the student has finished (or skipped through) onboarding. */
  completed: boolean;
  /** False until the persisted flag has been read once on app start. */
  loaded: boolean;
  /** Read the persisted flag once on app start. */
  init: () => Promise<void>;
  /** Mark onboarding done and persist it. */
  complete: () => Promise<void>;
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  completed: false,
  loaded: false,

  init: async () => {
    if (get().loaded) return;
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      set({ completed: value === 'true', loaded: true });
    } catch (err) {
      // Never block the splash over storage — treat as first run.
      console.warn('[onboarding] failed to read flag', err);
      set({ loaded: true });
    }
  },

  complete: async () => {
    // Optimistic: flip in memory now so navigation never waits on the write.
    set({ completed: true });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } catch (err) {
      console.warn('[onboarding] failed to persist flag', err);
    }
  },
}));
