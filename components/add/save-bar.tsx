import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

export type SaveState = 'idle' | 'saving' | 'saved';

type Props = {
  state: SaveState;
  onRetake: () => void;
  onSave: () => void;
};

/** Fixed bottom bar: Retake + the wide Save to Memory button with its states. */
export function SaveBar({ state, onRetake, onSave }: Props) {
  const colors = useTheme();
  // The success flash mirrors the mock's green "Saved!" moment.
  const saveBackground = state === 'saved' ? colors.methodUpload : colors.primary;

  return (
    <View className="absolute bottom-0 left-0 right-0 flex-row gap-4 px-5 pb-10 pt-4">
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onRetake}
        disabled={state !== 'idle'}
        className="items-center justify-center rounded-inner px-6 py-4"
        style={[styles.button, { backgroundColor: colors.surfaceLowest, shadowColor: colors.shadow }]}>
        <Text style={[styles.label, { color: colors.secondary }]}>Retake</Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={onSave}
        disabled={state !== 'idle'}
        className="flex-1 flex-row items-center justify-center gap-2 rounded-inner px-6 py-4"
        style={[styles.button, { backgroundColor: saveBackground, shadowColor: colors.shadow }]}>
        {state === 'saving' ? (
          <ActivityIndicator size="small" color={colors.onPrimary} />
        ) : state === 'saved' ? (
          <AppIcon name="check-circle" size={18} color={colors.onPrimary} filled />
        ) : null}
        <Text style={[styles.label, { color: colors.onPrimary }]}>
          {state === 'saving' ? 'Saving...' : state === 'saved' ? 'Saved!' : 'Save to Memory'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
