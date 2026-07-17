import { Image } from 'expo-image';
import { StyleSheet, Text, type TextStyle, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { EditorHighlight, EditorHighlightInk, Fonts } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import type { InlineMark, InlineSpan, RichBlock } from '@/lib/rich-blocks';

type Props = {
  /** The note title, rendered as the article's chapter heading. */
  title: string;
  /** Formatting-preserving content blocks (see htmlToRichBlocks). */
  blocks: RichBlock[];
};

type Colors = ReturnType<typeof useTheme>;

/** Note Reader article — renders the note's rich blocks exactly as written. */
export function ReaderArticle({ title, blocks }: Props) {
  const colors = useTheme();

  // Demote quotes in a run to plain paragraphs; keep the card only for an isolated pull-quote.
  const demoteQuote = (i: number) =>
    blocks[i].kind === 'quote' &&
    (blocks[i - 1]?.kind === 'quote' || blocks[i + 1]?.kind === 'quote');

  return (
    <View className="gap-4">
      <Text style={[styles.chapter, { color: colors.onSurface }]}>{title}</Text>
      {blocks.length === 0 ? (
        <Text style={[styles.body, { color: colors.onSurfaceVariant }]}>
          This note has no content yet.
        </Text>
      ) : (
        blocks.map((block, index) => (
          <BlockView key={index} block={block} colors={colors} plainQuote={demoteQuote(index)} />
        ))
      )}
    </View>
  );
}

/** One reader block, dispatched by kind. */
function BlockView({
  block,
  colors,
  plainQuote,
}: {
  block: RichBlock;
  colors: Colors;
  /** Render a `quote` block as a normal paragraph (part of a quote run). */
  plainQuote?: boolean;
}) {
  if (block.kind === 'image') {
    return (
      <Image
        source={{ uri: block.src }}
        style={[
          styles.image,
          { backgroundColor: colors.surfaceLowest, borderColor: withAlpha(colors.outlineVariant, 0.3) },
        ]}
        contentFit="contain"
        transition={150}
      />
    );
  }

  if (block.kind === 'heading') {
    const level = block.level === 1 ? styles.h1 : block.level === 2 ? styles.h2 : styles.h3;
    return (
      <Text style={[level, { color: colors.onSurface }]}>
        {renderSpans(block.spans, colors, true)}
      </Text>
    );
  }

  if (block.kind === 'quote') {
    // A quote in a run renders as a plain paragraph, not a boxed card.
    if (plainQuote) {
      return (
        <Text style={[styles.body, { color: colors.onSurfaceVariant }]}>
          {renderSpans(block.spans, colors)}
        </Text>
      );
    }
    return (
      <View
        style={[
          styles.quote,
          { borderLeftColor: colors.secondary, backgroundColor: withAlpha(colors.secondaryFixed, 0.35) },
        ]}>
        <Text style={[styles.quoteText, { color: colors.onSurfaceVariant }]}>
          {renderSpans(block.spans, colors)}
        </Text>
      </View>
    );
  }

  if (block.kind === 'code') {
    return (
      <View
        style={[
          styles.code,
          { backgroundColor: colors.surfaceLow, borderColor: withAlpha(colors.outlineVariant, 0.4) },
        ]}>
        <Text style={[styles.codeText, { color: colors.onSurface }]}>
          {block.spans.map((s) => s.text).join('')}
        </Text>
      </View>
    );
  }

  if (block.kind === 'list') return <ListRow block={block} colors={colors} />;

  return (
    <Text style={[styles.body, { color: colors.onSurfaceVariant }]}>
      {renderSpans(block.spans, colors)}
    </Text>
  );
}

/** A single list item: bullet, number, or a checkbox for task-list items. */
function ListRow({
  block,
  colors,
}: {
  block: Extract<RichBlock, { kind: 'list' }>;
  colors: Colors;
}) {
  const done = block.checked === true;
  return (
    <View className="flex-row" style={{ paddingLeft: 4 + (block.depth - 1) * 18, gap: 8 }}>
      {block.checked === null ? (
        <Text style={[styles.marker, { color: colors.onSurfaceVariant }]}>
          {block.ordered ? `${block.index}.` : '•'}
        </Text>
      ) : (
        <View
          style={[
            styles.checkbox,
            { borderColor: colors.outline, backgroundColor: done ? colors.secondary : undefined },
          ]}>
          {done ? <AppIcon name="check" size={12} color={colors.onPrimary} /> : null}
        </View>
      )}
      <Text
        className="flex-1"
        style={[
          styles.body,
          { color: colors.onSurfaceVariant, textDecorationLine: done ? 'line-through' : 'none' },
        ]}>
        {renderSpans(block.spans, colors)}
      </Text>
    </View>
  );
}

/** Render inline spans as nested <Text>, each styled by its marks. */
function renderSpans(spans: InlineSpan[], colors: Colors, heading = false) {
  return spans.map((span, i) => (
    <Text key={i} style={markStyle(span.marks, colors, heading)}>
      {span.text}
    </Text>
  ));
}

/** Map a span's marks to a text style (headings keep their font). */
function markStyle(marks: InlineMark[], colors: Colors, heading: boolean): TextStyle {
  const style: TextStyle = {};
  const bold = marks.includes('bold');
  const italic = marks.includes('italic');

  if (marks.includes('code')) {
    style.fontFamily = Fonts?.mono;
    style.backgroundColor = withAlpha(colors.outlineVariant, 0.25);
  } else if (!heading && bold && italic) {
    style.fontFamily = fonts.bodyBold;
    style.fontStyle = 'italic';
  } else if (!heading && bold) {
    style.fontFamily = fonts.bodyBold;
  } else if (italic) {
    if (heading) style.fontStyle = 'italic';
    else style.fontFamily = fonts.bodyItalic;
  }

  const decorations: string[] = [];
  if (marks.includes('underline')) decorations.push('underline');
  if (marks.includes('strike')) decorations.push('line-through');
  if (decorations.length) style.textDecorationLine = decorations.join(' ') as TextStyle['textDecorationLine'];

  if (marks.includes('highlight')) {
    style.backgroundColor = EditorHighlight;
    style.color = EditorHighlightInk;
  }
  return style;
}

const styles = StyleSheet.create({
  chapter: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: fonts.headingBold,
  },
  h1: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fonts.headingBold,
  },
  h2: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: fonts.headingSemibold,
  },
  h3: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: fonts.headingSemibold,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: fonts.bodyRegular,
  },
  marker: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: fonts.bodySemibold,
    minWidth: 18,
  },
  quote: {
    borderLeftWidth: 3,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: fonts.bodyItalic,
  },
  code: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  codeText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Fonts?.mono,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    borderWidth: 1,
  },
});
