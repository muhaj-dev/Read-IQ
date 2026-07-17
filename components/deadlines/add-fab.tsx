import { StyleSheet, TouchableOpacity } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  onPress: () => void;
};

/** Floating "+" button (bottom-right) → Add Deadline. */
export function AddFab({ onPress }: Props) {
  const colors = useTheme();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Add deadline"
      activeOpacity={0.85}
      onPress={onPress}
      className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-pill"
      style={[styles.fab, { backgroundColor: colors.secondaryContainer, shadowColor: colors.shadow }]}>
      <AppIcon name="add" size={26} color={colors.onPrimary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
});
