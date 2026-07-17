import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  children: ReactNode;
};

/** One Settings group: uppercase label over a white card of rows. */
export function SettingsSection({ label, children }: Props) {
  const colors = useTheme();

  return (
    <View>
      <Text className="mb-4 px-1" style={[styles.label, { color: colors.onSurfaceVariant }]}>
        {label}
      </Text>
      <View
        className="overflow-hidden rounded-inner"
        style={[styles.card, { backgroundColor: colors.surfaceLowest, shadowColor: colors.shadow }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  card: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
});
