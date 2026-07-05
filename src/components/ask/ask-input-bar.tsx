import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
};

/** Pinned follow-up input: white pill with a round indigo send button. */
export function AskInputBar({ value, onChangeText, onSend }: Props) {
  const colors = useTheme();

  return (
    <View className="px-5 pb-3 pt-2">
      <View
        className="flex-row items-end gap-3 rounded-pill py-2 pl-5 pr-2"
        style={[
          styles.pill,
          {
            backgroundColor: colors.surfaceLowest,
            borderColor: colors.outlineVariant,
            shadowColor: colors.shadow,
          },
        ]}>
        {/* TextInput doesn't take className (Style Exception Rule) → inline style. */}
        {/* multiline + default return key → the keyboard shows Enter (newline),
            not "send", so students can write freely. Tap the button to send. */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          multiline
          returnKeyType="default"
          placeholder="Ask a follow up..."
          placeholderTextColor={colors.outline}
          style={[styles.input, { color: colors.onSurface }]}
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Send"
          activeOpacity={0.85}
          onPress={onSend}
          className="h-10 w-10 items-center justify-center rounded-pill"
          style={{ backgroundColor: colors.fab }}>
          <AppIcon name="send" size={20} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodyRegular,
    paddingVertical: 8,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
});
