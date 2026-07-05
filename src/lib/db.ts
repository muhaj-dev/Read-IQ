// SQLite helpers — the single place raw SQL lives. Screens and stores call these
// functions, never SQL directly (see AGENTS.md → Database Rules).

import * as SQLite from 'expo-sqlite';

import type { ChatMessage, ChatSession, Citation, Role } from '@/types/chat';
import type { Note, NoteAttachment, NoteComment, NoteSource } from '@/types/note';
import type { PodcastCoverage, PodcastEpisode, PodcastTurn } from '@/types/podcast';

const DB_NAME = 'noteiq.db';

// The notes table mirrors AGENTS.md's schema, plus a `tags` JSON column so the
// editor's topic tags survive a save. The `subjects` table remembers courses the
// student typed in the editor so they reappear in the picker next session.
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
`;

// Open + migrate exactly once; every helper awaits this so ordering never matters.
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Add columns introduced after the first schema shipped. CREATE TABLE IF NOT
 *  EXISTS can't alter an existing `notes` table, so add missing columns by hand. */
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
    aiSummary: row.ai_summary ?? null,
    createdAt: row.created_at,
  };
}

export async function insertNote(note: Note): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO notes (id, title, subject, content, content_html, source, tags, attachments, reader_html, comments, ai_summary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
  },
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE notes SET title = ?, subject = ?, content = ?, content_html = ?, tags = ?, attachments = ?, reader_html = ?, comments = ? WHERE id = ?',
    fields.title,
    fields.subject,
    fields.content,
    fields.contentHtml,
    JSON.stringify(fields.tags),
    JSON.stringify(fields.attachments),
    fields.readerHtml,
    JSON.stringify(fields.comments),
    id,
  );
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM notes WHERE id = ?', id);
  // A note's cached podcast episode is meaningless once the note is gone.
  await db.runAsync('DELETE FROM podcast_episodes WHERE note_id = ?', id);
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
// A session is one conversation; its messages are the turns. The list view reads
// each session's first question as a preview and counts its turns via subqueries.

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
// One cached episode per note, keyed by note_id. `content_hash` fingerprints the
// note text the script was written from, so the store can tell a fresh episode
// from a stale one (the note changed) without re-reading the whole note.

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
