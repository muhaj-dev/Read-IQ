import { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Notes field — taller box, top-aligned text. */
  multiline?: boolean;
  /** Override the multiline box height (e.g. Edit Note's content editor). */
  minHeight?: number;
  /** Show a danger border — e.g. a required field left blank on save. */
  error?: boolean;
  /** Keyboard variant — e.g. "email-address" for the email field. */
  keyboardType?: TextInputProps['keyboardType'];
  /** Auto-capitalization — "none" for emails. */
  autoCapitalize?: TextInputProps['autoCapitalize'];
};

/** White filled input that gains an indigo focus ring. */
export function FormInput({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  minHeight,
  error = false,
  keyboardType,
  autoCapitalize,
}: Props) {
  const colors = useTheme();
  const [focused, setFocused] = useState(false);

  // TextInput is a Style Exception Rule component → styles, not className.
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.outlineVariant}
      multiline={multiline}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[
        styles.input,
        multiline ? styles.multiline : styles.single,
        multiline && minHeight != null && { minHeight },
        {
          backgroundColor: colors.surfaceLowest,
          color: colors.onSurface,
          shadowColor: colors.shadow,
          borderColor: error
            ? colors.error
            : focused
              ? colors.secondaryContainer
              : withAlpha(colors.shadow, 0),
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 8,
    borderWidth: 2,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: fonts.bodyRegular,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  single: {
    height: 48,
    paddingVertical: 0,
  },
  multiline: {
    minHeight: 104,
    paddingVertical: 14,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
});
