// Ask chat store: active conversation + saved-session history + the grounded-answer flow (retrieve → stream → cite).

import { create } from 'zustand';

import { buildImageNoteInput, inferTopic } from '@/lib/ask-image';
import { BtlError } from '@/lib/btl';
import {
  answerBeyondNotes,
  answerImageGrounded,
  answerImageOpen,
  askFromNotes,
  continueAnswer,
} from '@/lib/chat';
import {
  deleteChatSession,
  insertChatMessage,
  insertChatSession,
  listChatMessages,
  listChatSessions,
  touchChatSession,
  updateChatMessageContent,
} from '@/lib/db';
import { extractImageText } from '@/lib/ocr';
import { useNotesStore } from '@/store/use-notes-store';
import { useUserStore } from '@/store/use-user-store';
import type { ChatAttachment, ChatMessage, Citation, ChatSession } from '@/types/chat';

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** First line of the opening question, trimmed to a tidy history-list title. */
function deriveTitle(question: string): string {
  const firstLine = question.split('\n')[0].trim();
  return firstLine.length > 48 ? `${firstLine.slice(0, 47).trimEnd()}…` : firstLine;
}

// Last-resort copy for a non-BtlError throw — never leak a raw stack trace.
const GENERIC_ERROR = 'Something went wrong reaching your study assistant. Please try again.';

// Copy for the attached-image paths — honest about what happened to the photo.
const IMAGE_UNREADABLE =
  "I couldn't read any text in that image. Try a clearer photo, or type your question instead.";
const IMAGE_DECISION_PROMPT =
  "This isn't in your saved notes yet. Want me to save this image to your memory so I can " +
  'use it later — or just answer this once? Either way I answer from the image itself.';

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
  /** Send a question (optionally with attached images) and stream a grounded answer. */
  send: (question: string, attachments?: ChatAttachment[]) => Promise<void>;
  /** Resolve an attached-image prompt: save it to memory (+ answer) or answer once. */
  resolveImageDecision: (messageId: string, choice: 'saved' | 'once') => Promise<void>;
  /** Continue a cut-off answer ("Generate more") — appends the extra text. */
  generateMore: (messageId: string) => Promise<void>;
  /** Opt-in: answer from general knowledge, OUTSIDE the notes ("Beyond your notes"). */
  answerBeyond: (messageId: string) => Promise<void>;
  /** Start a fresh, empty conversation (the current one stays saved). */
  newChat: () => void;
  /** Reopen a saved conversation from history. */
  openSession: (id: string) => Promise<void>;
  /** Delete a saved conversation; resets to a fresh chat if it was open. */
  deleteSession: (id: string) => Promise<void>;
};

/** A plain text question → grounded answer from the saved notes. Throws BtlError. */
async function runTextTurn(
  question: string,
  aiMsg: ChatMessage,
  streamAi: (delta: string) => void,
): Promise<ChatMessage> {
  const result = await askFromNotes(question, { onToken: streamAi });
  return {
    ...aiMsg,
    content: result.content,
    grounded: result.grounded,
    citations: result.citations,
    truncated: result.truncated,
    streaming: false,
  };
}

/** A question with attached image(s): OCR → answer from notes+image, or (if the
 *  topic isn't in the notes) return a prompt asking to save it. Throws BtlError. */
