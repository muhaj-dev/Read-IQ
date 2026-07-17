import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddHeader } from '@/components/add/add-header';
import { AmbientBackground } from '@/components/add/ambient-background';
import { ExtractStatus } from '@/components/add/extract-status';
import { ExtractedTextCard } from '@/components/add/extracted-text-card';
import { RecordPreview } from '@/components/add/record-preview';
import { SaveBar, type SaveState } from '@/components/add/save-bar';
import { TagEditor } from '@/components/add/tag-editor';
import { useMediaExtraction } from '@/hooks/use-media-extraction';
import { useTheme } from '@/hooks/use-theme';
import { plainTextToHtml } from '@/lib/rich-text';
import { transcribeAudio } from '@/lib/transcription';
import { useNotesStore } from '@/store/use-notes-store';

const READ_FAIL = "We couldn't transcribe that recording. You can type or edit the transcript instead.";

/** Add — Record Result: transcribe the lecture (Whisper), summarize on BTL, confirm, tag, save. */
export default function RecordResultScreen() {
  const colors = useTheme();
  const router = useRouter();
  const addNote = useNotesStore((s) => s.addNote);
  const { uri, seconds } = useLocalSearchParams<{ uri?: string; seconds?: string }>();
  const duration = Number(seconds) || 0;

  const { status, text, setText, aiSummary, error, retry, skip } = useMediaExtraction(
    uri || undefined,
    transcribeAudio,
    READ_FAIL,
  );
  const [tags, setTags] = useState<string[]>([]);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const addTag = (tag: string) => setTags((now) => (now.includes(tag) ? now : [...now, tag]));

  const save = async () => {
    if (saveState !== 'idle') return;
    setSaveState('saving');
    await addNote({
      subject: tags[0] ?? null,
      content: text,
      contentHtml: plainTextToHtml(text),
      tags,
      aiSummary,
      source: 'voice',
    });
    setSaveState('saved');
    setTimeout(() => router.replace('/memory'), 700);
  };

  if (status === 'reading' || status === 'summarizing' || status === 'error') {
    return (
      <>
        <StatusBar style="dark" />
        <ExtractStatus
          state={status}
          fileName="Your lecture"
          readingTitle="Transcribing your lecture…"
          readingHint="Turning your recording into notes with your study assistant."
          errorTitle="Couldn't transcribe that recording"
          skipLabel="Type it instead"
          message={error}
          onRetry={retry}
          onSkip={skip}
        />
      </>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <AmbientBackground />
      {/* SafeAreaView / KeyboardAvoidingView don't take className (Style Exception Rule). */}
      <SafeAreaView edges={['top']} style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <AddHeader title="Record Result" />
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.content}>
            <View className="gap-6">
              <RecordPreview seconds={duration} uri={uri || undefined} transcribed={text.trim().length > 0} />
              <View>
                <ExtractedTextCard
                  value={text}
                  onChangeText={setText}
                  placeholder="No transcript yet — tap Edit to type your notes in."
                />
                <TagEditor tags={tags} onAdd={addTag} />
              </View>
            </View>
          </ScrollView>
          {/* "Retake" starts a fresh recording; Save writes to memory. */}
          <SaveBar state={saveState} onRetake={() => router.replace('/add/record')} onSave={save} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 160,
  },
});
