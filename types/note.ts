// Saved-note domain model — the app's source of truth (stored in SQLite).

/** How the note entered the app — drives the source badge + icon. */
export type NoteSource = 'paste' | 'file' | 'scan' | 'voice';

/** A file/image the student attached to a note (shown in the Attachments list). */
export type NoteAttachmentKind = 'image' | 'file';

export type NoteAttachment = {
  id: string;
  /** Display name, e.g. "week4-notes.pdf" or "Lecture photo". */
  name: string;
  /** Meta line for the card, e.g. "PDF • 2.4 MB" or "Image". */
  meta: string;
  /** Local uri (file:// / cache) used to preview an image or open a file. */
  uri: string;
  kind: NoteAttachmentKind;
  /** MIME type from the picker — detects a PDF when the uri lacks a .pdf extension (Android). */
  mimeType?: string;
};

/** A reader margin note: `quote` is the anchored text, `body` is what the student wrote. */
export type NoteComment = {
  id: string;
  quote: string;
  body: string;
  createdAt: string;
};

/** A rectangle on a PDF page, stored as fractions (0–1) of page size so it re-projects at any zoom. */
export type PdfRect = { x: number; y: number; w: number; h: number };

/** A highlight on the PDF Reader: colour + the page rectangles it covers. */
export type PdfHighlight = {
  id: string;
  /** 1-based page number. */
  page: number;
  color: string;
  rects: PdfRect[];
  quote: string;
  createdAt: string;
};

/** A margin comment on the PDF Reader — like a highlight, but carries a written body. */
export type PdfCommentAnn = {
  id: string;
  page: number;
  rects: PdfRect[];
  quote: string;
  body: string;
  createdAt: string;
};

/** All annotations for a note's PDF Reader (kept separate from the text reader's `readerHtml`). */
export type PdfAnnotations = {
  highlights: PdfHighlight[];
  comments: PdfCommentAnn[];
};

export type Note = {
  id: string;
  title: string;
  subject: string | null;
  /** Plain-text projection — the grounding/retrieval source of truth. */
  content: string;
  /** Rich HTML from the editor (bold, inline images). Null for legacy notes. */
  contentHtml: string | null;
  source: NoteSource;
  /** Free-form topic tags the student added in the editor. */
  tags: string[];
  /** Files/images attached to the note. */
  attachments: NoteAttachment[];
  /** Reader HTML with highlight/comment `<mark>`s. Null until first annotation; kept separate from contentHtml. */
  readerHtml: string | null;
  /** Bodies of the reader's comment markers, keyed by their anchor's data-cid. */
  comments: NoteComment[];
  /** PDF Reader highlights/comments (page geometry). Null until the first PDF annotation. */
  pdfAnnotations: PdfAnnotations | null;
  /** AI summary of this note's text, generated once via BTL. Null until generated. */
  aiSummary: string | null;
  /** ISO timestamp of when the note was saved. */
  createdAt: string;
};

/** What a screen passes to `addNote` — id/title/createdAt are filled in by the store. */
export type NoteInput = {
  title?: string;
  subject?: string | null;
  content: string;
  contentHtml?: string | null;
  source: NoteSource;
  tags?: string[];
  attachments?: NoteAttachment[];
  /** Pre-generated AI summary (upload flow summarizes at save time). */
  aiSummary?: string | null;
};

/** Fields that Edit Note (and the reader's annotations) may change. */
export type NotePatch = Partial<
  Pick<
    Note,
    | 'title'
    | 'subject'
    | 'content'
    | 'contentHtml'
    | 'tags'
    | 'attachments'
    | 'readerHtml'
    | 'comments'
    | 'pdfAnnotations'
    | 'aiSummary'
  >
>;