async function runImageTurn(
  question: string,
  attachments: ChatAttachment[],
  aiMsg: ChatMessage,
  streamAi: (delta: string) => void,
): Promise<ChatMessage> {
  const texts = await Promise.all(attachments.map((a) => extractImageText(a.uri)));
  const imageText = texts.map((t) => t.trim()).filter(Boolean).join('\n\n');
  if (!imageText) return { ...aiMsg, content: IMAGE_UNREADABLE, streaming: false };

  // Topic already in the notes → answer strictly from notes + image (grounded, cited).
  const grounded = await answerImageGrounded(question, imageText, { onToken: streamAi });
  if (grounded) {
    return {
      ...aiMsg,
      content: grounded.content,
      grounded: grounded.grounded,
      citations: grounded.citations,
      truncated: grounded.truncated,
      fromImage: true,
      streaming: false,
    };
  }

  // Not in the notes → ask the student whether to save it (resolveImageDecision answers).
  const topic = inferTopic(question, imageText);
  return {
    ...aiMsg,
    content: IMAGE_DECISION_PROMPT,
    streaming: false,
    imageDecision: { question, imageText, imageUri: attachments[0].uri, topic },
  };
}

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

  send: async (raw, attachments = []) => {
    const question = raw.trim();
    if ((!question && attachments.length === 0) || get().sending) return;

    // First message of a fresh chat → create + persist its session up front, so it shows in history.
    let sessionId = get().activeSessionId;
    const startedAt = new Date().toISOString();
    if (!sessionId) {
      sessionId = createId();
      set({ activeSessionId: sessionId });
      void insertChatSession({
        id: sessionId,
        title: deriveTitle(question || 'Image question'),
        createdAt: startedAt,
        updatedAt: startedAt,
      });
    }

    // Show the question (+ any image thumbnails) and an empty assistant bubble immediately.
    const userMsg: ChatMessage = {
      id: createId(),
      role: 'user',
      content: question,
      grounded: false,
      citations: [],
      attachments: attachments.length ? attachments : undefined,
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
    const streamAi = (delta: string) =>
      set((s) => ({
        messages: s.messages.map((m) => (m.id === aiId ? { ...m, content: m.content + delta } : m)),
      }));

    // Built in every branch below, then persisted + used to bump the session.
    let settled: ChatMessage;
    try {
      settled =
        attachments.length > 0
          ? await runImageTurn(question, attachments, aiMsg, streamAi)
          : await runTextTurn(question, aiMsg, streamAi);
      patchAi(settled);
      // Only a real, note-backed answer counts toward the Dashboard's stat.
      if (settled.grounded && !settled.error) void useUserStore.getState().incrementAiAnswers();
    } catch (err) {
      const friendly = err instanceof BtlError ? err.friendly : GENERIC_ERROR;
      settled = { ...aiMsg, content: friendly, streaming: false, error: true };
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

  resolveImageDecision: async (messageId, choice) => {
    const { messages, activeSessionId, sending } = get();
    if (sending) return;
    const prompt = messages.find((m) => m.id === messageId);
    const pending = prompt?.imageDecision;
    if (!pending || prompt?.decided) return;

    // Retire the prompt's buttons and record the choice.
    set((s) => ({
      messages: s.messages.map((m) => (m.id === messageId ? { ...m, decided: choice } : m)),
    }));

    // "Save to memory" files the read-out image as a real note, connected to the topic.
    let citations: Citation[] = [];
    if (choice === 'saved') {
      try {
        const note = await useNotesStore
          .getState()
          .addNote(buildImageNoteInput(pending.imageText, pending.topic, pending.imageUri));
        citations = [
          { noteId: note.id, noteTitle: note.title, snippet: pending.imageText.slice(0, 160).trim() },
        ];
      } catch {
        // Saving hiccuped — still answer, just without the saved-note tag.
      }
    }

    // Stream the answer (from the image itself) into a fresh bubble below the prompt.
    const ansId = createId();
    const ansMsg: ChatMessage = {
      id: ansId,
      role: 'assistant',
      content: '',
      grounded: false,
      citations: [],
      streaming: true,
      fromImage: true,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, ansMsg], sending: true }));

    let settled: ChatMessage;
    try {
      const result = await answerImageOpen(pending.question, pending.imageText, {
        onToken: (delta) =>
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === ansId ? { ...m, content: m.content + delta } : m,
            ),
          })),
      });
      settled = { ...ansMsg, content: result.content, citations, streaming: false };
    } catch (err) {
      const friendly = err instanceof BtlError ? err.friendly : GENERIC_ERROR;
      settled = { ...ansMsg, content: friendly, streaming: false, fromImage: false, error: true };
    } finally {
      set({ sending: false });
    }
    set((s) => ({ messages: s.messages.map((m) => (m.id === ansId ? settled : m)) }));

    if (activeSessionId && !settled.error) {
      await insertChatMessage(activeSessionId, settled);
      await touchChatSession(activeSessionId, new Date().toISOString());
      try {
        set({ sessions: await listChatSessions() });
      } catch {
        // Stale history refreshes on next open.
      }
    }
  },

  generateMore: async (messageId) => {
    const { messages, activeSessionId, sending } = get();
    if (sending) return;
    const idx = messages.findIndex((m) => m.id === messageId);
    const answer = messages[idx];
    // "Generate more" is offered under any grounded reply — continue unless notes are exhausted.
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
      // Buffered, not streamed: the "nothing more" marker must be discarded, not flashed on screen.
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
      // An error bubble isn't a "beyond" answer — clear the flag so it renders as a plain error.
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
