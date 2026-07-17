import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  /** Muted hint shown when there's no text yet (e.g. transcription found nothing). */
  placeholder?: string;
};

/** "Extracted Text" section: heading + Edit toggle + the OCR text card. */
export function ExtractedTextCard({ value, onChangeText, placeholder }: Props) {
  const colors = useTheme();
  const [editing, setEditing] = useState(false);

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <Text style={[styles.heading, { color: colors.primary }]}>Extracted Text</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={editing ? 'Finish editing' : 'Edit extracted text'}
          onPress={() => setEditing((now) => !now)}
          className="h-11 flex-row items-center gap-1 px-1">
          <Text style={[styles.editLabel, { color: colors.secondary }]}>
            {editing ? 'Done' : 'Edit'}
          </Text>
          <AppIcon name={editing ? 'check-circle' : 'edit'} size={16} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      <View
        className="rounded-inner p-5"
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceLowest,
            borderColor: editing ? colors.secondaryContainer : colors.outlineVariant,
            shadowColor: colors.shadow,
          },
        ]}>
        {editing ? (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            multiline
            autoFocus
            style={[styles.body, styles.input, { color: colors.onSurface }]}
          />
        ) : value ? (
          <Text style={[styles.body, { color: colors.onSurface }]}>{value}</Text>
        ) : (
          <Text style={[styles.body, { color: colors.outlineVariant }]}>{placeholder ?? ''}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 18,
    lineHeight: 32,
    // Match the "Scan Result" page title family (AddHeader uses fonts.bodyBold).
    fontFamily: fonts.bodyBold,
  },
  editLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  card: {
    borderWidth: 1,
    // 0 4px 20px rgba(46,49,146,.06) from the mock.
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: fonts.bodyRegular,
  },
  input: {
    padding: 0,
    textAlignVertical: 'top',
  },
});
