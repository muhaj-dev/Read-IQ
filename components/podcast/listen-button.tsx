import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  onPress: () => void;
};

/** Secondary CTA on Note Details: broadcast the note as a two-host conversation. */
export function ListenButton({ onPress }: Props) {
  const colors = useTheme();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Broadcast this note as a two-host conversation"
      activeOpacity={0.85}
      onPress={onPress}
      className="h-14 w-full flex-row items-center gap-3 rounded-card px-4"
      style={{ backgroundColor: withAlpha(colors.secondary, 0.1), borderColor: withAlpha(colors.secondary, 0.35), borderWidth: 1 }}>
      <View className="h-9 w-9 items-center justify-center rounded-pill" style={{ backgroundColor: colors.secondary }}>
        <AppIcon name="headphones" size={20} color={colors.onPrimary} />
      </View>
      <View className="flex-1">
        <Text style={[styles.title, { color: colors.secondary }]}>Broadcast this note</Text>
        <Text style={[styles.sub, { color: colors.onSurfaceVariant }]}>A two-host conversation from your notes</Text>
      </View>
      <AppIcon name="chevron-right" size={22} color={colors.secondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodyBold,
  },
  sub: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyRegular,
  },
});
