import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import type { AiModel } from '@/data/ai-models';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  model: AiModel;
  selected: boolean;
  onPress: () => void;
};

/** One selectable AI-model row: name + provider · description, with a check when active. */
export function ModelOptionCard({ model, selected, onPress }: Props) {
  const colors = useTheme();

  return (
    <TouchableOpacity
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={model.label}
      activeOpacity={0.75}
      onPress={onPress}
      className="flex-row items-center gap-4 p-4"
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceLowest,
          borderColor: selected ? colors.primary : withAlpha(colors.outlineVariant, 0.5),
          borderWidth: selected ? 2 : 1,
        },
      ]}>
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text style={[styles.label, { color: colors.onSurface }]}>{model.label}</Text>
          {model.recommended ? (
            <View style={[styles.pill, { backgroundColor: withAlpha(colors.primary, 0.12) }]}>
              <Text style={[styles.pillText, { color: colors.primary }]}>Recommended</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.provider, { color: colors.onSurfaceVariant }]}>{model.provider}</Text>
        <Text style={[styles.desc, { color: colors.onSurfaceVariant }]}>{model.description}</Text>
      </View>

      <AppIcon
        name="check-circle"
        size={24}
        color={selected ? colors.primary : withAlpha(colors.outlineVariant, 0.6)}
        filled={selected}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
  },
  label: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.headingBold,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fonts.bodySemibold,
    letterSpacing: 0.2,
  },
  provider: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodySemibold,
    letterSpacing: 0.2,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bodyRegular,
  },
});
