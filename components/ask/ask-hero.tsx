import { StyleSheet, Text, View } from 'react-native';

import { NoteIqMark } from '@/components/brand/brand-logo';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

/** Hero: the noteIQ mark above the "Ask anything from your notes" headline. */
export function AskHero() {
  const colors = useTheme();

  return (
    <View className="items-center">
      <NoteIqMark width={56} />
      <Text className="mt-6 text-center" style={[styles.headline, { color: colors.primary }]}>
        Ask anything{'\n'}from your notes
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headline: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fonts.headingExtrabold,
    letterSpacing: -0.5,
  },
});
