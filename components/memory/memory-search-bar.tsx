import { StyleSheet, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
};

/** Rounded search field above the note list — filters notes by title. */
export function MemorySearchBar({ value, onChangeText }: Props) {
  const colors = useTheme();

  return (
    <View
      className="h-12 flex-row items-center gap-2 rounded-inner px-4"
      style={{ backgroundColor: colors.surfaceLow }}>
      <AppIcon name="search" size={24} color={colors.outline} />
      {/* TextInput doesn't take className (Style Exception Rule). */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search your notes..."
        placeholderTextColor={colors.outline}
        returnKeyType="search"
        style={[styles.input, { color: colors.onSurface }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.bodyRegular,
    paddingVertical: 0, // Android adds its own vertical padding
  },
});
