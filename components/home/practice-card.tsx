import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  onPress: () => void;
};

/** The "Take a quick quiz" call-to-action banner. */
export function PracticeCard({ onPress }: Props) {
  const colors = useTheme();
  const onCard = colors.onPrimary;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="flex-row items-center justify-between rounded-card p-4"
      style={[styles.card, { backgroundColor: colors.secondaryContainer, shadowColor: colors.shadow }]}>
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: withAlpha(onCard, 0.2) }}>
          <AppIcon name="quiz" size={20} color={onCard} />
        </View>
        <View>
          <Text style={[styles.title, { color: onCard }]}>Take a quick quiz</Text>
          <Text className="mt-px" style={[styles.subtitle, { color: withAlpha(onCard, 0.8) }]}>
            Practice weak topics to boost mastery
          </Text>
        </View>
      </View>
      <AppIcon name="chevron-right" size={24} color={onCard} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyRegular,
  },
});
