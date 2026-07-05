// The single BTL Runtime client.
//
// This is the ONLY file in the app that reads the BTL credentials or knows the
// gateway URL. Every AI feature — grounded Ask (chat), embeddings + retrieval,
// scan OCR, class-recording transcription, and quiz generation — talks to the
// runtime through the helpers here.
//
// The BTL runtime is OpenAI-compatible, so we call it with plain `fetch` against
// the standard /v1 JSON routes. That means NO extra `openai` package dependency:
// "no openai dep" is about HOW we call the gateway (fetch vs the SDK), not
// WHETHER we use it — 100% of AI still flows through BTL. Using fetch keeps the
// bundle small and avoids the Node-oriented SDK's polyfill needs on React Native.
//
// Streaming (grounded Ask) uses `expo/fetch` instead of the global fetch: only it
// exposes a readable `response.body` on React Native so tokens can render as they
// arrive. The global fetch (used everywhere else) buffers the whole body first.

import { fetch as streamingFetch } from 'expo/fetch';

// --- Credentials (read here and NOWHERE else — see AGENTS.md → BTL Runtime Rules)

const API_KEY = process.env.EXPO_PUBLIC_BTL_API_KEY ?? '';
// Normalise the base URL so `${BASE_URL}/chat/completions` is always clean, even
// if the .env value has a trailing slash. Expected to already include `/v1`.
const BASE_URL = (process.env.EXPO_PUBLIC_BTL_BASE_URL ?? '').replace(/\/+$/, '');

/** True only when both the scoped key and base URL are present in .env. */
export function isBtlConfigured(): boolean {
  return API_KEY.length > 0 && BASE_URL.length > 0;
}

// --- Models -----------------------------------------------------------------
// Chat / OCR / quiz models become user-selectable in Settings → AI Model and are
// passed to helpers as an override. `btl-2` is the confirmed default from the
// BTL dashboard. Vision (scan/OCR) and audio (record) reuse `/chat/completions`
// with a vision/audio model id — the gateway exposes no separate OCR endpoint.
export const DEFAULT_CHAT_MODEL = 'btl-2';

// Document / vision model for reading uploaded PDFs (and, later, scanned pages).
// Gemini reads a PDF natively through the OpenAI-compatible `file` content part,
// so upload extraction routes here. Becomes user-selectable in Settings like the
// chat model. Swap the slug if the catalog names its document model differently.
export const DEFAULT_DOC_MODEL = 'gemini-2.5-flash';

// NOTE: the BTL catalog surfaced NO dedicated text-embedding model. So there is
// intentionally no EMBED_MODEL here — Phase 3 grounds retrieval lexically
// (keyword / chunk-overlap). The trust promise is kept by the retrieval GATE +
// citations, not by vectors. Revisit only if an embedding model appears in /models.

// --- Friendly errors --------------------------------------------------------
// Screens must never show a raw stack trace. Every failure is mapped to a calm,
// student-facing sentence (see AGENTS.md → UI Quality Bar / BTL Rules Summary).

export type BtlErrorKind = 'not-configured' | 'network' | 'auth' | 'credits' | 'server' | 'unknown';

const FRIENDLY: Record<BtlErrorKind, string> = {
  'not-configured': 'AI is not set up yet. Add your BTL key to .env to enable study answers.',
  network: 'Cannot reach your study assistant. Check your connection and try again.',
  auth: 'Your BTL key was rejected. Double-check EXPO_PUBLIC_BTL_API_KEY in .env.',
  credits: 'The study assistant is out of credits for now. Please try again later.',
  server: 'The study assistant is having a moment. Please try again shortly.',
  unknown: 'Something went wrong reaching the study assistant. Please try again.',
};

/** Every BTL failure surfaces as this — render `.friendly`, log `.message`. */
export class BtlError extends Error {
  readonly kind: BtlErrorKind;
  readonly friendly: string;
  readonly status?: number;

  constructor(kind: BtlErrorKind, detail?: string, status?: number) {
    super(detail || kind);
    this.name = 'BtlError';
    this.kind = kind;
    this.friendly = FRIENDLY[kind];
    this.status = status;
  }
}

function kindForStatus(status: number): BtlErrorKind {
  if (status === 401 || status === 403) return 'auth';
  if (status === 402 || status === 429) return 'credits';
  if (status >= 500) return 'server';
  return 'unknown';
}

// --- Core request -----------------------------------------------------------

type JsonBody = Record<string, unknown>;

