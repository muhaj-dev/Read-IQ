// SQLite helpers — the single place raw SQL lives. Screens and stores call these
// functions, never SQL directly (see AGENTS.md → Database Rules).

import * as SQLite from 'expo-sqlite';

import type { ChatMessage, ChatSession, Citation, Role } from '@/types/chat';
import type { Deadline } from '@/types/deadline';
import type { Note, NoteAttachment, NoteComment, NoteSource, PdfAnnotations } from '@/types/note';
import type { PodcastCoverage, PodcastEpisode, PodcastTurn } from '@/types/podcast';
import type { GeneratedQuiz, QuizQuestion, QuizResult } from '@/types/quiz';
import type { StoredChunk } from '@/types/retrieval';

const DB_NAME = 'noteiq.db';

// notes has a `tags` JSON column; `subjects` remembers courses for the picker.
const SCHEMA = `
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS notes (
    id         TEXT PRIMARY KEY NOT NULL,
    title      TEXT NOT NULL,
    subject    TEXT,
    content    TEXT NOT NULL,
    source     TEXT NOT NULL,
    tags       TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS subjects (
    name       TEXT PRIMARY KEY NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS note_chunks (
    id           TEXT PRIMARY KEY NOT NULL,
    note_id      TEXT NOT NULL,
    idx          INTEGER NOT NULL,
    text         TEXT NOT NULL,
    embedding    TEXT NOT NULL,   -- JSON float array (text-embedding-3-small, 1536-dim)
    content_hash TEXT NOT NULL,   -- note's searchable-text hash when embedded (staleness)
    created_at   TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_note_chunks_note ON note_chunks (note_id);
  CREATE TABLE IF NOT EXISTS chat_sessions (
    id         TEXT PRIMARY KEY NOT NULL,
    title      TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS chat_messages (
    id         TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL,
    role       TEXT NOT NULL,
    content    TEXT NOT NULL,
    grounded   INTEGER NOT NULL DEFAULT 0,
    citations  TEXT NOT NULL DEFAULT '[]',
    error      INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS podcast_episodes (
    note_id      TEXT PRIMARY KEY NOT NULL,
    content_hash TEXT NOT NULL,
    title        TEXT NOT NULL,
    coverage     TEXT NOT NULL,
    turns        TEXT NOT NULL,
    created_at   TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS quizzes (
    source_id    TEXT PRIMARY KEY NOT NULL,
    content_hash TEXT NOT NULL,
    source_label TEXT NOT NULL,
    questions    TEXT NOT NULL,
    created_at   TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS quiz_results (
    id           TEXT PRIMARY KEY NOT NULL,
    source_id    TEXT NOT NULL,
    source_label TEXT NOT NULL,
    total        INTEGER NOT NULL,
    correct      INTEGER NOT NULL,
    weak_topics  TEXT NOT NULL DEFAULT '[]',
    created_at   TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS deadlines (
    id             TEXT PRIMARY KEY NOT NULL,
    title          TEXT NOT NULL,
    subject        TEXT,
    type           TEXT NOT NULL DEFAULT '',
    due_date       TEXT NOT NULL,
    reminder_on    INTEGER NOT NULL DEFAULT 0,
    reminder_label TEXT NOT NULL DEFAULT '',
    repeat         TEXT NOT NULL DEFAULT '',
    notes          TEXT NOT NULL DEFAULT '',
    color_index    INTEGER NOT NULL DEFAULT 0,
    created_at     TEXT NOT NULL
  );
`;

// Open + migrate exactly once; every helper awaits this so ordering never matters.
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Add columns introduced after the first schema shipped (CREATE IF NOT EXISTS can't alter). */
async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info('notes')");
  const names = new Set(cols.map((c) => c.name));
  if (!names.has('content_html')) {
    await db.execAsync('ALTER TABLE notes ADD COLUMN content_html TEXT');
  }
  if (!names.has('attachments')) {
    await db.execAsync("ALTER TABLE notes ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]'");
  }
  // Reader annotations: highlighted/commented HTML + the comment bodies.
  if (!names.has('reader_html')) {
    await db.execAsync('ALTER TABLE notes ADD COLUMN reader_html TEXT');
  }
  if (!names.has('comments')) {
    await db.execAsync("ALTER TABLE notes ADD COLUMN comments TEXT NOT NULL DEFAULT '[]'");
  }
  // AI summary of the note's own text (upload flow fills it; null otherwise).
  if (!names.has('ai_summary')) {
    await db.execAsync('ALTER TABLE notes ADD COLUMN ai_summary TEXT');
  }
  // PDF Reader annotations (highlights/comments as page geometry); null until first annotation.
  if (!names.has('pdf_annotations')) {
    await db.execAsync('ALTER TABLE notes ADD COLUMN pdf_annotations TEXT');
  }

  await migrateQuizTables(db);
}

