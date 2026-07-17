import { Readable } from 'node:stream';

const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const ALLOWED_ENDPOINTS = new Set(['chat/completions', 'embeddings']);
const MAX_OUTPUT_TOKENS = 4000;

function setCors(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendError(response, status, message) {
  response.status(status).json({ error: { message } });
}

function readBody(body) {
  if (typeof body === 'string') return JSON.parse(body);
  return body;
}

function sanitisePayload(endpoint, payload) {
  const body = { ...payload };

  if (endpoint === 'chat/completions') {
    body.model = process.env.OPENAI_CHAT_MODEL ?? 'gpt-5.6';
    if (typeof body.max_tokens === 'number') {
      body.max_tokens = Math.min(Math.max(body.max_tokens, 1), MAX_OUTPUT_TOKENS);
    }
  }

  if (endpoint === 'embeddings') {
    body.model = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';
  }

  return body;
}

export default async function handler(request, response) {
  setCors(response);

  if (request.method === 'OPTIONS') return response.status(204).end();
  if (request.method !== 'POST') return sendError(response, 405, 'Only POST requests are allowed.');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return sendError(response, 500, 'The OpenAI proxy is not configured.');

  let envelope;
  try {
    envelope = readBody(request.body);
  } catch {
    return sendError(response, 400, 'The request body must be valid JSON.');
  }

  const endpoint = envelope?.endpoint;
  const payload = envelope?.payload;
  if (typeof endpoint !== 'string' || !ALLOWED_ENDPOINTS.has(endpoint)) {
    return sendError(response, 400, 'This OpenAI endpoint is not available in readIQ.');
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return sendError(response, 400, 'A JSON payload is required.');
  }

  let upstream;
  try {
    upstream = await fetch(`${OPENAI_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: payload.stream === true ? 'text/event-stream' : 'application/json',
      },
      body: JSON.stringify(sanitisePayload(endpoint, payload)),
    });
  } catch {
    return sendError(response, 503, 'OpenAI could not be reached.');
  }

  response.status(upstream.status);
  response.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');

  if (!upstream.body) return response.end();
  Readable.fromWeb(upstream.body).pipe(response);
}
