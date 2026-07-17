import { version } from 'expo/package.json';
import { Image } from 'expo-image';
import { useColorScheme, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export function WebBadge() {
  const scheme = useColorScheme();

  return (
    <ThemedView className="items-center gap-2 p-8">
      <ThemedText type="code" themeColor="textSecondary" className="text-center">
        v{version}
      </ThemedText>
      <Image
        source={
          scheme === 'dark'
            ? require('@/assets/images/expo-badge-white.png')
            : require('@/assets/images/expo-badge.png')
        }
        style={styles.badgeImage}
      />
    </ThemedView>
  );
}

// Image sizing kept in StyleSheet (Style Exception Rule — aspect-ratio'd asset).
const styles = StyleSheet.create({
  badgeImage: {
    width: 123,
    aspectRatio: 123 / 24,
  },
});
