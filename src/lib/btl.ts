// The single BTL Runtime client — the only file that reads BTL credentials.
// OpenAI-compatible; called via plain fetch, streaming via expo/fetch.

import { fetch as streamingFetch } from 'expo/fetch';

// --- Credentials (read here and NOWHERE else — see AGENTS.md → BTL Runtime Rules)

const API_KEY = process.env.EXPO_PUBLIC_BTL_API_KEY ?? '';
// Strip trailing slash; expected to already include `/v1`.
const BASE_URL = (process.env.EXPO_PUBLIC_BTL_BASE_URL ?? '').replace(/\/+$/, '');

/** True only when both the scoped key and base URL are present in .env. */
export function isBtlConfigured(): boolean {
  return API_KEY.length > 0 && BASE_URL.length > 0;
}

// --- Models -----------------------------------------------------------------
// Confirmed default from the BTL dashboard; user-selectable later in Settings.
export const DEFAULT_CHAT_MODEL = 'btl-2';

// Vision/document model — reads uploaded PDFs via an `image_url` data-URI content
// part (the same proven gateway path as scan OCR; the `file` part is dropped by BTL).
export const DEFAULT_DOC_MODEL = 'gemini-2.5-flash';

// Vision model for scan OCR — a multimodal chat model reads the photo via an
// `image_url` content part (the same gateway path proven for DEFAULT_DOC_MODEL).
export const DEFAULT_VISION_MODEL = 'gemini-2.5-flash';

// No audio model: BTL has no working transcription path (verified —
// /audio/transcriptions 404s, gpt-audio 400s, voxtral's 32k context = ~1s of audio).
// Record transcription runs through OpenAI Whisper instead (see lib/transcription.ts).

// Text embeddings for semantic retrieval — verified live (2026-07-06): BTL now serves
// text-embedding-3-small at POST /v1/embeddings (1536-dim, standard OpenAI shape).
export const DEFAULT_EMBED_MODEL = 'text-embedding-3-small';

// --- Friendly errors --------------------------------------------------------
// Every failure maps to a calm, student-facing sentence — never a raw trace.

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

/** POST a JSON body to a BTL /v1 route and return the parsed response. Throws {@link BtlError}. */
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

// --- Embeddings -------------------------------------------------------------
// One batched call embeds many texts; used both to embed a note's chunks (on save)
// and to embed a question (on ask). Response shape verified live: { data: [{ index,
// embedding: number[] }], usage }. Throws {@link BtlError} — callers fall back to lexical.

type EmbeddingResponse = { data?: { index?: number; embedding?: number[] }[] };

/** Embed each input text → one vector per input, aligned to input order. */
export async function btlEmbed(inputs: string[], signal?: AbortSignal): Promise<number[][]> {
  if (inputs.length === 0) return [];

  const res = await btlPost<EmbeddingResponse>(
    'embeddings',
    { model: DEFAULT_EMBED_MODEL, input: inputs },
    signal,
  );

  // Place each vector at its own `index` so a reordered response still lines up.
  const out = new Array<number[] | undefined>(inputs.length);
  for (let i = 0; i < (res.data?.length ?? 0); i += 1) {
    const item = res.data![i];
    const at = typeof item.index === 'number' ? item.index : i;
    if (Array.isArray(item.embedding) && at >= 0 && at < inputs.length) out[at] = item.embedding;
  }
  // A missing/short vector means the batch is unusable — fail so the caller uses lexical.
  if (out.some((v) => !v || v.length === 0)) {
    throw new BtlError('server', 'embeddings: response missing a vector');
  }
  return out as number[][];
}

// --- Response text extraction ------------------------------------------------
// A vision/audio/chat reply may arrive as a plain string, a content-part array,
// or the /responses `output` shape — read all of them so a shape mismatch never
// looks like "the model returned nothing".

type ChatContentPart = { type?: string; text?: string };
type ChatLike = {
  choices?: { message?: { content?: string | ChatContentPart[] } }[];
  output_text?: string;
  output?: { content?: ChatContentPart[] }[];
};

/** Pull the assistant text out of whatever shape the gateway returned. '' when none. */
export function readChatText(res: unknown): string {
  const r = (res ?? {}) as ChatLike;
  const join = (parts: ChatContentPart[]) =>
    parts.map((p) => (typeof p?.text === 'string' ? p.text : '')).join('').trim();
  const message = r.choices?.[0]?.message?.content;
  if (typeof message === 'string') return message.trim();
  if (Array.isArray(message)) return join(message);
  if (typeof r.output_text === 'string') return r.output_text.trim();
  const output = r.output?.[0]?.content;
  if (Array.isArray(output)) return join(output);
  return '';
}

// --- Streaming chat ---------------------------------------------------------

/** Streamed completion outcome. `finishReason` is unreliable on btl-2, so `tokens`
 *  (~1 per delta) vs `max_tokens` also flags truncation for "Generate more". */
export type StreamResult = { text: string; finishReason: string | null; tokens: number };

/** Stream a chat completion, calling `onToken` per delta; resolves to the full answer.
 *  `body` omits `stream` (always set here). Throws {@link BtlError} on failure. */
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

      // SSE events are newline-delimited; keep any partial trailing line buffered.
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
          // 'stop' = finished, 'length' = hit max_tokens → more to say.
          const reason = json.choices?.[0]?.finish_reason;
          if (reason) finishReason = reason;
        } catch {
          // A partial or non-JSON line — ignore and wait for more bytes.
        }
      }
    }
  } catch (err) {
    // Mid-stream drop: friendly network error unless the caller aborted on purpose.
    if (signal?.aborted) return { text: full, finishReason, tokens };
    throw new BtlError('network', String(err));
  }

  return { text: full, finishReason, tokens };
}

// --- Connectivity check -----------------------------------------------------

export type BtlStatus = { ok: boolean; message: string };

/** Cheap health check via GET /models (no tokens spent). Never throws. */
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
