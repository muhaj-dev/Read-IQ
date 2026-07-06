// Memory store: every saved note from SQLite — the client-side source of truth.

import { create } from 'zustand';

import * as db from '@/lib/db';
import { embedAndStoreNote, syncNoteEmbeddings } from '@/lib/embeddings';
import type { Note, NoteInput, NotePatch } from '@/types/note';

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Fall back to the first non-empty line when the student leaves the title blank. */
function deriveTitle(content: string): string {
  const firstLine = content.split('\n').map((line) => line.trim()).find(Boolean) ?? '';
  return firstLine.slice(0, 60).trim() || 'Untitled note';
}

type NotesState = {
  notes: Note[];
  loaded: boolean;
  /** Load persisted notes once on app start. */
  init: () => Promise<void>;
  addNote: (input: NoteInput) => Promise<Note>;
  updateNote: (id: string, patch: NotePatch) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  getNote: (id: string) => Note | undefined;
};

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  loaded: false,

  init: async () => {
    if (get().loaded) return;
    try {
      const notes = await db.listNotes();
      set({ notes, loaded: true });
      // Backfill retrieval vectors for notes saved before the semantic upgrade (or
      // saved offline) — lazy, guarded, and non-blocking so launch stays instant.
      void syncNoteEmbeddings(notes);
    } catch (err) {
      // Never crash the app over storage — start empty and let saves retry.
      console.warn('[notes] failed to load from SQLite', err);
      set({ loaded: true });
    }
  },

  addNote: async (input) => {
    const note: Note = {
      id: createId(),
      title: input.title?.trim() || deriveTitle(input.content),
      subject: input.subject ?? null,
      content: input.content,
      contentHtml: input.contentHtml ?? null,
      source: input.source,
      tags: input.tags ?? [],
      attachments: input.attachments ?? [],
      // Reader annotations start empty; they're derived on first highlight/comment.
      readerHtml: null,
      comments: [],
      pdfAnnotations: null,
      aiSummary: input.aiSummary ?? null,
      createdAt: new Date().toISOString(),
    };
    try {
      await db.insertNote(note);
    } catch (err) {
      console.warn('[notes] failed to persist note', err);
    }
    // Optimistic: show the note immediately even if the write hiccuped.
    set((state) => ({ notes: [note, ...state.notes] }));
    // Embed for semantic retrieval in the background — a snappy save; retrieval
    // covers this note lexically until its vector lands (usually ~1s).
    void embedAndStoreNote(note);
    return note;
  },

  updateNote: async (id, patch) => {
    const current = get().notes.find((n) => n.id === id);
    if (!current) return;
    // Editing note text invalidates highlights/comments (they anchored to old HTML) — clear them.
    const contentEdited = patch.contentHtml !== undefined && patch.readerHtml === undefined;
    const next: Note = {
      ...current,
      title: patch.title?.trim() || current.title,
      subject: patch.subject !== undefined ? patch.subject : current.subject,
      content: patch.content ?? current.content,
      contentHtml: patch.contentHtml !== undefined ? patch.contentHtml : current.contentHtml,
      tags: patch.tags ?? current.tags,
      attachments: patch.attachments ?? current.attachments,
      readerHtml: contentEdited
        ? null
        : patch.readerHtml !== undefined
          ? patch.readerHtml
          : current.readerHtml,
      comments: contentEdited ? [] : patch.comments ?? current.comments,
      // PDF annotations anchor to the PDF pages, not the note text — they survive text edits.
      pdfAnnotations:
        patch.pdfAnnotations !== undefined ? patch.pdfAnnotations : current.pdfAnnotations,
      // db.updateNote has no summary column, so SQLite keeps it across edits — mirror that.
      aiSummary: patch.aiSummary !== undefined ? patch.aiSummary : current.aiSummary,
    };
    try {
      await db.updateNote(id, {
        title: next.title,
        subject: next.subject,
        content: next.content,
        contentHtml: next.contentHtml,
        tags: next.tags,
        attachments: next.attachments,
        readerHtml: next.readerHtml,
        comments: next.comments,
        pdfAnnotations: next.pdfAnnotations,
      });
    } catch (err) {
      console.warn('[notes] failed to update note', err);
    }
    set((state) => ({ notes: state.notes.map((n) => (n.id === id ? next : n)) }));
    // Re-embed only when the searchable text changed — retrieval derives its vectors
    // and staleness hash from title + subject + content, so nothing else affects them.
    const searchableChanged =
      next.title !== current.title ||
      next.subject !== current.subject ||
      next.content !== current.content;
    if (searchableChanged) void embedAndStoreNote(next);
  },

  removeNote: async (id) => {
    try {
      await db.deleteNote(id);
    } catch (err) {
      console.warn('[notes] failed to delete note', err);
    }
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
  },

  getNote: (id) => get().notes.find((n) => n.id === id),
}));
