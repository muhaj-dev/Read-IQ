// Rich text <-> plain text. The editor stores HTML; retrieval/grounding uses the
// plain-text projection derived here on save (inline images drop out).

const BLOCK_TAGS = /<\/(p|div|h[1-6]|li|blockquote|tr)>/gi;
const LINE_BREAKS = /<br\s*\/?>/gi;
const ALL_TAGS = /<[^>]+>/g;

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

/** Decode HTML entities (named + numeric) back to their characters. Keeps the
 *  literal for unknown named entities so nothing is silently dropped. */
export function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&[a-z]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m);
}

/** Strip HTML to readable plain text: block tags become newlines, tags removed. */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  const text = html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(LINE_BREAKS, '\n')
    .replace(BLOCK_TAGS, '\n')
    .replace(ALL_TAGS, '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&[a-z]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? ' ');

  return text
    .split('\n')
    .map((line) => line.replace(/[ \t ]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Escape text for safe HTML embedding. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Wrap legacy plain-text notes as HTML (one <p> per line, so headings target one line). */
export function plainTextToHtml(text: string): string {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return '';
  return trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
}

/** Split `<br>`s inside a `<p>` into separate paragraphs (only `<p>` touched), so a
 *  heading targets the tapped line. No-op for notes already using paragraphs. */
export function splitHardBreaks(html: string): string {
  if (!html || !/<br\s*\/?>/i.test(html)) return html;
  return html.replace(/<p>([\s\S]*?)<\/p>/gi, (whole, inner) => {
    if (!/<br\s*\/?>/i.test(inner)) return whole;
    return inner
      .split(/<br\s*\/?>/i)
      .map((part: string) => `<p>${part}</p>`)
      .join('');
  });
}

/** Does this HTML carry any real text or image? Guards against saving "<p></p>". */
export function isRichContentEmpty(html: string): boolean {
  if (!html) return true;
  if (/<img\b/i.test(html)) return false;
  return htmlToPlainText(html).length === 0;
}

/** The src of the first inline <img>, or null — the note's preview thumbnail. */
export function firstInlineImageSrc(html: string | null | undefined): string | null {
  if (!html) return null;
  const match = html.match(/<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/i);
  return match ? match[1] : null;
}
