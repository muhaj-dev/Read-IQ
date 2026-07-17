// The single OpenAI transport used by the Expo app. Requests go to our Vercel
// proxy, so the real OpenAI key never ships in the mobile bundle.

import { fetch as streamingFetch } from 'expo/fetch';

const PROXY_URL = (process.env.EXPO_PUBLIC_AI_PROXY_URL ?? '').replace(/\/+$/, '');

export function isAiConfigured(): boolean {
  return PROXY_URL.length > 0;
}

// The proxy is authoritative: it overwrites client-supplied model fields before
// forwarding. These values only keep local settings and request shapes coherent.
export const DEFAULT_CHAT_MODEL = 'gpt-5.6';
export const DEFAULT_DOC_MODEL = DEFAULT_CHAT_MODEL;
export const DEFAULT_VISION_MODEL = DEFAULT_CHAT_MODEL;
export const DEFAULT_EMBED_MODEL = 'text-embedding-3-small';

export type AiErrorKind = 'not-configured' | 'network' | 'auth' | 'credits' | 'server' | 'unknown';

const FRIENDLY: Record<AiErrorKind, string> = {
  'not-configured': 'AI is not set up yet. Add the study assistant URL to enable answers.',
  network: 'Cannot reach your study assistant. Check your connection and try again.',
  auth: 'The study assistant is not authorised right now. Please try again shortly.',
  credits: 'The study assistant is busy or out of credits for now. Please try again later.',
  server: 'The study assistant is having a moment. Please try again shortly.',
  unknown: 'Something went wrong reaching the study assistant. Please try again.',
};

export class AiError extends Error {
  readonly kind: AiErrorKind;
  readonly friendly: string;
  readonly status?: number;

  constructor(kind: AiErrorKind, detail?: string, status?: number) {
    super(detail || kind);
    this.name = 'AiError';
    this.kind = kind;
    this.friendly = FRIENDLY[kind];
    this.status = status;
  }
}

function kindForStatus(status: number): AiErrorKind {
  if (status === 401 || status === 403) return 'auth';
  if (status === 402 || status === 429) return 'credits';
  if (status >= 500) return 'server';
  return 'unknown';
}

type JsonBody = Record<string, unknown>;

function proxyEndpoint(): string {
  return `${PROXY_URL}/api/ai`;
}

/** Sends an approved OpenAI request through the key-holding proxy. */
export async function aiPost<T = unknown>(
  endpoint: 'chat/completions' | 'responses' | 'embeddings' | 'audio/transcriptions',
  payload: JsonBody,
  signal?: AbortSignal,
): Promise<T> {
  if (!isAiConfigured()) throw new AiError('not-configured');

  let response: Response;
  try {
    response = await fetch(proxyEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint, payload }),
      signal,
    });
  } catch (error) {
    throw new AiError('network', String(error));
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new AiError(kindForStatus(response.status), detail, response.status);
  }

  return (await response.json()) as T;
}

type EmbeddingResponse = { data?: { index?: number; embedding?: number[] }[] };

/** Embeds texts in one request and returns vectors in input order. */
export async function aiEmbed(inputs: string[], signal?: AbortSignal): Promise<number[][]> {
  if (inputs.length === 0) return [];

  const result = await aiPost<EmbeddingResponse>(
    'embeddings',
    { model: DEFAULT_EMBED_MODEL, input: inputs },
    signal,
  );

  const vectors = new Array<number[] | undefined>(inputs.length);
  for (let index = 0; index < (result.data?.length ?? 0); index += 1) {
    const item = result.data![index];
    const target = typeof item.index === 'number' ? item.index : index;
    if (Array.isArray(item.embedding) && target >= 0 && target < inputs.length) {
      vectors[target] = item.embedding;
    }
  }
  if (vectors.some((vector) => !vector || vector.length === 0)) {
    throw new AiError('server', 'embeddings: response missing a vector');
  }
  return vectors as number[][];
}

type ChatContentPart = { type?: string; text?: string };
type ChatLike = {
  choices?: { message?: { content?: string | ChatContentPart[] } }[];
  output_text?: string;
  output?: { content?: ChatContentPart[] }[];
};

export function readChatText(response: unknown): string {
  const result = (response ?? {}) as ChatLike;
  const join = (parts: ChatContentPart[]) =>
    parts.map((part) => (typeof part?.text === 'string' ? part.text : '')).join('').trim();
  const message = result.choices?.[0]?.message?.content;
  if (typeof message === 'string') return message.trim();
  if (Array.isArray(message)) return join(message);
  if (typeof result.output_text === 'string') return result.output_text.trim();
  const output = result.output?.[0]?.content;
  return Array.isArray(output) ? join(output) : '';
}

export type StreamResult = { text: string; finishReason: string | null; tokens: number };

/** Streams a Chat Completions response from the proxy's SSE connection. */
export async function aiChatStream(
  payload: JsonBody,
  onToken?: (delta: string) => void,
  signal?: AbortSignal,
): Promise<StreamResult> {
  if (!isAiConfigured()) throw new AiError('not-configured');

  const response = await streamingFetch(proxyEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ endpoint: 'chat/completions', payload: { ...payload, stream: true } }),
    signal,
  }).catch((error: unknown) => {
    throw new AiError('network', String(error));
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new AiError(kindForStatus(response.status), detail, response.status);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new AiError('server', 'stream body unavailable');

  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let finishReason: string | null = null;
  let tokens = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newline: number;
      while ((newline = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') return { text, finishReason, tokens };
        try {
          const event = JSON.parse(data) as {
            choices?: { delta?: { content?: string }; finish_reason?: string | null }[];
          };
          const delta = event.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            text += delta;
            tokens += 1;
            onToken?.(delta);
          }
          const reason = event.choices?.[0]?.finish_reason;
          if (reason) finishReason = reason;
        } catch {
          // Ignore incomplete SSE payloads until the next chunk arrives.
        }
      }
    }
  } catch (error) {
    if (signal?.aborted) return { text, finishReason, tokens };
    throw new AiError('network', String(error));
  }

  return { text, finishReason, tokens };
}

export type AiStatus = { ok: boolean; message: string };

/** Checks the proxy health endpoint without spending OpenAI credits. */
export async function checkAiConnection(signal?: AbortSignal): Promise<AiStatus> {
  if (!isAiConfigured()) return { ok: false, message: FRIENDLY['not-configured'] };

  try {
    const response = await fetch(proxyEndpoint(), { signal });
    if (response.ok) return { ok: true, message: 'Connected to your study assistant.' };
    return { ok: false, message: FRIENDLY[kindForStatus(response.status)] };
  } catch {
    return { ok: false, message: FRIENDLY.network };
  }
}
