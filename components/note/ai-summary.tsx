import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  summary: string;
  /** Extra sentence revealed by "Show more". */
  more: string;
};

/** AI Summary section with a Show more/less toggle when extra text exists. */
export function AiSummary({ summary, more }: Props) {
  const colors = useTheme();
  const [expanded, setExpanded] = useState(false);
  const hasMore = more.trim().length > 0;

  return (
    <View>
      <Text className="mb-2" style={[styles.heading, { color: colors.onSurface }]}>
        AI Summary
      </Text>
      <Text className="mb-1" style={[styles.body, { color: colors.onSurfaceVariant }]}>
        {expanded ? `${summary} ${more}` : summary}
      </Text>
      {hasMore ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setExpanded((now) => !now)}
          className="self-start py-1">
          <Text style={[styles.link, { color: colors.secondary }]}>
            {expanded ? 'Show less' : 'Show more'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: fonts.bodyRegular,
  },
  link: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
