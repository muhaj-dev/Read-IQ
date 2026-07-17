// Upload-flow text extraction: routes each picked document to the right reader —
// PDF through the BTL runtime (vision), .docx unpacked locally (no credits spent) —
// and joins the results in pick order. The Upload screen calls this one function.

import type { NoteAttachment } from '@/types/note';

import { extractDocxText } from './docx-extract';
import { isDocx, isPdf } from './files';
import { extractPdfText } from './pdf-extract';

/** True when the Upload flow can pull text from this attachment (PDF or .docx). */
export function isExtractable(attachment: NoteAttachment): boolean {
  return isPdf(attachment) || isDocx(attachment);
}

/** Extract and join text from every supported document, preserving pick order.
 *  Unsupported attachments are ignored. Throws BtlError / Error on a read failure. */
export async function extractDocumentsText(attachments: NoteAttachment[]): Promise<string> {
  const parts: string[] = [];
  for (const file of attachments) {
    let text = '';
    if (isPdf(file)) text = await extractPdfText(file);
    else if (isDocx(file)) text = await extractDocxText(file);
    if (text) parts.push(text);
  }
  return parts.join('\n\n');
}
