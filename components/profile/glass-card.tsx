import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  children: ReactNode;
  /** NativeWind classes for layout/radius; colours stay theme-driven here. */
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/** Frosted "glass" card used on the indigo profile panel (white @8% + hairline). */
export function GlassCard({ children, className, style }: Props) {
  const colors = useTheme();

  return (
    <View
      className={className}
      style={[
        styles.card,
        {
          backgroundColor: withAlpha(colors.onPrimary, 0.08),
          borderColor: withAlpha(colors.onPrimary, 0.1),
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});
