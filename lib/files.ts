import * as DocumentPicker from 'expo-document-picker';
import { File as FsFile } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import type { NoteAttachment } from '@/types/note';

/** A file the student picked from their device for a note attachment. */
export type PickedDocument = {
  name: string;
  /** Human meta line for the attachment card, e.g. "PDF • 2.4 MB". */
  meta: string;
  uri: string;
};

const formatBytes = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const extensionLabel = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toUpperCase() : 'FILE';
};

/** Unique-enough attachment id (app runtime, not a Workflow script). */
const attachmentId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** True for a picked PDF. Checks MIME first, then name/meta (Android often omits `.pdf`). */
export function isPdf(attachment: NoteAttachment): boolean {
  return (
    /pdf/i.test(attachment.mimeType ?? '') ||
    /\.pdf$/i.test(attachment.name) ||
    /^pdf\b/i.test(attachment.meta)
  );
}

/** True for a picked .docx (Office Open XML — a zip we unpack locally, no BTL call).
 *  Legacy binary `.doc` is deliberately excluded: it isn't a zip, so jszip can't read it. */
export function isDocx(attachment: NoteAttachment): boolean {
  return /wordprocessingml\.document/i.test(attachment.mimeType ?? '') || /\.docx$/i.test(attachment.name);
}

/** Read a local file into raw base64 (no data-URI prefix — what jszip.loadAsync wants).
 *  Prefers expo-file-system; RN's fetch().blob() + FileReader often returns EMPTY data
 *  on Android (the "no content yet" bug), so fetch is only the web blob: fallback. */
export async function fileUriToBase64(uri: string): Promise<string> {
  try {
    const base64 = await new FsFile(uri).base64();
    if (base64) {
      console.log('[files] read via expo-file-system · base64 length:', base64.length);
      return base64;
    }
    console.warn('[files] expo-file-system returned empty base64 — falling back to fetch');
  } catch (err) {
    // Web blob: URIs (and any unexpected uri) land here — fall back to fetch.
    console.warn('[files] expo-file-system read failed, falling back to fetch:', String(err));
  }

  const res = await fetch(uri);
  const blob = await res.blob();
  const dataUri = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
  const comma = dataUri.indexOf(',');
  return comma >= 0 ? dataUri.slice(comma + 1) : dataUri;
}

/** Read a local file into a base64 data URI (what BTL's `image_url`/`file` part expects).
 *  Pass `mimeType` to stamp the type — RN cached blobs often report octet-stream,
 *  which makes the runtime skip a valid PDF. Rejects on read failure. */
export async function fileUriToDataUri(uri: string, mimeType?: string): Promise<string> {
  const base64 = await fileUriToBase64(uri);
  return `data:${mimeType ?? 'application/octet-stream'};base64,${base64}`;
}

/** Open the file picker for a PDF / document; null if cancelled. */
export async function pickDocument(): Promise<PickedDocument | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
    copyToCacheDirectory: true,
    multiple: false,
  });

  const asset = result.assets?.[0];
  if (result.canceled || !asset) return null;

  const size = formatBytes(asset.size);
  const meta = size ? `${extensionLabel(asset.name)} • ${size}` : extensionLabel(asset.name);
  return { name: asset.name, meta, uri: asset.uri };
}

/** Pick one or more documents as note attachments; [] if cancelled.
 *  `extractableOnly` limits the picker to formats the Upload flow can pull text from —
 *  PDF (via BTL) and .docx (unpacked locally). Other callers attach any file. */
export async function pickFileAttachments(options?: { extractableOnly?: boolean }): Promise<NoteAttachment[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: options?.extractableOnly
      ? ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      : [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ],
    copyToCacheDirectory: true,
    multiple: true,
  });

  if (result.canceled || !result.assets?.length) return [];

  const attachments = result.assets.map((asset) => {
    const size = formatBytes(asset.size ?? undefined);
    const meta = size ? `${extensionLabel(asset.name)} • ${size}` : extensionLabel(asset.name);
    return {
      id: attachmentId(),
      name: asset.name,
      meta,
      uri: asset.uri,
      kind: 'file' as const,
      mimeType: asset.mimeType,
    };
  });
  // Diagnostic: metadata only (name/mime drive PDF detection), never file contents.
  console.log(
    '[files] picked:',
    attachments.map((a) => ({ name: a.name, meta: a.meta, mimeType: a.mimeType, isPdf: isPdf(a), isDocx: isDocx(a) })),
  );
  return attachments;
}

/** Pick one or more library images as note attachments (system photo picker, no prompt). */
export async function pickImageAttachments(): Promise<NoteAttachment[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.7,
  });

  if (result.canceled || !result.assets?.length) return [];

  return result.assets.map((asset, i) => {
    const size = formatBytes(asset.fileSize ?? undefined);
    const name = asset.fileName ?? `Image ${i + 1}`;
    return {
      id: attachmentId(),
      name,
      meta: size ? `Image • ${size}` : 'Image',
      uri: asset.uri,
      kind: 'image' as const,
    };
  });
}

/** Pick a single image as a base64 data URI for inline insertion (WebView can't load file://). */
export async function pickInlineImageDataUri(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: false,
    quality: 0.6,
    base64: true,
  });

  const asset = result.assets?.[0];
  if (result.canceled || !asset?.base64) return null;

  const mime = asset.mimeType ?? 'image/jpeg';
  return `data:${mime};base64,${asset.base64}`;
}
