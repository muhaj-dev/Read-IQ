// Parses noteIQ's answer text into the light block structure the model is asked
// to produce (see lib/chat.ts SYSTEM_PROMPT): paragraphs, "**Heading:**" lines,
// "- " bullets, "1." numbered steps, and inline **bold** key terms. It is a tiny,
// forgiving markdown subset — enough to give a dense answer structure without a
// heavy dependency. Partial/streaming markdown degrades gracefully to plain text.

/** A leaf block — the pieces that make up a paragraph or a list. */
export type Leaf =
  | { kind: 'para'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'ordered'; items: string[] };

/** A "**Heading:**" line — rendered as a bold section heading. */
export type Heading = { kind: 'label'; text: string };

/** A term + its definition (a "**Term**" line immediately followed by a body):
 *  rendered as a highlighted definition card so the student sees the definition of
 *  each part up front (see the photosynthesis format). `body` is the leaf beneath. */
export type Definition = { kind: 'definition'; term: string; body: Leaf };

export type Block = Leaf | Heading | Definition;

const BULLET_RE = /^\s*[-*•]\s+(.*)$/;
const ORDERED_RE = /^\s*\d+[.)]\s+(.*)$/;
const HEADING_RE = /^\s*#{1,6}\s+(.*)$/;
// A whole line that is just "**Heading:**" (or "**Heading**") — a section header.
const LABEL_RE = /^\*\*(.+?)\*\*:?$/;

/** Trim a heading/term and drop a trailing colon ("Calvin cycle:" → "Calvin cycle"). */
function stripColon(text: string): string {
  return text.trim().replace(/:\s*$/, '');
}

/** Group the answer's lines into paragraphs, bullet lists, numbered lists, and
 *  heading lines. Blank lines and a change of kind flush the current run. */
function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let bullets: string[] = [];
  let ordered: string[] = [];

  const flushPara = () => {
    if (para.length) blocks.push({ kind: 'para', text: para.join(' ') });
    para = [];
  };
  const flushBullets = () => {
    if (bullets.length) blocks.push({ kind: 'bullets', items: bullets });
    bullets = [];
  };
  const flushOrdered = () => {
    if (ordered.length) blocks.push({ kind: 'ordered', items: ordered });
    ordered = [];
  };
  const flushAll = () => {
    flushPara();
    flushBullets();
    flushOrdered();
  };

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) {
      flushAll();
      continue;
    }

    const bullet = line.match(BULLET_RE);
    const number = line.match(ORDERED_RE);
    const heading = line.match(HEADING_RE);
    const label = line.match(LABEL_RE);

    if (bullet) {
      flushPara();
      flushOrdered();
      bullets.push(bullet[1].trim());
    } else if (number) {
      flushPara();
      flushBullets();
      ordered.push(number[1].trim());
    } else if (heading) {
      flushAll();
      blocks.push({ kind: 'label', text: stripColon(heading[1]) });
    } else if (label) {
      flushAll();
      // The model often bakes the colon inside the bold ("**Calvin cycle:**"); drop
      // it so the definition-card term reads cleanly.
      blocks.push({ kind: 'label', text: stripColon(label[1]) });
    } else {
      flushBullets();
      flushOrdered();
      para.push(line);
    }
  }

  flushAll();
  return blocks;
}

/**
 * Pair each "**Term**" heading with the leaf directly beneath it into a single
 * `definition` block — the definition-card look (term + its meaning). A heading
 * with no body under it (or another heading right after) stays a plain label, and
 * unlabelled paragraphs (the intro / closing explanation) are untouched.
 */
function groupDefinitions(blocks: Block[]): Block[] {
  const out: Block[] = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const next = blocks[i + 1];
    if (block.kind === 'label' && next && next.kind !== 'label' && next.kind !== 'definition') {
      out.push({ kind: 'definition', term: block.text, body: next });
      i += 1; // consume the body leaf
    } else {
      out.push(block);
    }
  }
  return out;
}

/** Parse answer text into render-ready blocks (definitions, paragraphs, lists). */
export function parseAnswer(text: string): Block[] {
  return groupDefinitions(parseBlocks(text));
}
