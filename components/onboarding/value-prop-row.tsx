import { StyleSheet, Text, View } from 'react-native';

import { OnboardIcon, type OnboardIconName } from '@/components/onboarding/onboard-icon';
import { Onboard } from '@/constants/theme';
import { fonts } from '@/constants/typography';

type Props = {
  icon: OnboardIconName;
  title: string;
  description: string;
};

/** One value-proposition row on the Welcome screen: icon circle + title + blurb. */
export function ValuePropRow({ icon, title, description }: Props) {
  return (
    <View className="flex-row items-start gap-4">
      <View
        className="h-10 w-10 items-center justify-center rounded-pill"
        style={{ backgroundColor: Onboard.surfaceContainer }}>
        <OnboardIcon name={icon} size={22} color={Onboard.secondary} />
      </View>
      <View className="flex-1">
        <Text className="mb-1" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
    color: Onboard.onSurface,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyRegular,
    color: Onboard.onSurfaceVariant,
  },
});
