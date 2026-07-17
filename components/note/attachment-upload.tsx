import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  /** Open the device file picker. */
  onPress: () => void;
};

/** Empty attachments state: a tap-to-upload card. */
export function AttachmentUpload({ onPress }: Props) {
  const colors = useTheme();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Upload a file"
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-center justify-between rounded-lg border p-3"
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceLowest,
          borderColor: withAlpha(colors.outlineVariant, 0.4),
          shadowColor: colors.shadow,
        },
      ]}>
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded"
          style={{ backgroundColor: colors.surfaceLow }}>
          <AppIcon name="file-upload" size={20} color={colors.onSurfaceVariant} />
        </View>
        <View>
          <Text style={[styles.name, { color: colors.onSurface }]}>Upload a file</Text>
          <Text style={[styles.meta, { color: colors.outline }]}>PDF or document</Text>
        </View>
      </View>
      <View
        className="h-8 w-8 items-center justify-center rounded-btn"
        style={{ backgroundColor: colors.primaryContainer }}>
        <AppIcon name="add" size={20} color={colors.onPrimary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  name: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyRegular,
  },
});
