// Subject/course list for the note editor's picker: defaults + student-added, persisted to SQLite.

import { create } from 'zustand';

import { defaultSubjects } from '@/data/subjects';
import * as db from '@/lib/db';

function mergeUnique(base: string[], extra: string[]): string[] {
  const seen = new Set(base.map((s) => s.toLowerCase()));
  const out = [...base];
  for (const name of extra) {
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(name);
    }
  }
  return out;
}

type SubjectsState = {
  subjects: string[];
  loaded: boolean;
  /** Load the student's saved subjects once on app start. */
  init: () => Promise<void>;
  /** Add a subject (trimmed, case-insensitively deduped) and return its final name. */
  addSubject: (name: string) => Promise<string>;
};

export const useSubjectsStore = create<SubjectsState>((set, get) => ({
  subjects: defaultSubjects,
  loaded: false,

  init: async () => {
    if (get().loaded) return;
    try {
      const saved = await db.listSubjects();
      set({ subjects: mergeUnique(defaultSubjects, saved), loaded: true });
    } catch (err) {
      console.warn('[subjects] failed to load from SQLite', err);
      set({ loaded: true });
    }
  },

  addSubject: async (raw) => {
    const name = raw.trim();
    if (!name) return '';
    // Reuse an existing subject (any case) rather than creating a duplicate.
    const existing = get().subjects.find((s) => s.toLowerCase() === name.toLowerCase());
    if (existing) return existing;

    set((state) => ({ subjects: [...state.subjects, name] }));
    try {
      await db.insertSubject(name);
    } catch (err) {
      console.warn('[subjects] failed to persist subject', err);
    }
    return name;
  },
}));
