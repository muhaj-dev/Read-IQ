import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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

type Props = {
  visible: boolean;
  /** Existing href when editing a link already on the selection. */
  initialUrl?: string;
  onSubmit: (url: string) => void;
  /** Removes the link from the selected text (shown only when editing one). */
  onRemove: () => void;
  onClose: () => void;
};

/** Small sheet to add or edit a link on the selected text in the note editor. */
export function LinkInputModal({ visible, initialUrl, onSubmit, onRemove, onClose }: Props) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [url, setUrl] = useState(initialUrl ?? '');

  useEffect(() => {
    if (visible) setUrl(initialUrl ?? '');
  }, [visible, initialUrl]);

  const editing = !!initialUrl;
  const trimmed = url.trim();
  const canSave = trimmed.length > 0;
  // Prepend a scheme so bare domains resolve as real links.
  const normalise = (v: string) => (/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          accessibilityLabel="Close"
          onPress={onClose}
          style={[styles.backdrop, { backgroundColor: withAlpha(colors.onSurface, 0.35) }]}
        />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surfaceLowest, marginBottom: 16 + insets.bottom, shadowColor: colors.shadow },
            ]}>
            <View className="flex-row items-center gap-2 px-4 pt-4">
              <AppIcon name="link" size={18} color={colors.secondary} />
              <Text style={[styles.title, { color: colors.onSurface }]}>
                {editing ? 'Edit link' : 'Add link'}
              </Text>
              <View className="flex-1" />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                hitSlop={10}
                className="h-8 w-8 items-center justify-center rounded-pill">
                <AppIcon name="close" size={18} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center gap-2 px-4 pb-4 pt-3">
              <TextInput
                autoFocus
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholder="https://example.com"
                placeholderTextColor={colors.outline}
                onSubmitEditing={() => canSave && onSubmit(normalise(trimmed))}
                style={[
                  styles.input,
                  { color: colors.onSurface, backgroundColor: colors.surfaceLow, borderColor: withAlpha(colors.outlineVariant, 0.5) },
                ]}
              />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Save link"
                disabled={!canSave}
                onPress={() => onSubmit(normalise(trimmed))}
                style={[
                  styles.save,
                  { backgroundColor: canSave ? colors.secondary : withAlpha(colors.outlineVariant, 0.4) },
                ]}>
                <AppIcon name="check" size={18} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>

            {editing ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={onRemove}
                className="mx-4 mb-4 flex-row items-center justify-center gap-2 rounded-xl py-2.5"
                style={{ backgroundColor: withAlpha(colors.errorContainer, 0.5) }}>
                <AppIcon name="delete" size={16} color={colors.error} />
                <Text style={[styles.remove, { color: colors.error }]}>Remove link</Text>
              </TouchableOpacity>
            ) : null}
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
  card: {
    marginHorizontal: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fonts.bodyRegular,
  },
  save: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remove: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
