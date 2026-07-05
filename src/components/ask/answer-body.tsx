import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { parseAnswer, type Leaf } from '@/lib/answer-blocks';

// Renders noteIQ's answer from the parsed block structure (see lib/answer-blocks):
// clear paragraphs, "**Heading:**" bold headings, "- " bullets, "1." numbered
// steps, and inline **bold** key terms — a calm, readable study answer.

/** Render a line's inline **bold** spans, leaving the rest as plain text. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        const bold = part.length >= 4 && part.startsWith('**') && part.endsWith('**');
        return (
          <Text key={i} style={bold ? styles.bold : undefined}>
            {bold ? part.slice(2, -2) : part}
          </Text>
        );
      })}
    </>
  );
}

/** Render one leaf (paragraph, bullet list, or numbered list). */
function LeafBlock({ block }: { block: Leaf }) {
  const colors = useTheme();

  if (block.kind === 'para') {
    return (
      <Text style={[styles.text, { color: colors.onSurface }]}>
        <Inline text={block.text} />
      </Text>
    );
  }

  return (
    <View className="gap-1.5">
      {block.items.map((item, j) => (
        <View key={j} className="flex-row gap-2">
          <Text style={[styles.marker, { color: colors.primary }]}>
            {block.kind === 'ordered' ? `${j + 1}.` : '•'}
          </Text>
          <Text style={[styles.text, styles.item, { color: colors.onSurface }]}>
            <Inline text={item} />
          </Text>
        </View>
      ))}
    </View>
  );
}

type Props = { text: string };

/** The formatted answer body used inside the AI chat bubble. */
export function AnswerBody({ text }: Props) {
  const colors = useTheme();
  const blocks = parseAnswer(text);

  return (
    <View className="gap-2.5">
      {blocks.map((block, i) => {
        if (block.kind === 'label') {
          return (
            <Text key={i} style={[styles.label, { color: colors.onSurface }]}>
              <Inline text={block.text} />
            </Text>
          );
        }

        // A term + its definition → a highlighted card so the student sees the
        // definition of each part up front, with explanation below (see mock).
        if (block.kind === 'definition') {
          return (
            <View
              key={i}
              className="gap-1 rounded-inner border p-3"
              style={{ backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }}>
              <Text style={[styles.term, { color: colors.primary }]}>
                <Inline text={block.term} />
              </Text>
              <LeafBlock block={block.body} />
            </View>
          );
        }

        return <LeafBlock key={i} block={block} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: fonts.bodyRegular,
  },
  item: {
    // flexShrink (not flex:1) so the text still reports its full intrinsic width.
    // The chat bubble is shrink-to-fit; flex:1 (flex-basis 0) would collapse it to
    // the bullet marker's width and wrap the text one character per line.
    flexShrink: 1,
  },
  marker: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: fonts.bodySemibold,
    minWidth: 16,
  },
  label: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.bodyBold,
  },
  term: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fonts.bodyBold,
  },
  bold: {
    fontFamily: fonts.bodySemibold,
  },
});
