// .docx → text, entirely on-device. A .docx is a zip; the visible text lives in
// `word/document.xml` (body) plus separate parts for headers, footers, footnotes and
// endnotes. We unzip with jszip and convert each part's <w:t> runs to plain text —
// no BTL call, so it costs no runtime credits (unlike PDF extraction).

import JSZip from 'jszip';

import type { NoteAttachment } from '@/types/note';

import { fileUriToBase64, isDocx } from './files';

/** Decode the handful of XML entities Word writes into run text. */
function decodeXmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&'); // last, so we never double-decode
}

/** Flatten a run of Word markup to its <w:t> text, with tabs/breaks as whitespace. */
function runsToText(xml: string, separator: string): string {
  return xml
    .replace(/<w:tab\b[^>]*\/?>/g, separator)
    .replace(/<w:(?:br|cr)\b[^>]*\/?>/g, separator)
    .replace(/<\/w:p>/g, separator)
    .replace(/<[^>]+>/g, '') // drop all remaining tags, keep text nodes
    .replace(/\s+/g, ' ')
    .trim();
}

/** Convert one <w:tbl> block to a text grid: cells joined by tabs, rows by newlines. */
function tableXmlToText(tbl: string): string {
  const rows: string[] = [];
  const rowRe = /<w:tr\b[^>]*>([\s\S]*?)<\/w:tr>/g;
  let row: RegExpExecArray | null;
  while ((row = rowRe.exec(tbl))) {
    const cells: string[] = [];
    const cellRe = /<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/g;
    let cell: RegExpExecArray | null;
    // Each cell collapses to a single line so it stays in one grid column.
    while ((cell = cellRe.exec(row[1]))) cells.push(runsToText(cell[1], ' '));
    rows.push(cells.join('\t'));
  }
  return rows.join('\n');
}

/** Turn one Word xml part (body / header / footer / notes) into readable plain text.
 *  Tables keep their grid; field codes (<w:instrText>) and deletions (<w:delText>)
 *  are dropped; paragraphs, tabs and breaks become whitespace; entities are decoded. */
export function docXmlToText(xml: string): string {
  const text = xml
    .replace(/<w:instrText\b[^>]*>[\s\S]*?<\/w:instrText>/g, '')
    .replace(/<w:delText\b[^>]*>[\s\S]*?<\/w:delText>/g, '')
    // Pull tables out first so cell/row structure survives without touching prose.
    .replace(/<w:tbl\b[^>]*>[\s\S]*?<\/w:tbl>/g, (tbl) => `\n${tableXmlToText(tbl)}\n`)
    .replace(/<w:tab\b[^>]*\/?>/g, '\t')
    .replace(/<w:(?:br|cr)\b[^>]*\/?>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, ''); // drop all remaining tags, keep text nodes

  return decodeXmlEntities(text)
    .replace(/[ \t]+\n/g, '\n') // trim trailing space/tab on each line
    .replace(/\n{3,}/g, '\n\n') // collapse runs of blank lines (empty paragraphs)
    .trim();
}

/** Read a set of xml parts to text, skipping empties and de-duping identical parts
 *  (Word writes the same running head into header1/2/3 — we want it once). */
async function partsToText(files: JSZip.JSZipObject[]): Promise<string[]> {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const file of files) {
    const text = docXmlToText(await file.async('text'));
    if (text && !seen.has(text)) {
      seen.add(text);
      out.push(text);
    }
  }
  return out;
}

/** Extract a single .docx's full text locally (may be empty). Throws on read/zip failure.
 *  Reading order: headers → body → footnotes/endnotes → footers. */
export async function extractDocxText(attachment: NoteAttachment): Promise<string> {
  const base64 = await fileUriToBase64(attachment.uri);
  const zip = await JSZip.loadAsync(base64, { base64: true });

  const body = zip.file('word/document.xml');
  if (!body) {
    console.warn('[docx-extract] no word/document.xml in', attachment.name);
    return '';
  }

  const sections = [
    ...(await partsToText(zip.file(/word\/header\d*\.xml/))),
    docXmlToText(await body.async('text')),
    ...(await partsToText([zip.file('word/footnotes.xml'), zip.file('word/endnotes.xml')].filter(Boolean) as JSZip.JSZipObject[])),
    ...(await partsToText(zip.file(/word\/footer\d*\.xml/))),
  ];

  const text = sections.filter((s) => s.trim()).join('\n\n');
  console.log('[docx-extract]', attachment.name, '· text length:', text.length);
  return text;
}

/** Extract and join text from every .docx in a set (non-docx ignored); '' when none. */
export async function extractDocxsText(attachments: NoteAttachment[]): Promise<string> {
  const parts: string[] = [];
  for (const docx of attachments.filter(isDocx)) {
    const text = await extractDocxText(docx);
    if (text) parts.push(text);
  }
  return parts.join('\n\n');
}
