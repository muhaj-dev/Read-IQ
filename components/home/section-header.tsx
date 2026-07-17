import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  /** Optional right-side link, e.g. "View all". */
  action?: string;
  onAction?: () => void;
};

/** Uppercase section label used above every dashboard block. */
export function SectionHeader({ title, action, onAction }: Props) {
  const colors = useTheme();

  return (
    <View className="flex-row items-center justify-between px-1">
      <Text style={[styles.title, { color: colors.onSurface }]}>{title.toUpperCase()}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction} hitSlop={12}>
          <Text style={[styles.action, { color: colors.secondary }]}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.7,
  },
  action: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
});
