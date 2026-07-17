// PDF-attachment helpers for the PDF Reader: find a note's PDF and read its bytes
// as base64 (what pdf.js in the WebView decodes). The file is copied into the
// persistent document dir once so the reader survives an OS cache purge / restart.

import { Directory, File, Paths } from 'expo-file-system';

import { fileUriToBase64, isPdf } from '@/lib/files';
import type { NoteAttachment } from '@/types/note';

/** The note's first PDF attachment, or null. Drives the "PDF Reader" button. */
export function firstPdf(attachments: NoteAttachment[]): NoteAttachment | null {
  return attachments.find(isPdf) ?? null;
}

/** Copy the PDF into the persistent document dir once; falls back to the original uri. */
function persistentUri(attachment: NoteAttachment): string {
  try {
    const dir = new Directory(Paths.document, 'pdfs');
    if (!dir.exists) dir.create({ idempotent: true });
    const dest = new File(dir, `${attachment.id}.pdf`);
    if (!dest.exists) new File(attachment.uri).copy(dest);
    return dest.uri;
  } catch (err) {
    // Copy can fail on some content:// uris — read straight from the picked file instead.
    console.warn('[pdf] could not persist PDF, using original uri:', String(err));
    return attachment.uri;
  }
}

/** Read the PDF as raw base64 (no data-URI prefix) for pdf.js `getDocument({ data })`. */
export async function readPdfBase64(attachment: NoteAttachment): Promise<string> {
  return fileUriToBase64(persistentUri(attachment));
}
