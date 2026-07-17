// Structured view of note HTML for the Note Reader — PRESERVES formatting (marks,
// headings, lists, quotes, code, images). Targets TenTap/TipTap's clean output,
// not general HTML.

import { decodeEntities } from './rich-text';

export type InlineMark = 'bold' | 'italic' | 'underline' | 'strike' | 'highlight' | 'code';

/** A run of text sharing the same set of inline marks. */
export type InlineSpan = { text: string; marks: InlineMark[] };

/** One reader block. Text blocks carry inline spans; images stand alone. */
export type RichBlock =
  | { kind: 'heading'; level: 1 | 2 | 3; spans: InlineSpan[] }
  | { kind: 'paragraph'; spans: InlineSpan[] }
  | { kind: 'quote'; spans: InlineSpan[] }
  | { kind: 'list'; ordered: boolean; index: number; depth: number; checked: boolean | null; spans: InlineSpan[] }
  | { kind: 'code'; spans: InlineSpan[] }
  | { kind: 'image'; src: string };

type SpanBlock = Exclude<RichBlock, { kind: 'image' }>;

const INLINE_TAGS: Record<string, InlineMark> = {
  strong: 'bold',
  b: 'bold',
  em: 'italic',
  i: 'italic',
  u: 'underline',
  s: 'strike',
  del: 'strike',
  strike: 'strike',
  mark: 'highlight',
};

// One tag OR a run of text between tags. Groups: 1 = tag name, 2 = attrs, 3 = text.
const TOKEN_RE = /<\/?([a-zA-Z][\w-]*)([^>]*?)\/?>|([^<]+)/g;

/** Parse note HTML into ordered reader blocks that keep their formatting. */
export function htmlToRichBlocks(html: string): RichBlock[] {
  if (!html) return [];

  const blocks: RichBlock[] = [];
  const marks: InlineMark[] = []; // active inline marks (a stack, may nest)
  const lists: { ordered: boolean; count: number }[] = [];
  // Boxed in an object so TS keeps the union type — a closure-mutated `let` narrows to `null`.
  const open: { block: SpanBlock | null } = { block: null };
  let quoteDepth = 0;
  let inPre = false;

  const activeMarks = () => Array.from(new Set(marks)).sort();

  // Append text to the open block, merging into the last span when marks match.
  const push = (text: string) => {
    if (!open.block || !text) return;
    const key = activeMarks();
    const spans = open.block.spans;
    const last = spans[spans.length - 1];
    if (last && last.marks.join('|') === key.join('|')) last.text += text;
    else spans.push({ text, marks: key });
  };

  // Commit the open block (trimming edge whitespace) if it has any real text.
  const flush = () => {
    if (!open.block) return;
    const { spans, kind } = open.block;
    if (spans.length) {
      if (kind !== 'code') {
        spans[0].text = spans[0].text.replace(/^\s+/, '');
        spans[spans.length - 1].text = spans[spans.length - 1].text.replace(/\s+$/, '');
      }
      if (spans.some((s) => s.text.length)) blocks.push(open.block);
    }
    open.block = null;
  };

  const start = (block: SpanBlock) => {
    flush();
    open.block = block;
  };

  const dropMark = (mark: InlineMark) => {
    for (let i = marks.length - 1; i >= 0; i -= 1)
      if (marks[i] === mark) {
        marks.splice(i, 1);
        break;
      }
  };

  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(html)) !== null) {
    // Text node
    if (m[3] != null) {
      const decoded = decodeEntities(m[3]);
      const text = inPre ? decoded : decoded.replace(/\s+/g, ' ');
      if (!inPre && !text.trim() && !open.block) continue; // whitespace between blocks
      if (!open.block && text.trim()) start({ kind: quoteDepth ? 'quote' : 'paragraph', spans: [] });
      push(text);
      continue;
    }

    const name = m[1].toLowerCase();
    const attrs = m[2] ?? '';
    const isClose = m[0].startsWith('</');

    if (name in INLINE_TAGS) {
      if (isClose) dropMark(INLINE_TAGS[name]);
      else marks.push(INLINE_TAGS[name]);
      continue;
    }

    switch (name) {
      case 'br':
        push('\n');
        break;
      case 'img': {
        const src = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
        if (src) {
          flush();
          blocks.push({ kind: 'image', src: decodeEntities(src) });
        }
        break;
      }
      case 'code': // inline code mark; the <pre><code> wrapper is handled by 'pre'
        if (inPre) break;
        if (isClose) dropMark('code');
        else marks.push('code');
        break;
      case 'pre':
        if (isClose) {
          inPre = false;
          flush();
        } else {
          inPre = true;
          start({ kind: 'code', spans: [] });
        }
        break;
      case 'blockquote':
        if (isClose) {
          quoteDepth = Math.max(0, quoteDepth - 1);
          flush();
        } else quoteDepth += 1;
        break;
      case 'ul':
      case 'ol':
        if (isClose) {
          lists.pop();
          flush();
        } else lists.push({ ordered: name === 'ol', count: 0 });
        break;
      case 'li': {
        if (isClose) {
          flush();
          break;
        }
        const frame = lists[lists.length - 1];
        if (frame) frame.count += 1;
        const checked = /\bdata-checked\s*=/.test(attrs)
          ? /\bdata-checked\s*=\s*["']?true/i.test(attrs)
          : null;
        start({
          kind: 'list',
          ordered: frame?.ordered ?? false,
          index: frame?.count ?? 1,
          depth: lists.length,
          checked,
          spans: [],
        });
        break;
      }
      case 'p': {
        const block = open.block;
        if (isClose) {
          if (block && (block.kind === 'paragraph' || block.kind === 'quote')) flush();
        } else if (block?.kind === 'list') {
          if (block.spans.length) push('\n'); // a second paragraph inside one list item
        } else {
          start({ kind: quoteDepth ? 'quote' : 'paragraph', spans: [] });
        }
        break;
      }
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        if (isClose) flush();
        else start({ kind: 'heading', level: Math.min(3, Number(name[1])) as 1 | 2 | 3, spans: [] });
        break;
      // label / input / div (task-list chrome) and any unknown tags: ignored,
      // their text still flows into the current block.
    }
  }

  flush();
  return blocks;
}
