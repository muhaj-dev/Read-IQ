import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  /** The captured / picked photo. Undefined only if the route is hit directly. */
  uri?: string;
};

/** Captured page preview (3:4 card) with the "Optimized" badge (see the mock). */
export function ScanPreview({ uri }: Props) {
  const colors = useTheme();

  return (
    <View>
      <View
        className="w-full overflow-hidden rounded-inner"
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceLow,
            borderColor: colors.outlineVariant,
            shadowColor: colors.shadow,
          },
        ]}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} contentFit="cover" />
        ) : (
          <View className="items-center justify-center" style={styles.image}>
            <AppIcon name="image" size={48} color={colors.outlineVariant} />
          </View>
        )}
      </View>
      <View
        className="absolute right-4 top-4 flex-row items-center gap-2 rounded-pill px-3 py-1.5"
        style={[styles.badge, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}>
        <AppIcon name="check-circle" size={18} color={colors.onPrimary} filled />
        <Text style={[styles.badgeLabel, { color: colors.onPrimary }]}>Optimized</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    // 0 4px 20px rgba(46,49,146,.06) from the mock.
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  badge: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
