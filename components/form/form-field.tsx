import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  children: ReactNode;
};

/** Form section: muted label above its control (Title, Subject, Type, …). */
export function FormField({ label, children }: Props) {
  const colors = useTheme();

  return (
    <View className="gap-2">
      <Text className="ml-1" style={[styles.label, { color: colors.onSurfaceVariant }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
