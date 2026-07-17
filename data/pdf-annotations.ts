// PDF Reader annotation state: active tool, highlight colour, and the comment
// draft/open editor. The WebView owns the geometry and posts the full annotation
// set back on every change; this hook only drives the modal + persists.

import { useCallback, useRef, useState } from 'react';

import { ReaderHighlights } from '@/constants/theme';
import type { AnnotationMode } from '@/data/note-annotations';
import type { NoteDetail } from '@/data/note-detail';
import { useNotesStore } from '@/store/use-notes-store';
import type { PdfAnnotations } from '@/types/note';

const EMPTY: PdfAnnotations = { highlights: [], comments: [] };

/** A new comment awaiting a body; `id` matches its anchor drawn in the WebView. */
export type PdfCommentDraft = { id: string; quote: string };
/** An existing comment opened to read / edit / delete. */
export type PdfOpenComment = { id: string; quote: string; body: string; createdAt: string };

export function usePdfAnnotations(note: NoteDetail) {
  const updateNote = useNotesStore((s) => s.updateNote);

  // Baked into the WebView doc once; tool/colour changes must not rebuild it.
  const initialAnnotations = useRef<PdfAnnotations>(note.pdfAnnotations ?? EMPTY).current;

  const [mode, setMode] = useState<AnnotationMode>('view');
  const [highlightColor, setHighlightColor] = useState<string>(ReaderHighlights[0]);
  const [draft, setDraft] = useState<PdfCommentDraft | null>(null);
  const [opened, setOpened] = useState<PdfOpenComment | null>(null);

  /** WebView posted a new geometry set — persist it to the note. */
  const onSave = useCallback(
    (annotations: PdfAnnotations) => updateNote(note.id, { pdfAnnotations: annotations }),
    [note.id, updateNote],
  );

  const onRequestComment = useCallback((id: string, quote: string) => setDraft({ id, quote }), []);
  const onOpenComment = useCallback((c: PdfOpenComment) => setOpened(c), []);

  const closeDraft = useCallback(() => setDraft(null), []);
  const closeOpened = useCallback(() => setOpened(null), []);

  return {
    initialAnnotations,
    mode,
    setMode,
    highlightColor,
    setHighlightColor,
    draft,
    opened,
    onSave,
    onRequestComment,
    onOpenComment,
    closeDraft,
    closeOpened,
  };
}
