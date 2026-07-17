// Record transcription — lecture audio → transcript via a Whisper-compatible API.
//
// ⚠️ This is the ONE feature that does NOT route through the BTL runtime: BTL has
// no working audio path (re-verified live — the gateway strips the `input_audio`
// content part, so gpt-audio replies "input content must contain audio"). Speech
// recognition therefore runs through Groq's free Whisper by default (OpenAI-
// compatible), over a plain multipart fetch so it works in Expo Go with no dev
// build. The returned transcript is then summarized by btl-2, so the study
// intelligence (summary, quiz, podcast, Ask) all stays on BTL.
//
// Setup: get a free key at https://console.groq.com/keys and add ONE line to .env:
//   EXPO_PUBLIC_GROQ_API_KEY=gsk_...
// (Already have an OpenAI key? Set EXPO_PUBLIC_OPENAI_API_KEY instead — it falls
//  back to api.openai.com + whisper-1 automatically.)
//
// The transcript never blocks a save: with no key we land straight on the manual
// editor, and any call failure surfaces the retry / "type it instead" screen.

// STT credentials — kept isolated to this file, the way the BTL key is isolated to
// lib/btl.ts. Prefer Groq (free tier); fall back to OpenAI if only that key is set.
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const USE_GROQ = GROQ_API_KEY.length > 0;

const STT_API_KEY = USE_GROQ ? GROQ_API_KEY : OPENAI_API_KEY;
// Base URL defaults to the chosen provider; override with EXPO_PUBLIC_STT_BASE_URL.
const STT_BASE_URL = (
  process.env.EXPO_PUBLIC_STT_BASE_URL ??
  process.env.EXPO_PUBLIC_OPENAI_BASE_URL ??
  (USE_GROQ ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1')
).replace(/\/+$/, '');
// Model defaults to Groq's fast free Whisper (or OpenAI's whisper-1); override with
// EXPO_PUBLIC_STT_MODEL (e.g. 'whisper-large-v3' for max accuracy).
const STT_MODEL =
  process.env.EXPO_PUBLIC_STT_MODEL ??
  process.env.EXPO_PUBLIC_OPENAI_STT_MODEL ??
  (USE_GROQ ? 'whisper-large-v3-turbo' : 'whisper-1');

/** True only when an STT key is present — otherwise Record uses a manual transcript. */
export function isTranscriptionConfigured(): boolean {
  return STT_API_KEY.length > 0;
}

/** Multipart filename + mime from the recording's extension (Whisper reads the bytes). */
function audioFile(uri: string): { name: string; type: string } {
  const u = uri.toLowerCase();
  if (u.endsWith('.wav')) return { name: 'audio.wav', type: 'audio/wav' };
  if (u.endsWith('.mp3')) return { name: 'audio.mp3', type: 'audio/mpeg' };
  if (u.endsWith('.caf')) return { name: 'audio.caf', type: 'audio/x-caf' };
  return { name: 'audio.m4a', type: 'audio/m4a' }; // expo-audio HIGH_QUALITY → AAC/.m4a
}

/** Transcribe a recorded lecture via Whisper. '' when not configured; throws on failure. */
export async function transcribeAudio(uri: string): Promise<string> {
  if (!isTranscriptionConfigured()) {
    // No key → skip straight to the editable transcript instead of an error screen.
    console.warn('[transcription] no STT key set (EXPO_PUBLIC_GROQ_API_KEY) — using manual transcript.');
    return '';
  }

  const file = audioFile(uri);
  const form = new FormData();
  // React Native multipart file part: { uri, name, type } — fetch streams file:// directly.
  form.append('file', { uri, name: file.name, type: file.type } as unknown as Blob);
  form.append('model', STT_MODEL);
  form.append('response_format', 'text'); // body IS the transcript — no JSON to parse

  let res: Response;
  try {
    // Global RN fetch (not expo/fetch) — it handles multipart file uploads. No
    // Content-Type header: fetch sets the multipart boundary itself.
    res = await fetch(`${STT_BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${STT_API_KEY}` },
      body: form,
    });
  } catch (err) {
    console.warn('[transcription] network error:', String(err));
    throw new Error('Could not reach the transcription service.');
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.warn('[transcription] HTTP', res.status, detail.slice(0, 300));
    throw new Error(`Transcription failed (${res.status}).`);
  }

  return (await res.text()).trim();
}
