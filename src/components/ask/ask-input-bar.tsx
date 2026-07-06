import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AskAttachMenu } from '@/components/ask/ask-attach-menu';
import { AskAttachmentRow } from '@/components/ask/ask-attachment-row';
import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import type { DictationStatus } from '@/hooks/use-voice-dictation';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import type { ChatAttachment } from '@/types/chat';

type Voice = {
  status: DictationStatus;
  seconds: number;
  start: () => void;
  stop: () => void;
  cancel: () => void;
};

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  canSend: boolean;
  attachments: ChatAttachment[];
  onRemoveAttachment: (id: string) => void;
  onLibrary: () => void;
  onCamera: () => void;
  voice: Voice;
  notice: string | null;
  onDismissNotice: () => void;
};

/** m:ss for the live recording timer. */
function clock(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** ChatGPT/Claude-style composer: + attach · text · mic/send, with dictation + images. */
export function AskInputBar({
  value,
  onChangeText,
  onSend,
  canSend,
  attachments,
  onRemoveAttachment,
  onLibrary,
  onCamera,
  voice,
  notice,
  onDismissNotice,
}: Props) {
  const colors = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const recording = voice.status === 'recording';
  const transcribing = voice.status === 'transcribing';

  return (
    <View className="px-5 pb-3 pt-2">
      {notice ? (
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={onDismissNotice}
          className="mb-2 flex-row items-center gap-2 self-start rounded-pill px-3 py-1.5"
          style={{ backgroundColor: withAlpha(colors.errorContainer, 0.5) }}>
          <AppIcon name="warning" size={14} color={colors.error} />
          <Text style={[styles.notice, { color: colors.error }]}>{notice}</Text>
        </TouchableOpacity>
      ) : null}

      <AskAttachmentRow attachments={attachments} onRemove={onRemoveAttachment} />

      {recording ? (
        <View
          className="flex-row items-center gap-3 rounded-pill py-2 pl-4 pr-2"
          style={[styles.pill, { backgroundColor: colors.surfaceLowest, borderColor: withAlpha(colors.error, 0.4), shadowColor: colors.shadow }]}>
          <TouchableOpacity accessibilityLabel="Cancel recording" hitSlop={8} onPress={voice.cancel}>
            <AppIcon name="close" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <View className="h-2.5 w-2.5 rounded-pill" style={{ backgroundColor: colors.error }} />
          <Text style={[styles.recording, { color: colors.onSurface }]}>
            Listening… {clock(voice.seconds)}
          </Text>
          <View className="flex-1" />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Stop and transcribe"
            activeOpacity={0.85}
            onPress={voice.stop}
            className="h-10 w-10 items-center justify-center rounded-pill"
            style={{ backgroundColor: colors.error }}>
            <AppIcon name="stop" size={20} color={colors.onPrimary} filled />
          </TouchableOpacity>
        </View>
      ) : (
        <View
          className="flex-row items-end gap-2 rounded-card py-2 pl-2 pr-2"
          style={[styles.pill, { backgroundColor: colors.surfaceLowest, borderColor: colors.outlineVariant, shadowColor: colors.shadow }]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Add an image"
            activeOpacity={0.7}
            onPress={() => setMenuOpen(true)}
            className="h-10 w-10 items-center justify-center rounded-pill"
            style={{ backgroundColor: colors.surfaceContainer }}>
            <AppIcon name="add" size={22} color={colors.secondary} />
          </TouchableOpacity>

          <TextInput
            value={value}
            onChangeText={onChangeText}
            multiline
            returnKeyType="default"
            placeholder="Ask about your notes…"
            placeholderTextColor={colors.outline}
            editable={!transcribing}
            style={[styles.input, { color: colors.onSurface }]}
          />

          {transcribing ? (
            <View className="h-10 w-10 items-center justify-center">
              <ActivityIndicator size="small" color={colors.secondary} />
            </View>
          ) : canSend ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Send"
              activeOpacity={0.85}
              onPress={onSend}
              className="h-10 w-10 items-center justify-center rounded-pill"
              style={{ backgroundColor: colors.fab }}>
              <AppIcon name="send" size={20} color={colors.onPrimary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Hold to dictate"
              activeOpacity={0.7}
              onPress={voice.start}
              className="h-10 w-10 items-center justify-center rounded-pill"
              style={{ backgroundColor: colors.surfaceContainer }}>
              <AppIcon name="mic" size={20} color={colors.secondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <AskAttachMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLibrary={onLibrary}
        onCamera={onCamera}
      />
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
    paddingVertical: 10,
    paddingHorizontal: 4,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  notice: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
    flexShrink: 1,
  },
  recording: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
