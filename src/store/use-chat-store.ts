// The Ask chat store — the active conversation, the saved-session history, and
// the one action that drives a grounded answer end to end (retrieve → stream →
// cite). Conversations persist to SQLite so a student can reopen a past chat.
//
// Screens stay thin: the Ask screen renders `messages` and calls `send`; the
// history screen renders `sessions` and calls `openSession` / `deleteSession`.
// All the orchestration (optimistic bubbles, live token append, persistence,
// fallback + friendly errors) lives here so the trust logic is in one place.

import { create } from 'zustand';

import { BtlError } from '@/lib/btl';
import { answerBeyondNotes, askFromNotes, continueAnswer } from '@/lib/chat';
import {
  deleteChatSession,
  insertChatMessage,
  insertChatSession,
  listChatMessages,
  listChatSessions,
  touchChatSession,
  updateChatMessageContent,
} from '@/lib/db';
import { useUserStore } from '@/store/use-user-store';
import type { ChatMessage, ChatSession } from '@/types/chat';

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** First line of the opening question, trimmed to a tidy history-list title. */
function deriveTitle(question: string): string {
  const firstLine = question.split('\n')[0].trim();
  return firstLine.length > 48 ? `${firstLine.slice(0, 47).trimEnd()}…` : firstLine;
}

// Last-resort copy for a non-BtlError throw (shouldn't happen — chat.ts only
// throws BtlError — but never leak a raw stack trace to a stressed student).
const GENERIC_ERROR = 'Something went wrong reaching your study assistant. Please try again.';

