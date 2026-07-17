import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Onboard } from '@/constants/theme';
import { fonts } from '@/constants/typography';

type Props = {
  title: string;
  onTitleChange: (value: string) => void;
  note: string;
  onNoteChange: (value: string) => void;
};

/** Onboarding First Note editor: optional save-name field above the paste box. */
/** Onboarding First Note editor: optional save-name field above the paste box. */
/** Onboarding First Note editor: optional save-name field above the paste box. */
export function FirstNoteFields({ title, onTitleChange, note, onNoteChange }: Props) {
  return (
    <View className="flex-1 gap-3">
      <View>
        <Text className="mb-1.5" style={styles.label}>
          Save name
        </Text>
        {/* TextInput is a Style Exception Rule component → colors via StyleSheet. */}
        <View className="rounded-inner px-4 py-3" style={styles.field}>
          <TextInput
            value={title}
            onChangeText={onTitleChange}
            placeholder="Name this note (optional)"
            placeholderTextColor={Onboard.outline}
            style={styles.titleInput}
          />
        </View>
      </View>

      <View className="min-h-[160px] flex-1 rounded-inner p-4" style={styles.noteCard}>
        <TextInput
          multiline
          value={note}
          onChangeText={onNoteChange}
          placeholder="Paste your notes here..."
          placeholderTextColor={Onboard.outline}
          textAlignVertical="top"
          style={styles.noteInput}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bodySemibold,
    color: Onboard.onSurfaceVariant,
  },
  field: {
    backgroundColor: Onboard.surfaceLowest,
    borderWidth: 1,
    borderColor: Onboard.border,
  },
  titleInput: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.bodyMedium,
    color: Onboard.onSurface,
    padding: 0,
  },
  noteCard: {
    backgroundColor: Onboard.surfaceLowest,
    borderWidth: 1,
    borderColor: Onboard.border,
    shadowColor: Onboard.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  noteInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.bodyRegular,
    color: Onboard.onSurface,
  },
});
