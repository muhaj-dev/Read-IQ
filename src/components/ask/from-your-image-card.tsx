import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

/** Trust tag proving the answer used the photo the student attached to this question. */
export function FromYourImageCard() {
  const colors = useTheme();

  return (
    <View
      className="max-w-[70%] flex-row items-center gap-3 self-start rounded-inner p-3"
      style={{
        backgroundColor: withAlpha(colors.topicAmberBg, 0.8),
        borderWidth: 1,
        borderColor: colors.topicAmberBorder,
      }}>
      <View
        className="h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: withAlpha(colors.surfaceLowest, 0.6) }}>
        <AppIcon name="image" size={18} color={colors.topicAmberInk} />
      </View>
      <Text style={[styles.label, { color: colors.topicAmberInk }]}>FROM YOUR IMAGE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 10,
    lineHeight: 12,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.8,
  },
});