/** Quiz tables were re-keyed note_id → source_id (per-subject). Old devices lack
 *  the column and CREATE IF NOT EXISTS won't alter; both tables are disposable, so
 *  drop and recreate when source_id is missing. */
async function migrateQuizTables(db: SQLite.SQLiteDatabase): Promise<void> {
  const hasSourceId = async (table: string) => {
    const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info('${table}')`);
    return cols.length === 0 || cols.some((c) => c.name === 'source_id');
  };

  if (!(await hasSourceId('quizzes'))) {
    await db.execAsync('DROP TABLE IF EXISTS quizzes');
    await db.execAsync(
      `CREATE TABLE quizzes (
         source_id    TEXT PRIMARY KEY NOT NULL,
         content_hash TEXT NOT NULL,
         source_label TEXT NOT NULL,
         questions    TEXT NOT NULL,
         created_at   TEXT NOT NULL
       )`,
    );
  }

  if (!(await hasSourceId('quiz_results'))) {
    await db.execAsync('DROP TABLE IF EXISTS quiz_results');
    await db.execAsync(
      `CREATE TABLE quiz_results (
         id           TEXT PRIMARY KEY NOT NULL,
         source_id    TEXT NOT NULL,
         source_label TEXT NOT NULL,
         total        INTEGER NOT NULL,
         correct      INTEGER NOT NULL,
         weak_topics  TEXT NOT NULL DEFAULT '[]',
         created_at   TEXT NOT NULL
       )`,
    );
  }
}

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(SCHEMA);
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

type NoteRow = {
  id: string;
  title: string;
  subject: string | null;
  content: string;
  content_html: string | null;
  source: string;
  tags: string;
  attachments: string | null;
  reader_html: string | null;
  comments: string | null;
  ai_summary: string | null;
  pdf_annotations: string | null;
  created_at: string;
};

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

function parseAttachments(raw: string | null): NoteAttachment[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as NoteAttachment[]) : [];
  } catch {
    return [];
  }
}

function parseComments(raw: string | null): NoteComment[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as NoteComment[]) : [];
  } catch {
    return [];
  }
}

function parsePdfAnnotations(raw: string | null): PdfAnnotations | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
    };
  } catch {
    return null;
  }
}

function rowToNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    content: row.content,
    contentHtml: row.content_html ?? null,
    source: row.source as NoteSource,
    tags: parseTags(row.tags),
    attachments: parseAttachments(row.attachments),
    readerHtml: row.reader_html ?? null,
    comments: parseComments(row.comments),
    pdfAnnotations: parsePdfAnnotations(row.pdf_annotations),
    aiSummary: row.ai_summary ?? null,
    createdAt: row.created_at,
  };
}

export async function insertNote(note: Note): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO notes (id, title, subject, content, content_html, source, tags, attachments, reader_html, comments, pdf_annotations, ai_summary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    note.id,
    note.title,
    note.subject,
    note.content,
    note.contentHtml,
    note.source,
    JSON.stringify(note.tags),
    JSON.stringify(note.attachments),
    note.readerHtml,
    JSON.stringify(note.comments),
    note.pdfAnnotations ? JSON.stringify(note.pdfAnnotations) : null,
    note.aiSummary,
    note.createdAt,
  );
}

/** Every saved note, newest first — the Memory Panel's source of truth. */
export async function listNotes(): Promise<Note[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<NoteRow>('SELECT * FROM notes ORDER BY created_at DESC');
  return rows.map(rowToNote);
}

export async function getNoteById(id: string): Promise<Note | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<NoteRow>('SELECT * FROM notes WHERE id = ?', id);
  return row ? rowToNote(row) : null;
}

export async function updateNote(
  id: string,
  fields: {
    title: string;
    subject: string | null;
    content: string;
    contentHtml: string | null;
    tags: string[];
    attachments: NoteAttachment[];
    readerHtml: string | null;
    comments: NoteComment[];
    pdfAnnotations: PdfAnnotations | null;
  },
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE notes SET title = ?, subject = ?, content = ?, content_html = ?, tags = ?, attachments = ?, reader_html = ?, comments = ?, pdf_annotations = ? WHERE id = ?',
    fields.title,
    fields.subject,
    fields.content,
    fields.contentHtml,
    JSON.stringify(fields.tags),
    JSON.stringify(fields.attachments),
    fields.readerHtml,
    JSON.stringify(fields.comments),
    fields.pdfAnnotations ? JSON.stringify(fields.pdfAnnotations) : null,
    id,
  );
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM notes WHERE id = ?', id);
  // Drop the note's retrieval vectors and cached podcast; quizzes are subject-keyed and self-heal.
  await db.runAsync('DELETE FROM note_chunks WHERE note_id = ?', id);
  await db.runAsync('DELETE FROM podcast_episodes WHERE note_id = ?', id);
}

// ── Note chunk vectors (semantic retrieval) ──────────────────────────────────
// One row per chunk; embedded once on save/edit, read at question time to cosine-
// rank against the query. Persisting them makes retrieval instant and offline for
// already-embedded notes. See lib/embeddings.ts (write) + lib/retrieval.ts (read).

type ChunkRow = {
  note_id: string;
  idx: number;
  text: string;
  embedding: string;
  content_hash: string;
};

function parseEmbedding(raw: string): number[] | null {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((n) => typeof n === 'number') ? parsed : null;
  } catch {
    return null;
  }
}

/** Every stored chunk vector across all notes — the corpus retrieval cosine-ranks.
 *  Rows with an unparseable vector are skipped (treated as not-yet-embedded). */
export async function getAllNoteChunks(): Promise<StoredChunk[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ChunkRow>(
    'SELECT note_id, idx, text, embedding, content_hash FROM note_chunks',
  );
  const chunks: StoredChunk[] = [];
  for (const r of rows) {
    const embedding = parseEmbedding(r.embedding);
    if (!embedding) continue;
    chunks.push({ noteId: r.note_id, idx: r.idx, text: r.text, embedding, contentHash: r.content_hash });
  }
  return chunks;
}

/** noteId → the content_hash its stored chunks were embedded from (any chunk suffices,
 *  since a note's chunks are written together). Lets backfill skip up-to-date notes. */
export async function getNoteChunkHashes(): Promise<Map<string, string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ note_id: string; content_hash: string }>(
    'SELECT note_id, content_hash FROM note_chunks GROUP BY note_id',
  );
  return new Map(rows.map((r) => [r.note_id, r.content_hash]));
}

/** Replace a note's vectors atomically (delete old, insert fresh) after a save/edit. */
export async function replaceNoteChunks(noteId: string, chunks: StoredChunk[]): Promise<void> {
  const db = await getDb();
  const createdAt = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM note_chunks WHERE note_id = ?', noteId);
    for (const c of chunks) {
      await db.runAsync(
        'INSERT INTO note_chunks (id, note_id, idx, text, embedding, content_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        `${noteId}:${c.idx}`,
        noteId,
        c.idx,
        c.text,
        JSON.stringify(c.embedding),
        c.contentHash,
        createdAt,
      );
    }
  });
}

/** Drop a note's vectors (e.g. its text was cleared) without touching the note row. */
export async function deleteNoteChunks(noteId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM note_chunks WHERE note_id = ?', noteId);
}

/** Custom subjects/courses the student added, oldest first. */
export async function listSubjects(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ name: string }>('SELECT name FROM subjects ORDER BY created_at ASC');
  return rows.map((r) => r.name);
}

export async function insertSubject(name: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR IGNORE INTO subjects (name, created_at) VALUES (?, ?)',
    name,
    new Date().toISOString(),
  );
}

// ── Chat history (Ask ★ conversations) ──────────────────────────────────────
// A session is one conversation; its messages are the turns.

type SessionRow = {
  id: string;
  title: string;
  preview: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  role: string;
  content: string;
  grounded: number;
  citations: string;
  error: number;
  created_at: string;
};

function parseCitations(raw: string): Citation[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Citation[]) : [];
  } catch {
    return [];
  }
}

/** Create a new conversation row (called when the first message is sent). */
export async function insertChatSession(session: {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO chat_sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)',
    session.id,
    session.title,
    session.createdAt,
    session.updatedAt,
  );
}

/** Bump a session's updated_at so it sorts to the top of the history list. */
export async function touchChatSession(id: string, updatedAt: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE chat_sessions SET updated_at = ? WHERE id = ?', updatedAt, id);
}

/** Every saved conversation, most-recently-used first — the history list. */
export async function listChatSessions(): Promise<ChatSession[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SessionRow>(
    `SELECT s.id, s.title, s.created_at, s.updated_at,
       (SELECT COUNT(*) FROM chat_messages m WHERE m.session_id = s.id) AS message_count,
       (SELECT content FROM chat_messages m
          WHERE m.session_id = s.id AND m.role = 'user'
          ORDER BY m.created_at ASC LIMIT 1) AS preview
     FROM chat_sessions s
     ORDER BY s.updated_at DESC`,
  );
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    preview: r.preview ?? '',
    messageCount: r.message_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

/** All turns of one conversation, oldest first (chat reading order). */
export async function listChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MessageRow>(
    'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
    sessionId,
  );
  return rows.map((r) => ({
    id: r.id,
    role: r.role as Role,
    content: r.content,
    grounded: r.grounded === 1,
    citations: parseCitations(r.citations),
    error: r.error === 1,
    createdAt: r.created_at,
  }));
}

/** Persist one settled turn (a user question or a finished assistant answer). */
export async function insertChatMessage(sessionId: string, message: ChatMessage): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO chat_messages (id, session_id, role, content, grounded, citations, error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    message.id,
    sessionId,
    message.role,
    message.content,
    message.grounded ? 1 : 0,
    JSON.stringify(message.citations),
    message.error ? 1 : 0,
    message.createdAt,
  );
}

/** Overwrite one turn's text — used when "Generate more" appends a continuation
 *  to a settled answer so the fuller text survives reopening the conversation. */
export async function updateChatMessageContent(id: string, content: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE chat_messages SET content = ? WHERE id = ?', content, id);
}

/** Delete a conversation and all of its turns. */
export async function deleteChatSession(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM chat_messages WHERE session_id = ?', id);
  await db.runAsync('DELETE FROM chat_sessions WHERE id = ?', id);
}

// ── Podcast episodes ("From Your Notes") ─────────────────────────────────────
// One cached episode per note; `content_hash` flags a stale episode after edits.

type EpisodeRow = {
  note_id: string;
  content_hash: string;
  title: string;
  coverage: string;
  turns: string;
  created_at: string;
};

function parseTurns(raw: string): PodcastTurn[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t): t is PodcastTurn => !!t && typeof t.text === 'string')
      .map((t) => ({ speaker: t.speaker === 'B' ? 'B' : 'A', text: t.text }));
  } catch {
    return [];
  }
}

/** The note's cached episode, or null if none has been generated yet. */
export async function getPodcastEpisode(noteId: string): Promise<PodcastEpisode | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<EpisodeRow>(
    'SELECT * FROM podcast_episodes WHERE note_id = ?',
    noteId,
  );
  if (!row) return null;
  return {
    noteId: row.note_id,
    contentHash: row.content_hash,
    title: row.title,
    coverage: row.coverage as PodcastCoverage,
    turns: parseTurns(row.turns),
    createdAt: row.created_at,
  };
}

/** Save (or replace) the note's episode — one per note, newest wins. */
export async function savePodcastEpisode(episode: PodcastEpisode): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO podcast_episodes (note_id, content_hash, title, coverage, turns, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    episode.noteId,
    episode.contentHash,
    episode.title,
    episode.coverage,
    JSON.stringify(episode.turns),
    episode.createdAt,
  );
}

// ── Quizzes ──────────────────────────────────────────────────────────────────
// Cached quiz per subject so a retake replays free; `quiz_results` is the
// finished-attempt history the Dashboard reads for score + weak topics.

type QuizRow = {
  source_id: string;
  content_hash: string;
  source_label: string;
  questions: string;
  created_at: string;
};

function parseQuestions(raw: string): QuizQuestion[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QuizQuestion[]) : [];
  } catch {
    return [];
  }
}

/** The subject's cached quiz, or null if none has been generated yet. */
export async function getQuiz(sourceId: string): Promise<GeneratedQuiz | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<QuizRow>('SELECT * FROM quizzes WHERE source_id = ?', sourceId);
  if (!row) return null;
  return {
    sourceId: row.source_id,
    contentHash: row.content_hash,
    sourceLabel: row.source_label,
    questions: parseQuestions(row.questions),
    createdAt: row.created_at,
  };
}

/** Save (or replace) the subject's quiz — one per subject, newest wins. */
export async function saveQuiz(quiz: GeneratedQuiz): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO quizzes (source_id, content_hash, source_label, questions, created_at) VALUES (?, ?, ?, ?, ?)',
    quiz.sourceId,
    quiz.contentHash,
    quiz.sourceLabel,
    JSON.stringify(quiz.questions),
    quiz.createdAt,
  );
}

type QuizResultRow = {
  id: string;
  source_id: string;
  source_label: string;
  total: number;
  correct: number;
  weak_topics: string;
  created_at: string;
};

function parseWeakTopics(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

/** Persist one finished attempt. */
export async function insertQuizResult(result: QuizResult): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO quiz_results (id, source_id, source_label, total, correct, weak_topics, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    result.id,
    result.sourceId,
    result.sourceLabel,
    result.total,
    result.correct,
    JSON.stringify(result.weakTopics),
    result.createdAt,
  );
}

/** Recent finished attempts, newest first — the Dashboard's quiz data source. */
export async function listQuizResults(limit = 20): Promise<QuizResult[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<QuizResultRow>(
    'SELECT * FROM quiz_results ORDER BY created_at DESC LIMIT ?',
    limit,
  );
  return rows.map((r) => ({
    id: r.id,
    sourceId: r.source_id,
    sourceLabel: r.source_label,
    total: r.total,
    correct: r.correct,
    weakTopics: parseWeakTopics(r.weak_topics),
    createdAt: r.created_at,
  }));
}

// ── Deadlines ────────────────────────────────────────────────────────────────
// Urgency + countdown are derived from due_date at read time, never stored.

type DeadlineRow = {
  id: string;
  title: string;
  subject: string | null;
  type: string;
  due_date: string;
  reminder_on: number;
  reminder_label: string;
  repeat: string;
  notes: string;
  color_index: number;
  created_at: string;
};

function rowToDeadline(row: DeadlineRow): Deadline {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    type: row.type,
    dueDate: row.due_date,
    reminderOn: row.reminder_on === 1,
    reminderLabel: row.reminder_label,
    repeat: row.repeat,
    notes: row.notes,
    colorIndex: row.color_index,
    createdAt: row.created_at,
  };
}

/** Every saved deadline, soonest-due first. */
export async function listDeadlines(): Promise<Deadline[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<DeadlineRow>('SELECT * FROM deadlines ORDER BY due_date ASC');
  return rows.map(rowToDeadline);
}

export async function insertDeadline(deadline: Deadline): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO deadlines (id, title, subject, type, due_date, reminder_on, reminder_label, repeat, notes, color_index, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    deadline.id,
    deadline.title,
    deadline.subject,
    deadline.type,
    deadline.dueDate,
    deadline.reminderOn ? 1 : 0,
    deadline.reminderLabel,
    deadline.repeat,
    deadline.notes,
    deadline.colorIndex,
    deadline.createdAt,
  );
}

/** Flip a deadline's reminder on/off (the list-card toggle). */
export async function setDeadlineReminder(id: string, on: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE deadlines SET reminder_on = ? WHERE id = ?', on ? 1 : 0, id);
}

export async function deleteDeadline(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM deadlines WHERE id = ?', id);
}
