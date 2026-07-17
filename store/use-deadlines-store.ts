// Deadlines store: saved deadlines from SQLite, kept sorted soonest-due first.

import { create } from 'zustand';

import * as db from '@/lib/db';
import { byDueDate } from '@/lib/deadline-view';
import type { Deadline, DeadlineInput } from '@/types/deadline';

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type DeadlinesState = {
  deadlines: Deadline[];
  loaded: boolean;
  /** Load persisted deadlines once on app start. */
  init: () => Promise<void>;
  addDeadline: (input: DeadlineInput) => Promise<Deadline>;
  removeDeadline: (id: string) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
};

export const useDeadlinesStore = create<DeadlinesState>((set, get) => ({
  deadlines: [],
  loaded: false,

  init: async () => {
    if (get().loaded) return;
    try {
      const deadlines = await db.listDeadlines();
      set({ deadlines, loaded: true });
    } catch (err) {
      // Never crash the app over storage — start empty and let saves retry.
      console.warn('[deadlines] failed to load from SQLite', err);
      set({ loaded: true });
    }
  },

  addDeadline: async (input) => {
    const deadline: Deadline = {
      id: createId(),
      title: input.title.trim() || 'Untitled deadline',
      subject: input.subject,
      type: input.type,
      dueDate: input.dueDate,
      reminderOn: input.reminderOn,
      reminderLabel: input.reminderLabel,
      repeat: input.repeat,
      notes: input.notes.trim(),
      colorIndex: input.colorIndex,
      createdAt: new Date().toISOString(),
    };
    try {
      await db.insertDeadline(deadline);
    } catch (err) {
      console.warn('[deadlines] failed to persist deadline', err);
    }
    // Optimistic + keep the list sorted soonest-due first.
    set((state) => ({ deadlines: [...state.deadlines, deadline].sort(byDueDate) }));
    return deadline;
  },

  removeDeadline: async (id) => {
    try {
      await db.deleteDeadline(id);
    } catch (err) {
      console.warn('[deadlines] failed to delete deadline', err);
    }
    set((state) => ({ deadlines: state.deadlines.filter((d) => d.id !== id) }));
  },

  toggleReminder: async (id) => {
    const current = get().deadlines.find((d) => d.id === id);
    if (!current) return;
    const on = !current.reminderOn;
    try {
      await db.setDeadlineReminder(id, on);
    } catch (err) {
      console.warn('[deadlines] failed to toggle reminder', err);
    }
    set((state) => ({
      deadlines: state.deadlines.map((d) => (d.id === id ? { ...d, reminderOn: on } : d)),
    }));
  },
}));
