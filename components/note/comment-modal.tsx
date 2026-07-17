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

import { CommentAvatar } from '@/components/note/comment-avatar';
import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import { timeAgo } from '@/lib/relative-time';

type Props = {
  visible: boolean;
  /** The passage the comment is anchored to. */
  quote: string;
  /** Existing body when editing; empty for a new comment. */
  initialBody: string;
  /** Editing an existing comment (shows Delete) vs. writing a new one. */
  editing: boolean;
  /** When the existing comment was created — drives the header timestamp. */
  timestamp?: string | null;
  onSave: (body: string) => void;
  onDelete: () => void;
  onCancel: () => void;
};

/** Comment card for the reader: header, pinned passage, and composer; existing ones edit or delete. */
export function CommentModal({
  visible,
  quote,
  initialBody,
  editing,
  timestamp,
  onSave,
  onDelete,
  onCancel,
}: Props) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [body, setBody] = useState(initialBody);

  // Sync the field each time the sheet opens on a different comment.
  useEffect(() => {
    if (visible) setBody(initialBody);
  }, [visible, initialBody]);

  const canSave = body.trim().length > 0;
  const when = editing ? timeAgo(timestamp) || 'edited' : 'Now';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.root}>
        <Pressable
          accessibilityLabel="Close"
          onPress={onCancel}
          style={[styles.backdrop, { backgroundColor: withAlpha(colors.onSurface, 0.35) }]}
        />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surfaceLowest, marginBottom: 16 + insets.bottom, shadowColor: colors.shadow },
            ]}>
            {/* Header — avatar · You · time · close */}
            <View className="flex-row items-center gap-3 px-4 pt-4">
              <CommentAvatar size={34} />
              <View className="flex-1">
                <Text style={[styles.author, { color: colors.onSurface }]}>You</Text>
                <Text style={[styles.time, { color: colors.outline }]}>{when}</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onCancel}
                hitSlop={10}
                className="h-8 w-8 items-center justify-center rounded-pill">
                <AppIcon name="close" size={18} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* Pinned passage the comment is anchored to */}
            {quote ? (
              <View
                className="mx-4 mt-3 rounded-xl px-3 py-2.5"
                style={{ borderLeftWidth: 3, borderLeftColor: colors.secondary, backgroundColor: withAlpha(colors.secondaryFixed, 0.4) }}>
                <Text numberOfLines={3} style={[styles.quote, { color: colors.onSurfaceVariant }]}>
                  {quote}
                </Text>
              </View>
            ) : null}

            {/* Composer — input + circular send button (Figma's blue reply) */}
            <View className="flex-row items-end gap-2 px-4 pb-4 pt-3">
              <TextInput
                autoFocus
                value={body}
                onChangeText={setBody}
                multiline
                placeholder={editing ? 'Edit your comment…' : 'Add a comment…'}
                placeholderTextColor={colors.outline}
                style={[
                  styles.input,
                  { color: colors.onSurface, backgroundColor: colors.surfaceLow, borderColor: withAlpha(colors.outlineVariant, 0.5) },
                ]}
              />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Save comment"
                disabled={!canSave}
                onPress={() => onSave(body)}
                style={[
                  styles.send,
                  { backgroundColor: canSave ? colors.secondary : withAlpha(colors.outlineVariant, 0.4) },
                ]}>
                <AppIcon name="send" size={18} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>

            {editing ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={onDelete}
                className="mx-4 mb-4 flex-row items-center justify-center gap-2 rounded-xl py-2.5"
                style={{ backgroundColor: withAlpha(colors.errorContainer, 0.5) }}>
                <AppIcon name="delete" size={16} color={colors.error} />
                <Text style={[styles.delete, { color: colors.error }]}>Delete comment</Text>
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
    // Soft floating-card shadow — the Figma comment "pops" off the page.
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  author: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fonts.bodySemibold,
  },
  time: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
  quote: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyItalic,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fonts.bodyRegular,
    textAlignVertical: 'top',
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delete: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
