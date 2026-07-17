import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  tags: string[];
  onAdd: (tag: string) => void;
};

/** Subject-tag chips plus the "Add tag..." input row (see the scan-result mock). */
export function TagEditor({ tags, onAdd }: Props) {
  const colors = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState('');

  const submit = () => {
    const tag = draft.trim();
    if (!tag) return;
    onAdd(tag);
    setDraft('');
  };

  return (
    <View>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {tags.map((tag) => (
          <View
            key={tag}
            className="flex-row items-center gap-1 rounded-pill px-3 py-1"
            style={{ backgroundColor: colors.surfaceVariant }}>
            <AppIcon name="psychology" size={14} color={colors.onSurfaceVariant} />
            <Text style={[styles.chipLabel, { color: colors.onSurfaceVariant }]}># {tag}</Text>
          </View>
        ))}
        {/* The little "+" chip from the mock — jumps focus to the tag input. */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Add a tag"
          onPress={() => inputRef.current?.focus()}
          className="items-center justify-center rounded-pill px-3 py-1"
          style={{ backgroundColor: colors.surfaceVariant }}>
          <AppIcon name="add" size={14} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <View
        className="mt-4 flex-row items-center gap-2 rounded-inner p-2"
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.surfaceLowest,
            borderColor: colors.outlineVariant,
            shadowColor: colors.shadow,
          },
        ]}>
        <View className="px-2">
          <AppIcon name="tag" size={22} color={colors.onSurfaceVariant} />
        </View>
        <TextInput
          ref={inputRef}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          placeholder="Add tag..."
          placeholderTextColor={withAlpha(colors.onSurfaceVariant, 0.5)}
          returnKeyType="done"
          className="flex-1"
          style={[styles.input, { color: colors.onSurface }]}
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Add tag"
          onPress={submit}
          className="h-10 w-10 items-center justify-center rounded-btn"
          style={{ backgroundColor: colors.primaryContainer }}>
          <AppIcon name="add" size={22} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chipLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
  inputRow: {
    borderWidth: 1,
    // 0 4px 20px rgba(46,49,146,.06) from the mock.
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.bodyRegular,
    paddingVertical: 8,
  },
});
