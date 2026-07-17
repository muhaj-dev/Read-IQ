import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Onboard } from '@/constants/theme';
import { fonts } from '@/constants/typography';

type Props = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  /** Show an accent asterisk marking the field as required. */
  required?: boolean;
  /** Keyboard variant — e.g. "email-address" for the email field. */
  keyboardType?: TextInputProps['keyboardType'];
  /** Auto-capitalization — "none" for emails. */
  autoCapitalize?: TextInputProps['autoCapitalize'];
};

/** "Tell us about you" form field: label + input that lifts on focus. */
export function LabeledInput({
  label,
  value,
  placeholder,
  onChangeText,
  required,
  keyboardType,
  autoCapitalize,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-2">
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {/* TextInput is a Style Exception Rule component → styles, not className. */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Onboard.outlineVariant}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, focused && styles.inputFocused]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
    color: Onboard.onSurface,
  },
  required: {
    color: Onboard.primary,
  },
  input: {
    backgroundColor: Onboard.surfaceLow,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.bodyRegular,
    color: Onboard.onSurface,
  },
  inputFocused: {
    backgroundColor: Onboard.surfaceLowest,
    borderColor: Onboard.secondaryContainer,
  },
});
