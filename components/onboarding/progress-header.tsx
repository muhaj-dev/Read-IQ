import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { OnboardIcon } from '@/components/onboarding/onboard-icon';
import { Onboard } from '@/constants/theme';
import { fonts } from '@/constants/typography';

type Props = {
  /** Current onboarding step, 1-based. */
  step: number;
  total?: number;
  /** When set, a back arrow renders at the left of the header row. */
  onBack?: () => void;
};

/** Shared onboarding header: "n/3" label + segmented progress bars. */
export function ProgressHeader({ step, total = 3, onBack }: Props) {
  return (
    <View className="flex-row items-center gap-4 px-5 pb-6">
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          className="-ml-2 h-10 w-10 items-center justify-center rounded-pill"
          accessibilityLabel="Go back">
          <OnboardIcon name="arrow-back" size={20} color={Onboard.onSurfaceVariant} />
        </TouchableOpacity>
      )}
      <Text style={styles.label}>
        {step}/{total}
      </Text>
      <View className="flex-1 flex-row gap-2">
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            className="h-1 flex-1 rounded-pill"
            style={{ backgroundColor: i < step ? Onboard.primary : Onboard.surfaceVariant }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
    color: Onboard.onSurfaceVariant,
  },
});
