import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AiBubble } from '@/components/ask/ai-bubble';
import { AskHero } from '@/components/ask/ask-hero';
import { BeyondNotesButton } from '@/components/ask/beyond-notes-button';
import { FromYourImageCard } from '@/components/ask/from-your-image-card';
import { FromYourNotesCard } from '@/components/ask/from-your-notes-card';
import { GenerateMoreButton } from '@/components/ask/generate-more-button';
import { ImageDecisionCard } from '@/components/ask/image-decision-card';
import { SuggestionChips } from '@/components/ask/suggestion-chips';
import { UserBubble } from '@/components/ask/user-bubble';
import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { suggestionChips } from '@/data/ask-chat';
import { useTheme } from '@/hooks/use-theme';
import { NO_NOTES_YET, NOT_IN_NOTES } from '@/lib/chat';
import { clockTime } from '@/lib/relative-time';
import { useChatStore } from '@/store/use-chat-store';
import type { ChatMessage } from '@/types/chat';

/** True for the honest "not in your notes" fallback replies; matches exact text since the beyond flag isn't persisted. */
function isFallbackReply(content: string): boolean {
  return content === NO_NOTES_YET || content.startsWith(NOT_IN_NOTES);
}

/** Nudge shown under an ungrounded answer — the honest "add a note" path. */
function AddNoteCta() {
  const colors = useTheme();
  const router = useRouter();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Add a note"
      activeOpacity={0.8}
      onPress={() => router.push('/add')}
      className="max-w-[70%] flex-row items-center gap-2 self-start rounded-inner px-3 py-2"
      style={{ backgroundColor: colors.surfaceContainer }}>
      <AppIcon name="add" size={18} color={colors.primary} />
      <Text style={[styles.ctaLabel, { color: colors.primary }]}>Add a note</Text>
    </TouchableOpacity>
  );
}

/** One turn: the question, or noteIQ's answer + source tags. nextIsBeyond hides the used opt-in. */
function MessageRow({ message, nextIsBeyond }: { message: ChatMessage; nextIsBeyond: boolean }) {
  const generateMore = useChatStore((s) => s.generateMore);
  const answerBeyond = useChatStore((s) => s.answerBeyond);
  const resolveImageDecision = useChatStore((s) => s.resolveImageDecision);
  const sending = useChatStore((s) => s.sending);

  if (message.role === 'user') {
    return (
      <UserBubble
        text={message.content}
        time={clockTime(message.createdAt)}
        attachments={message.attachments}
      />
    );
  }

  const settled = !message.streaming;
  const deciding = !!message.imageDecision;
  const fallback =
    settled && !message.error && !message.beyond && !deciding && isFallbackReply(message.content);
  // Offer "Generate more" under every settled, note-backed answer until the notes are exhausted.
  const canGenerateMore = settled && message.grounded && !message.exhausted;
  // Offer the opt-in outside answer under any settled reply that hasn't spawned one.
  const canAskBeyond =
    settled &&
    !message.error &&
    !message.beyond &&
    !message.beyondAsked &&
    !deciding &&
    !nextIsBeyond &&
    (message.grounded || fallback);

  return (
    <View className="gap-3">
      <AiBubble
        text={message.content}
        time={clockTime(message.createdAt)}
        streaming={message.streaming}
        error={message.error}
        beyond={message.beyond}
      />
      {message.citations.map((citation) => (
        <FromYourNotesCard
          key={citation.noteId}
          noteId={citation.noteId}
          noteTitle={citation.noteTitle}
        />
      ))}
      {settled && message.fromImage ? <FromYourImageCard /> : null}
      {deciding ? (
        <ImageDecisionCard
          topic={message.imageDecision!.topic}
          decided={message.decided}
          busy={sending}
          onSave={() => resolveImageDecision(message.id, 'saved')}
          onOnce={() => resolveImageDecision(message.id, 'once')}
        />
      ) : null}
      {canGenerateMore ? (
        <GenerateMoreButton busy={message.continuing} onPress={() => generateMore(message.id)} />
      ) : null}
      {fallback ? <AddNoteCta /> : null}
      {canAskBeyond ? <BeyondNotesButton onPress={() => answerBeyond(message.id)} /> : null}
    </View>
  );
}

type Props = {
  messages: ChatMessage[];
  /** Tapping a suggestion chip seeds the input box. */
  onPickChip: (chip: string) => void;
};

/** Scrollable chat area: the calm hero + chips when empty, the thread otherwise. */
export function AskConversation({ messages, onPickChip }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const empty = messages.length === 0;

  // Follow the conversation as it grows and streams (messages changes identity per token).
  useEffect(() => {
    if (empty) return;
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, empty]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={styles.content}>
      {empty ? (
        <>
          <AskHero />
          <View className="mt-8">
            <SuggestionChips chips={suggestionChips} onPick={onPickChip} />
          </View>
        </>
      ) : (
        <View className="gap-6">
          {messages.map((message, i) => (
            <MessageRow
              key={message.id}
              message={message}
              nextIsBeyond={messages[i + 1]?.beyond ?? false}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  ctaLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bodySemibold,
  },
});
