import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  topic: string;
  /** Set once the student chooses — retires the buttons for a status line. */
  decided?: 'saved' | 'once';
  /** An answer is streaming — disable the buttons. */
  busy: boolean;
  onSave: () => void;
  onOnce: () => void;
};

/** Under an out-of-notes image answer: offer to keep the photo in memory, or answer once. */
export function ImageDecisionCard({ topic, decided, busy, onSave, onOnce }: Props) {
  const colors = useTheme();

  if (decided === 'saved') {
    return (
      <View className="flex-row items-center gap-2 self-start rounded-inner px-3 py-2" style={{ backgroundColor: withAlpha(colors.quizCorrectWell, 0.5) }}>
        <AppIcon name="check-circle" size={16} color={colors.quizCheck} filled />
        <Text style={[styles.status, { color: colors.quizCheck }]}>
          Saved to your memory{topic ? ` · ${topic}` : ''}
        </Text>
      </View>
    );
  }
  if (decided === 'once') {
    return (
      <View className="flex-row items-center gap-2 self-start rounded-inner px-3 py-2" style={{ backgroundColor: colors.surfaceContainer }}>
        <AppIcon name="flash-on" size={15} color={colors.onSurfaceVariant} />
        <Text style={[styles.status, { color: colors.onSurfaceVariant }]}>
          Answered once — image not saved
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row gap-2 self-start">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Save image to memory and answer"
        activeOpacity={0.85}
        disabled={busy}
        onPress={onSave}
        className="flex-row items-center gap-2 rounded-pill px-4 py-2.5"
        style={{ backgroundColor: colors.secondary, opacity: busy ? 0.5 : 1 }}>
        <AppIcon name="psychology" size={18} color={colors.onPrimary} filled />
        <Text style={[styles.save, { color: colors.onPrimary }]}>Save to memory</Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Just answer once without saving"
        activeOpacity={0.7}
        disabled={busy}
        onPress={onOnce}
        className="flex-row items-center gap-2 rounded-pill px-4 py-2.5"
        style={{ borderWidth: 1, borderColor: colors.outlineVariant, opacity: busy ? 0.5 : 1 }}>
        <Text style={[styles.once, { color: colors.onSurfaceVariant }]}>Just once</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  save: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fonts.bodySemibold,
  },
  once: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fonts.bodySemibold,
  },
  status: {
    fontSize: 13,
    lineHeight: 17,
    fontFamily: fonts.bodySemibold,
  },
});
