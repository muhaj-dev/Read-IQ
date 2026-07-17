import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  onPress: () => void;
};

/** Secondary CTA beside "Open Note" — only shown for notes that have a PDF. */
export function PdfReaderButton({ onPress }: Props) {
  const colors = useTheme();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="PDF Reader"
      activeOpacity={0.85}
      onPress={onPress}
      className="h-14 flex-row items-center justify-center gap-2 rounded-card border px-4"
      style={{
        backgroundColor: colors.surfaceLowest,
        borderColor: withAlpha(colors.secondary, 0.4),
      }}>
      <AppIcon name="picture-as-pdf" size={22} color={colors.secondary} />
      <Text style={[styles.label, { color: colors.secondary }]}>PDF Reader</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
