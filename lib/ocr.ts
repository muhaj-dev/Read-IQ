// Scan OCR — a photo of notes → text via BTL vision. The image is sent to a
// multimodal chat model as an `image_url` content part and its readable text
// becomes the note body. Temperature 0 for a faithful, verbatim transcription.
// Runs once per capture (spends credits); the result is saved to a note.

import { aiPost, DEFAULT_VISION_MODEL, readChatText } from './ai';
import { fileUriToDataUri } from './files';

const OCR_PROMPT =
  'You are an OCR engine. Transcribe ALL readable text in this image EXACTLY as ' +
  'written — every heading, bullet, label, equation, and paragraph, in reading ' +
  'order. Preserve line and paragraph breaks. Do NOT summarize, translate, ' +
  'correct, explain, or add anything that is not in the image. If the image has no ' +
  'legible text, return nothing. Return only the transcribed text — no markdown ' +
  'code fences and no commentary.';

/** Best-guess image MIME from the uri so the model isn't handed a mislabelled photo. */
function imageMime(uri: string): string {
  const u = uri.toLowerCase();
  if (u.endsWith('.png')) return 'image/png';
  if (u.endsWith('.webp')) return 'image/webp';
  if (u.endsWith('.heic') || u.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg'; // camera captures + most gallery picks
}

/** Extract the text in a captured/picked image via BTL vision. '' when illegible. Throws BtlError. */
export async function extractImageText(uri: string): Promise<string> {
  const dataUri = await fileUriToDataUri(uri, imageMime(uri));

  const res = await aiPost('chat/completions', {
    model: DEFAULT_VISION_MODEL,
    temperature: 0,
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: OCR_PROMPT },
          { type: 'image_url', image_url: { url: dataUri } },
        ],
      },
    ],
  });

  return readChatText(res);
}
