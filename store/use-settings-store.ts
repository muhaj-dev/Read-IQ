// App preferences (AI chat model, …), persisted to AsyncStorage.
// The chat model is read outside React by the lib callers via getChatModel().

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { isKnownModel } from '@/data/ai-models';
import { DEFAULT_CHAT_MODEL } from '@/lib/btl';

const STORAGE_KEY = 'app_settings';

type Settings = { chatModel: string };

const DEFAULTS: Settings = { chatModel: DEFAULT_CHAT_MODEL };

async function persist(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    // Never crash over storage — the in-memory value still drives the app.
    console.warn('[settings] failed to persist', err);
  }
}

type SettingsState = Settings & {
  loaded: boolean;
  /** Load persisted preferences once on app start. */
  init: () => Promise<void>;
  /** Choose which BTL model answers (Ask, quiz, summary, podcast). */
  setChatModel: (id: string) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  loaded: false,

  init: async () => {
    if (get().loaded) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Partial<Settings>) : {};
      // Fall back to the default if a saved model is no longer offered.
      const chatModel =
        parsed.chatModel && isKnownModel(parsed.chatModel) ? parsed.chatModel : DEFAULTS.chatModel;
      set({ chatModel, loaded: true });
    } catch (err) {
      console.warn('[settings] failed to load', err);
      set({ loaded: true });
    }
  },

  setChatModel: async (id) => {
    if (!isKnownModel(id)) return;
    set({ chatModel: id });
    await persist({ chatModel: id });
  },
}));

/** The selected chat model — for lib callers reading outside React. */
export function getChatModel(): string {
  return useSettingsStore.getState().chatModel;
}