type ChatState = {
  /** Turns of the conversation currently open on the Ask screen. */
  messages: ChatMessage[];
  /** Saved conversations, newest-used first — the history list. */
  sessions: ChatSession[];
  /** The open conversation's id, or null for a fresh unsaved chat. */
  activeSessionId: string | null;
  sending: boolean;
  /** False until the session list has been read from SQLite once. */
  loaded: boolean;
  /** Load the saved-session list once on app start. */
  init: () => Promise<void>;
  /** Send a question and stream a grounded answer (persists the turn). */
  send: (question: string) => Promise<void>;
  /** Continue a cut-off answer ("Generate more") — appends the extra text. */
  generateMore: (messageId: string) => Promise<void>;
  /** Opt-in: answer the same question from general knowledge, OUTSIDE the notes.
   *  Adds a clearly-marked "Beyond your notes" reply (with References) below. */
  answerBeyond: (messageId: string) => Promise<void>;
  /** Start a fresh, empty conversation (the current one stays saved). */
  newChat: () => void;
  /** Reopen a saved conversation from history. */
  openSession: (id: string) => Promise<void>;
  /** Delete a saved conversation; resets to a fresh chat if it was open. */
  deleteSession: (id: string) => Promise<void>;
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  sessions: [],
  activeSessionId: null,
  sending: false,
  loaded: false,

  init: async () => {
    if (get().loaded) return;
    try {
      const sessions = await listChatSessions();
      set({ sessions, loaded: true });
    } catch (err) {
      // Never block Ask over storage — just start with an empty history.
      console.warn('[chat] failed to load sessions', err);
      set({ loaded: true });
    }
  },

  send: async (raw) => {
    const question = raw.trim();
    if (!question || get().sending) return;

    // First message of a fresh chat → create (and persist) its session up front
    // so it appears in history immediately, even mid-answer.
    let sessionId = get().activeSessionId;
    const startedAt = new Date().toISOString();
    if (!sessionId) {
      sessionId = createId();
      set({ activeSessionId: sessionId });
      void insertChatSession({
        id: sessionId,
        title: deriveTitle(question),
        createdAt: startedAt,
        updatedAt: startedAt,
      });
    }

    // Show the question and an empty assistant bubble immediately; the bubble
    // fills in as tokens stream (or flips to the fallback / error).
    const userMsg: ChatMessage = {
      id: createId(),
      role: 'user',
      content: question,
      grounded: false,
      citations: [],
      createdAt: startedAt,
    };
    const aiId = createId();
    const aiMsg: ChatMessage = {
      id: aiId,
      role: 'assistant',
      content: '',
      grounded: false,
      citations: [],
      streaming: true,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, userMsg, aiMsg], sending: true }));
    void insertChatMessage(sessionId, userMsg);

    const patchAi = (fields: Partial<ChatMessage>) =>
      set((s) => ({
        messages: s.messages.map((m) => (m.id === aiId ? { ...m, ...fields } : m)),
      }));

    // Built in both branches below, then persisted + used to bump the session.
    let settled: ChatMessage;
    try {
      const result = await askFromNotes(question, {
        onToken: (delta) =>
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === aiId ? { ...m, content: m.content + delta } : m,
            ),
          })),
      });
      settled = {
        ...aiMsg,
        content: result.content,
        grounded: result.grounded,
        citations: result.citations,
        truncated: result.truncated,
        streaming: false,
        error: false,
      };
      patchAi(settled);
      // Only a real, note-backed answer counts toward the Dashboard's stat.
      if (result.grounded) void useUserStore.getState().incrementAiAnswers();
    } catch (err) {
      const friendly = err instanceof BtlError ? err.friendly : GENERIC_ERROR;
      settled = {
        ...aiMsg,
        content: friendly,
        grounded: false,
        citations: [],
        streaming: false,
        error: true,
      };
      patchAi(settled);
    } finally {
      set({ sending: false });
    }

    // Persist the finished answer and bump the session to the top of history.
    const finishedAt = new Date().toISOString();
    await insertChatMessage(sessionId, settled);
    await touchChatSession(sessionId, finishedAt);
    try {
      set({ sessions: await listChatSessions() });
    } catch {
      // A stale history list is harmless — it refreshes next time it opens.
    }
  },

  generateMore: async (messageId) => {
    const { messages, activeSessionId, sending } = get();
    if (sending) return;
    const idx = messages.findIndex((m) => m.id === messageId);
    const answer = messages[idx];
    // The first answer is a short briefing, so "Generate more" is offered under any
    // grounded reply — continue unless the notes have already been exhausted.
    if (!answer || answer.role !== 'assistant' || !answer.grounded || answer.exhausted) return;
    // The question is the nearest preceding user turn.
    const question = messages
      .slice(0, idx)
      .reverse()
      .find((m) => m.role === 'user')?.content;
    if (!question) return;

    const patch = (fields: Partial<ChatMessage>) =>
      set((s) => ({
        messages: s.messages.map((m) => (m.id === messageId ? { ...m, ...fields } : m)),
      }));

    set({ sending: true });
    patch({ continuing: true });
    try {
      // Buffered (not streamed live): the model may reply with the "nothing more"
      // marker, which we must discard rather than flash on screen.
      const result = await continueAnswer(question, answer.content);
      const merged =
        result.exhausted || !result.content
          ? { continuing: false, exhausted: true }
          : {
              content: `${answer.content}\n\n${result.content}`,
              truncated: result.truncated,
              continuing: false,
            };
      patch(merged);
      if (merged.content && activeSessionId) {
        void updateChatMessageContent(messageId, merged.content);
      }
    } catch {
      // Leave the answer intact; just drop the spinner and keep "Generate more".
      patch({ continuing: false });
    } finally {
      set({ sending: false });
    }
  },

  answerBeyond: async (messageId) => {
    const { messages, activeSessionId, sending } = get();
    if (sending) return;
    const idx = messages.findIndex((m) => m.id === messageId);
    const source = messages[idx];
    // Only branch off a settled, real answer (grounded or the not-in-notes reply).
    if (!source || source.role !== 'assistant' || source.beyond || source.error) return;
    const question = messages
      .slice(0, idx)
      .reverse()
      .find((m) => m.role === 'user')?.content;
    if (!question) return;

    // Retire the source's button and drop in a streaming "beyond" bubble below it.
    const beyondId = createId();
    const beyondMsg: ChatMessage = {
      id: beyondId,
      role: 'assistant',
      content: '',
      grounded: false,
      citations: [],
      streaming: true,
      beyond: true,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      messages: [
        ...s.messages.map((m) => (m.id === messageId ? { ...m, beyondAsked: true } : m)),
        beyondMsg,
      ],
      sending: true,
    }));

    const patchBeyond = (fields: Partial<ChatMessage>) =>
      set((s) => ({
        messages: s.messages.map((m) => (m.id === beyondId ? { ...m, ...fields } : m)),
      }));

    let settled: ChatMessage;
    try {
      const result = await answerBeyondNotes(question, {
        onToken: (delta) =>
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === beyondId ? { ...m, content: m.content + delta } : m,
            ),
          })),
      });
      settled = { ...beyondMsg, content: result.content, truncated: false, streaming: false };
      patchBeyond(settled);
    } catch (err) {
      const friendly = err instanceof BtlError ? err.friendly : GENERIC_ERROR;
      // An error bubble is no longer a "beyond" answer — clear the flag so it
      // renders as a plain friendly error, not under the "Beyond your notes" header.
      settled = { ...beyondMsg, content: friendly, streaming: false, beyond: false, error: true };
      patchBeyond(settled);
    } finally {
      set({ sending: false });
    }

    if (activeSessionId && !settled.error) {
      await insertChatMessage(activeSessionId, settled);
      await touchChatSession(activeSessionId, new Date().toISOString());
    }
  },

  newChat: () => set({ messages: [], activeSessionId: null }),

  openSession: async (id) => {
    const messages = await listChatMessages(id);
    set({ messages, activeSessionId: id });
  },

  deleteSession: async (id) => {
    await deleteChatSession(id);
    set((s) => ({
      sessions: s.sessions.filter((session) => session.id !== id),
      messages: s.activeSessionId === id ? [] : s.messages,
      activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
    }));
  },
}));
