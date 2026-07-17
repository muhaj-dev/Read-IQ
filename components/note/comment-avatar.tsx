import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { useTheme } from '@/hooks/use-theme';

/** Commenter avatar in the reader — a filled indigo circle for "You". */
export function CommentAvatar({ size = 34 }: { size?: number }) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.secondary },
      ]}>
      <AppIcon name="person" size={Math.round(size * 0.62)} color={colors.onPrimary} filled />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
