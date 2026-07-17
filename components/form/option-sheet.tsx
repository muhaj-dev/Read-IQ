import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

export type SheetOption = {
  label: string;
  /** "Custom" opens a follow-up picker → renders a chevron, not a check. */
  chevron?: boolean;
};

type Props = {
  visible: boolean;
  options: SheetOption[];
  selected: string;
  onSelect: (label: string) => void;
  onCancel: () => void;
  /** When set, shows an inline "add" row that lets the student type a new option. */
  onAddOption?: (name: string) => void;
  /** Label + placeholder for the add row (e.g. "Add subject or course"). */
  addLabel?: string;
};

/** Bottom-sheet option picker with a check on the selected row. */
export function OptionSheet({
  visible,
  options,
  selected,
  onSelect,
  onCancel,
  onAddOption,
  addLabel = 'Add new',
}: Props) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const submitNew = () => {
    const name = draft.trim();
    if (name) onAddOption?.(name);
    setDraft('');
    setAdding(false);
  };

  // Modal is a Style Exception Rule component → styles, not className.
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.root}>
        <Pressable
          accessibilityLabel="Close"
          onPress={onCancel}
          style={[styles.backdrop, { backgroundColor: withAlpha(colors.onSurface, 0.4) }]}
        />

        {/* Lift the sheet above the keyboard so the "add" input stays visible. */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.sheet, { backgroundColor: colors.surfaceLowest }]}>
          <View
            className="h-14 justify-center px-5"
            style={{ borderBottomWidth: 1, borderBottomColor: withAlpha(colors.outlineVariant, 0.3) }}>
            <TouchableOpacity accessibilityRole="button" onPress={onCancel} hitSlop={12} className="self-start px-2">
              <Text style={[styles.cancel, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((option, index) => {
              const isSelected = !option.chevron && option.label === selected;
              return (
                <TouchableOpacity
                  key={option.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  activeOpacity={0.7}
                  onPress={() => (option.chevron ? undefined : onSelect(option.label))}
                  className="flex-row items-center justify-between px-5 py-4"
                  style={[
                    index > 0 && { borderTopWidth: 1, borderTopColor: withAlpha(colors.outlineVariant, 0.3) },
                    isSelected && { backgroundColor: withAlpha(colors.surfaceLow, 0.3) },
                  ]}>
                  <Text
                    style={
                      isSelected
                        ? [styles.optionSelected, { color: colors.primary }]
                        : [styles.option, { color: colors.onSurface }]
                    }>
                    {option.label}
                  </Text>
                  {isSelected ? <AppIcon name="check" size={20} color={colors.primary} /> : null}
                  {option.chevron ? (
                    <AppIcon name="chevron-right" size={20} color={colors.outlineVariant} />
                  ) : null}
                </TouchableOpacity>
              );
            })}

            {onAddOption ? (
              <View style={{ borderTopWidth: 1, borderTopColor: withAlpha(colors.outlineVariant, 0.3) }}>
                {adding ? (
                  <TextInput
                    autoFocus
                    value={draft}
                    onChangeText={setDraft}
                    onSubmitEditing={submitNew}
                    onBlur={submitNew}
                    placeholder={addLabel}
                    placeholderTextColor={colors.outlineVariant}
                    returnKeyType="done"
                    style={[styles.addInput, { color: colors.onSurface }]}
                  />
                ) : (
                  <TouchableOpacity
                    accessibilityRole="button"
                    activeOpacity={0.7}
                    onPress={() => setAdding(true)}
                    className="flex-row items-center gap-2 px-5 py-4">
                    <AppIcon name="add" size={20} color={colors.primary} />
                    <Text style={[styles.addLabel, { color: colors.primary }]}>{addLabel}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            <View style={{ height: 32 + insets.bottom }} />
          </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cancel: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyBold,
  },
  option: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.bodyRegular,
  },
  optionSelected: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.bodyBold,
  },
  addLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.bodySemibold,
  },
  addInput: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.bodyRegular,
  },
});
