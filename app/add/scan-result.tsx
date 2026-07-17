import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddHeader } from '@/components/add/add-header';
import { AmbientBackground } from '@/components/add/ambient-background';
import { ExtractStatus } from '@/components/add/extract-status';
import { ExtractedTextCard } from '@/components/add/extracted-text-card';
import { SaveBar, type SaveState } from '@/components/add/save-bar';
import { ScanPreview } from '@/components/add/scan-preview';
import { TagEditor } from '@/components/add/tag-editor';
import { useMediaExtraction } from '@/hooks/use-media-extraction';
import { useTheme } from '@/hooks/use-theme';
import { extractImageText } from '@/lib/ocr';
import { plainTextToHtml } from '@/lib/rich-text';
import { useNotesStore } from '@/store/use-notes-store';

const READ_FAIL = "We couldn't read that photo. You can type your notes in instead.";

/** Add — Scan Result: OCR the photo via BTL vision, confirm the text, tag it, save. */
export default function ScanResultScreen() {
  const colors = useTheme();
  const router = useRouter();
  const addNote = useNotesStore((s) => s.addNote);
  const { uri } = useLocalSearchParams<{ uri?: string }>();

  const { status, text, setText, aiSummary, error, retry, skip } = useMediaExtraction(
    uri,
    extractImageText,
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
      source: 'scan',
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
          fileName="Your photo"
          readingTitle="Reading your photo…"
          readingHint="Pulling the text out with your study assistant."
          errorTitle="Couldn't read that photo"
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
          <AddHeader title="Scan Result" />
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.content}>
            <View className="gap-6">
              <ScanPreview uri={uri} />
              <View>
                <ExtractedTextCard value={text} onChangeText={setText} />
                <TagEditor tags={tags} onAdd={addTag} />
              </View>
            </View>
          </ScrollView>
          <SaveBar state={saveState} onRetake={() => router.back()} onSave={save} />
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
