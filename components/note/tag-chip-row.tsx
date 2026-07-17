import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  tags: string[];
  onAdd: (tag: string) => void;
};

/** Edit Note's tag chips + the inline "＋ Add tag" affordance (see the mock). */
export function TagChipRow({ tags, onAdd }: Props) {
  const colors = useTheme();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const submit = () => {
    const tag = draft.trim();
    if (tag) onAdd(tag);
    setDraft('');
    setAdding(false);
  };

  return (
    <View className="flex-row flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <View
          key={tag}
          className="rounded-pill px-4 py-1.5"
          style={{ backgroundColor: withAlpha(colors.primaryContainer, 0.1) }}>
          <Text style={[styles.chip, { color: colors.primaryContainer }]}>{tag}</Text>
        </View>
      ))}

      {adding ? (
        // TextInput is a Style Exception Rule component → styles, not className.
        <TextInput
          autoFocus
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          onBlur={submit}
          placeholder="New tag"
          placeholderTextColor={colors.outlineVariant}
          returnKeyType="done"
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceLowest,
              borderColor: colors.secondaryContainer,
              color: colors.onSurface,
            },
          ]}
        />
      ) : (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Add a tag"
          onPress={() => setAdding(true)}
          className="ml-1 flex-row items-center gap-1 py-1.5">
          <AppIcon name="add" size={16} color={colors.primaryContainer} />
          <Text style={[styles.chip, { color: colors.primaryContainer }]}>Add tag</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyMedium,
  },
  input: {
    minWidth: 104,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyMedium,
  },
});