/**
 * POST a JSON body to a BTL /v1 route (e.g. 'chat/completions', 'embeddings')
 * and return the parsed response. This is the primitive every non-streaming AI
 * helper builds on. Streaming chat (Phase 4) reads `res.body` instead, but reuses
 * the same headers and error mapping. Throws a {@link BtlError} on any failure.
 */
export async function btlPost<T = unknown>(
  path: string,
  body: JsonBody,
  signal?: AbortSignal,
): Promise<T> {
  if (!isBtlConfigured()) throw new BtlError('not-configured');

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    // fetch only rejects on transport-level failure (offline, DNS, aborted).
    throw new BtlError('network', String(err));
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new BtlError(kindForStatus(res.status), detail, res.status);
  }

  return (await res.json()) as T;
}

// --- Streaming chat ---------------------------------------------------------

/** The outcome of a streamed completion: the full text, WHY it stopped, and how
 *  many content deltas arrived. `finishReason` is unreliable on some gateways
 *  (btl-2 reports 'stop' even when cut off), so callers also use `tokens` — which
 *  tracks the emitted token count (~1 per delta) — against `max_tokens` to detect
 *  a truncated answer and offer "Generate more". */
export type StreamResult = { text: string; finishReason: string | null; tokens: number };

/**
 * Stream a chat completion from the BTL runtime, invoking `onToken` with each
 * text delta as it arrives and resolving to the full concatenated answer plus its
 * finish reason. This powers the grounded Ask ★ hero moment — the answer types
 * itself out live.
 *
 * `body` is the OpenAI-compatible request MINUS `stream` (we always set it). The
 * gateway replies with Server-Sent Events (`data: {json}\n\n`, ending in
 * `data: [DONE]`); we parse the `choices[0].delta.content` off each event and
 * keep the last `choices[0].finish_reason` we see. Same auth headers and
 * friendly-error mapping as {@link btlPost}: any failure throws a {@link BtlError}
 * the UI can render calmly.
 */
export async function btlChatStream(
  body: JsonBody,
  onToken?: (delta: string) => void,
  signal?: AbortSignal,
): Promise<StreamResult> {
  if (!isBtlConfigured()) throw new BtlError('not-configured');

  const res = await streamingFetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ ...body, stream: true }),
    signal,
  }).catch((err: unknown) => {
    throw new BtlError('network', String(err));
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new BtlError(kindForStatus(res.status), detail, res.status);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new BtlError('server', 'stream body unavailable');

  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  let finishReason: string | null = null;
  let tokens = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE events are newline-delimited; process every complete line, keeping
      // any trailing partial line in the buffer for the next chunk.
      let nl: number;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line.startsWith('data:')) continue; // skip keep-alives / comments
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') return { text: full, finishReason, tokens };
        try {
          const json = JSON.parse(payload) as {
            choices?: { delta?: { content?: string }; finish_reason?: string | null }[];
          };
          const delta = json.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            full += delta;
            tokens += 1; // ~1 token per delta on btl-2 — a truncation proxy
            onToken?.(delta);
          }
          // The last event of a completion carries the reason it stopped
          // ('stop' = finished, 'length' = hit max_tokens → more to say).
          const reason = json.choices?.[0]?.finish_reason;
          if (reason) finishReason = reason;
        } catch {
          // A partial or non-JSON line — ignore and wait for more bytes.
        }
      }
    }
  } catch (err) {
    // A mid-stream transport drop (or an abort). Surface as a friendly network
    // error unless the caller aborted on purpose.
    if (signal?.aborted) return { text: full, finishReason, tokens };
    throw new BtlError('network', String(err));
  }

  return { text: full, finishReason, tokens };
}

// --- Connectivity check -----------------------------------------------------

export type BtlStatus = { ok: boolean; message: string };

/**
 * The one cheap health check: GET /models lists the gateway's models without
 * spending any generation tokens. Use it on app start or Settings → AI Model to
 * show a calm "connected / not connected" state. Never throws — it always
 * resolves to a status the UI can render directly.
 */
export async function checkBtlConnection(signal?: AbortSignal): Promise<BtlStatus> {
  if (!isBtlConfigured()) return { ok: false, message: FRIENDLY['not-configured'] };

  try {
    const res = await fetch(`${BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      signal,
    });
    if (res.ok) return { ok: true, message: 'Connected to your study assistant.' };
    return { ok: false, message: FRIENDLY[kindForStatus(res.status)] };
  } catch {
    return { ok: false, message: FRIENDLY.network };
  }
}
