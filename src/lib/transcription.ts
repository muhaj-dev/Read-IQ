// Recorded lecture audio is sent to the OpenAI proxy as base64. The proxy turns
// it into multipart form data and keeps the OpenAI key off the device.

import { aiPost, isAiConfigured } from './ai';
import { fileUriToBase64 } from './files';

export function isTranscriptionConfigured(): boolean {
  return isAiConfigured();
}

function audioFile(uri: string): { name: string; type: string } {
  const normalized = uri.toLowerCase();
  if (normalized.endsWith('.wav')) return { name: 'audio.wav', type: 'audio/wav' };
  if (normalized.endsWith('.mp3')) return { name: 'audio.mp3', type: 'audio/mpeg' };
  if (normalized.endsWith('.caf')) return { name: 'audio.caf', type: 'audio/x-caf' };
  return { name: 'audio.m4a', type: 'audio/m4a' };
}

type TranscriptionResponse = { text?: string };

/** Transcribe a lecture through OpenAI without exposing a client-side API key. */
export async function transcribeAudio(uri: string): Promise<string> {
  if (!isTranscriptionConfigured()) return '';

  const file = audioFile(uri);
  const fileBase64 = await fileUriToBase64(uri);
  const result = await aiPost<TranscriptionResponse>('audio/transcriptions', {
    fileBase64,
    fileName: file.name,
    mimeType: file.type,
  });
  return result.text?.trim() ?? '';
}
