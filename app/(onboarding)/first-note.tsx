import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FirstNoteFields } from '@/components/onboarding/first-note-fields';
import { OnboardButton } from '@/components/onboarding/onboard-button';
import { ProgressHeader } from '@/components/onboarding/progress-header';
import { SavedNoteCard } from '@/components/onboarding/saved-note-card';
import { DismissKeyboardView } from '@/components/ui/dismiss-keyboard-view';
import { Onboard } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import { useNotesStore } from '@/store/use-notes-store';
import { useOnboardingStore } from '@/store/use-onboarding-store';

const HOME: Href = '/home';

/** Onboarding 3/3 — the first note, saved to memory, then hands off to its details page. */
export default function FirstNoteScreen() {
  const router = useRouter();
  const addNote = useNotesStore((s) => s.addNote);
  const completeOnboarding = useOnboardingStore((s) => s.complete);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const hasNote = note.trim().length > 0;

  const finish = async () => {
    // Reaching the end of onboarding means we never show it again.
    completeOnboarding();
    if (!hasNote) {
      router.replace(HOME);
      return;
    }
    const saved = await addNote({
      title: title.trim() || undefined,
      content: note.trim(),
      source: 'paste',
    });
    // Show the saved note's details; its back chevron falls through to the Memory tab.
    router.replace({ pathname: '/note/[id]', params: { id: saved.id } });
  };

  return (
    <View className="flex-1" style={{ backgroundColor: Onboard.surface }}>
      <StatusBar style="dark" />
      {/* SafeAreaView / KeyboardAvoidingView are Style Exception Rule components. */}
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <DismissKeyboardView style={styles.flex}>
          <View className="pt-3">
            <ProgressHeader step={3} onBack={() => router.back()} />
          </View>

          <Animated.View entering={FadeInDown.duration(500).delay(100)} className="px-5 pb-5">
            <Text className="mb-2" style={styles.title}>
              Add your first note
            </Text>
            <Text style={styles.subtitle}>
              Give it a name and paste what you&apos;re studying. You can upload files, scan
              photos, and record classes from the app once you&apos;re in.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(200)} className="flex-1 px-5 pt-2">
            <FirstNoteFields
              title={title}
              onTitleChange={setTitle}
              note={note}
              onNoteChange={setNote}
            />
          </Animated.View>

          {hasNote && (
            <View className="pt-4">
              <SavedNoteCard text={note} title={title} />
            </View>
          )}

          <Animated.View entering={FadeInDown.duration(500).delay(400)} className="px-5 pb-1 pt-5">
            <OnboardButton label="Save to memory" tone="primary" disabled={!hasNote} onPress={finish} />
            <TouchableOpacity
              onPress={() => {
                completeOnboarding();
                router.replace(HOME);
              }}
              className="items-center justify-center py-4">
              <Text style={styles.skip}>Skip for now</Text>
            </TouchableOpacity>
          </Animated.View>
          </DismissKeyboardView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: fonts.headingBold,
    color: Onboard.onSurface,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 28,
    fontFamily: fonts.bodyRegular,
    color: Onboard.onSurfaceVariant,
  },
  skip: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
    color: Onboard.onSurfaceVariant,
  },
});
