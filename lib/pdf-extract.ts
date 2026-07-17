// PDF → text via BTL: the PDF is sent to a vision/document model as an `image_url`
// data-URI content part — the shape proven working for gemini-2.5-flash in scan OCR.
// (The OpenAI `file` part shape was silently dropped by the BTL gateway: it returned
// an empty completion with prompt_tokens: 0, i.e. the PDF never reached the model.)
// Its text becomes the note body. Extract once and persist (spends credits).

import type { NoteAttachment } from '@/types/note';

import { btlPost, DEFAULT_DOC_MODEL } from './btl';
import { fileUriToDataUri, isPdf } from './files';

// The gateway returns text in several shapes depending on the upstream model —
// read all of them so a shape mismatch doesn't look like "the PDF had no text".
type ContentPart = { type?: string; text?: string };
type ChatResponse = {
  choices?: { message?: { content?: string | ContentPart[] } }[];
  output_text?: string;
  output?: { content?: ContentPart[] }[];
};

/** Join the `text` fields of an OpenAI-style content-part array. */
function partsToText(parts: ContentPart[]): string {
  return parts.map((p) => (typeof p?.text === 'string' ? p.text : '')).join('');
}

/** Pull the assistant text out of whatever response shape the gateway returned. */
function readContent(res: ChatResponse): string {
  const message = res.choices?.[0]?.message?.content;
  if (typeof message === 'string') return message.trim();
  if (Array.isArray(message)) return partsToText(message).trim();
  if (typeof res.output_text === 'string') return res.output_text.trim();
  const output = res.output?.[0]?.content;
  if (Array.isArray(output)) return partsToText(output).trim();
  return '';
}

const EXTRACT_PROMPT =
  'Extract ALL of the readable text from this document exactly as written. ' +
  'Preserve headings, lists, and paragraph breaks. Do not summarize, translate, ' +
  'add commentary, or wrap the output in markdown code fences. Return only the text.';

/** Extract a single PDF's full text via BTL (may be empty). Throws BtlError / Error. */
export async function extractPdfText(attachment: NoteAttachment): Promise<string> {
  // Force application/pdf — a cached file's blob type is unreliable on RN and a
  // wrong type makes the runtime return no text (the "no content yet" bug).
  const dataUri = await fileUriToDataUri(attachment.uri, 'application/pdf');
  console.log(
    '[pdf-extract] model:',
    DEFAULT_DOC_MODEL,
    '· dataUri prefix:',
    dataUri.slice(0, 40),
    '· base64 length:',
    dataUri.length,
  );

  const res = await btlPost<ChatResponse>('chat/completions', {
    model: DEFAULT_DOC_MODEL,
    temperature: 0,
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: EXTRACT_PROMPT },
          // Same proven content-part as scan OCR; the data-URI's application/pdf
          // mime rides through so the gateway forwards it to Gemini as a document.
          { type: 'image_url', image_url: { url: dataUri } },
        ],
      },
    ],
  });

  const text = readContent(res);
  console.log('[pdf-extract] response text length:', text.length);
  if (!text) {
    // Succeeded but empty — usually a shape/model mismatch. No note content to
    // leak when empty, so log the raw response (truncated) to diagnose.
    console.warn(
      '[pdf-extract] EMPTY result. Raw response (truncated):',
      JSON.stringify(res).slice(0, 800),
    );
  }
  return text;
}

/** Extract and join text from every PDF in a set (non-PDFs ignored); '' when none. */
export async function extractPdfsText(attachments: NoteAttachment[]): Promise<string> {
  const pdfs = attachments.filter(isPdf);
  if (pdfs.length === 0) return '';

  const parts: string[] = [];
  for (const pdf of pdfs) {
    const text = await extractPdfText(pdf);
    if (text) parts.push(text);
  }
  return parts.join('\n\n');
}
