import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  title: string;
  body: string;
};

/** The tinted tip banner under the method grid, with a sparkle watermark. */
export function TipCard({ title, body }: Props) {
  const colors = useTheme();

  return (
    <View
      className="overflow-hidden rounded-card p-6"
      style={{
        backgroundColor: colors.surfaceLow,
        borderWidth: 1,
        borderColor: withAlpha(colors.outlineVariant, 0.3),
      }}>
      <Text className="mb-2" style={[styles.title, { color: colors.primary }]}>
        {title}
      </Text>
      <Text style={[styles.body, { color: colors.onSurfaceVariant }]}>{body}</Text>
      <View className="absolute -bottom-4 -right-4">
        <AppIcon name="auto-awesome" size={120} color={withAlpha(colors.primary, 0.1)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyBold,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyRegular,
  },
});
