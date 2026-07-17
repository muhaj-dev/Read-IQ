import { SymbolView } from 'expo-symbols';
import { PropsWithChildren, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();

  return (
    <ThemedView>
      <Pressable
        className="flex-row items-center gap-2"
        style={({ pressed }) => pressed && styles.pressedHeading}
        onPress={() => setIsOpen((value) => !value)}>
        <ThemedView
          type="backgroundElement"
          className="h-6 w-6 items-center justify-center rounded-inner">
          <SymbolView
            name="chevron.right"
            size={14}
            weight="bold"
            tintColor={theme.text}
            style={{ transform: [{ rotate: isOpen ? '-90deg' : '90deg' }] }}
          />
        </ThemedView>

        <ThemedText type="small">{title}</ThemedText>
      </Pressable>
      {isOpen && (
        <Animated.View entering={FadeIn.duration(200)}>
          <ThemedView type="backgroundElement" className="ml-6 mt-4 rounded-card p-6">
            {children}
          </ThemedView>
        </Animated.View>
      )}
    </ThemedView>
  );
}

// Only the dynamic pressed-opacity stays in StyleSheet (function style prop).
const styles = StyleSheet.create({
  pressedHeading: {
    opacity: 0.7,
  },
});
