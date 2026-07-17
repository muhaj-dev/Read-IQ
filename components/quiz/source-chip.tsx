import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  /** The subject/course the quiz was drawn from. */
  label: string;
};

/** Grounding proof pill: "From your notes · <subject>". */
export function SourceChip({ label }: Props) {
  const colors = useTheme();
  return (
    <View
      className="flex-row items-center gap-1.5 self-center rounded-pill px-3 py-1.5"
      style={{ backgroundColor: withAlpha(colors.secondary, 0.1) }}>
      <AppIcon name="auto-awesome" size={14} color={colors.secondary} filled />
      <Text numberOfLines={1} style={[styles.text, { color: colors.secondary }]}>
        From your notes · {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    lineHeight: 16,
    maxWidth: 260,
    fontFamily: fonts.bodySemibold,
  },
});
