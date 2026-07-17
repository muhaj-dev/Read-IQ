// Reader-annotation state + persistence: tool, highlight colour, comments, undo/redo, saved to the Memory store.

import { useCallback, useRef, useState } from 'react';

import type { NoteDetail } from '@/data/note-detail';
import { ReaderHighlights } from '@/constants/theme';
import { useNotesStore } from '@/store/use-notes-store';
import type { NoteComment } from '@/types/note';

/** The active reading tool. `view` = plain reading (text still selectable). */
export type AnnotationMode = 'view' | 'highlight' | 'comment';

/** A new comment selection being typed; its `<mark data-cid>` (in `html`) doubles as the comment id. */
export type CommentDraft = { cid: string; quote: string; html: string };

/** One point on the undo timeline: the reader HTML + comment list at that step. */
type Snapshot = { html: string; comments: NoteComment[] };

/** Cheap structural equality so the history only records real changes. */
function sameComments(a: NoteComment[], b: NoteComment[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((c, i) => b[i] && c.id === b[i].id && c.body === b[i].body && c.quote === b[i].quote);
}

export function useNoteAnnotations(note: NoteDetail) {
  const updateNote = useNotesStore((s) => s.updateNote);

  // Rendered once; never fed back or the page would reset mid-read. Later edits report new HTML.
  const initialHtml = useRef(note.readerHtml).current;

  // Refs mirror state so async saves keep a consistent html+comments pair despite React batching.
  const htmlRef = useRef(note.readerHtml);
  const commentsRef = useRef<NoteComment[]>(note.comments);

  // Undo/redo timeline: past/future snapshots; the flags drive the history buttons' look.
  const pastRef = useRef<Snapshot[]>([]);
  const futureRef = useRef<Snapshot[]>([]);
  // A delete awaiting the WebView unwrap, so mark + comment removal commit as one undo step.
  const pendingDeleteRef = useRef<string | null>(null);

  const [comments, setComments] = useState<NoteComment[]>(note.comments);
  const [mode, setMode] = useState<AnnotationMode>('view');
  const [highlightColor, setHighlightColor] = useState<string>(ReaderHighlights[0]);
  const [draft, setDraft] = useState<CommentDraft | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncHistory = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  // Write a state to refs + React + the store. Does NOT touch history.
  const write = useCallback(
    (html: string, next: NoteComment[]) => {
      htmlRef.current = html;
      commentsRef.current = next;
      setComments(next);
      updateNote(note.id, { readerHtml: html, comments: next });
    },
    [note.id, updateNote],
  );

  // A user change: push the pre-change state to undo (if changed), clear redo, write the new state.
  const persist = useCallback(
    (html: string, next: NoteComment[]) => {
      if (html !== htmlRef.current || !sameComments(next, commentsRef.current)) {
        pastRef.current.push({ html: htmlRef.current, comments: commentsRef.current });
        futureRef.current = [];
        syncHistory();
      }
      write(html, next);
    },
    [write, syncHistory],
  );

  // ── WebView message handlers ──────────────────────────────────────────────

  /** Highlight changed, or a pending comment-delete's mark came out — fold the delete in as one undo step. */
  const onChangeHtml = useCallback(
    (html: string) => {
      const pending = pendingDeleteRef.current;
      if (pending) {
        pendingDeleteRef.current = null;
        persist(html, commentsRef.current.filter((c) => c.id !== pending));
      } else {
        persist(html, commentsRef.current);
      }
    },
    [persist],
  );

  /** The student selected text with the comment tool — open the editor. */
  const onRequestComment = useCallback(
    (cid: string, quote: string, html: string) => setDraft({ cid, quote, html }),
    [],
  );

  /** They tapped an existing comment marker — open it to read/edit/delete. */
  const onOpenComment = useCallback((cid: string) => setOpenId(cid), []);

  // ── Comment editor actions (the screen wires these to the modal) ──────────

  /** Save a brand-new comment; its anchor mark is already in `draft.html`. */
  const saveDraft = useCallback(
    (body: string) => {
      if (!draft) return;
      const next = [
        ...commentsRef.current,
        { id: draft.cid, quote: draft.quote, body: body.trim(), createdAt: new Date().toISOString() },
      ];
      persist(draft.html, next);
      setDraft(null);
    },
    [draft, persist],
  );

  /** Cancel a new comment; returns its cid so the screen can unwrap the mark in the WebView. */
  const discardDraft = useCallback((): string | null => {
    const cid = draft?.cid ?? null;
    setDraft(null);
    return cid;
  }, [draft]);

  /** Edit an existing comment's body (the anchor mark stays where it is). */
  const saveEdit = useCallback(
    (id: string, body: string) => {
      const next = commentsRef.current.map((cmt) =>
        cmt.id === id ? { ...cmt, body: body.trim() } : cmt,
      );
      persist(htmlRef.current, next);
      setOpenId(null);
    },
    [persist],
  );

  /** Remove a comment: mark pending + close; the mark unwrap commits both as one undo step. */
  const removeComment = useCallback((id: string) => {
    pendingDeleteRef.current = id;
    setOpenId(null);
  }, []);

  const closeOpen = useCallback(() => setOpenId(null), []);

  // ── Undo / redo ───────────────────────────────────────────────────────────

  /** Step back one change; returns the HTML to push into the WebView, or null. */
  const undo = useCallback((): string | null => {
    const prev = pastRef.current.pop();
    if (!prev) return null;
    futureRef.current.push({ html: htmlRef.current, comments: commentsRef.current });
    write(prev.html, prev.comments);
    syncHistory();
    // Any open editor/draft is stale after a jump — close it.
    setDraft(null);
    setOpenId(null);
    pendingDeleteRef.current = null;
    return prev.html;
  }, [write, syncHistory]);

  /** Step forward one undone change. Returns the HTML to push into the WebView. */
  const redo = useCallback((): string | null => {
    const next = futureRef.current.pop();
    if (!next) return null;
    pastRef.current.push({ html: htmlRef.current, comments: commentsRef.current });
    write(next.html, next.comments);
    syncHistory();
    setDraft(null);
    setOpenId(null);
    pendingDeleteRef.current = null;
    return next.html;
  }, [write, syncHistory]);

  const openedComment = openId ? comments.find((c) => c.id === openId) ?? null : null;

  return {
    initialHtml,
    comments,
    mode,
    setMode,
    highlightColor,
    setHighlightColor,
    onChangeHtml,
    onRequestComment,
    onOpenComment,
    draft,
    openedComment,
    saveDraft,
    discardDraft,
    saveEdit,
    removeComment,
    closeOpen,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
