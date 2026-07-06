import '@/global.css';

import {
  HankenGrotesk_400Regular,
  HankenGrotesk_400Regular_Italic,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import {
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '@/constants/theme';
import { useChatStore } from '@/store/use-chat-store';
import { useDeadlinesStore } from '@/store/use-deadlines-store';
import { useNotesStore } from '@/store/use-notes-store';
import { useOnboardingStore } from '@/store/use-onboarding-store';
import { useQuizStore } from '@/store/use-quiz-store';
import { useSettingsStore } from '@/store/use-settings-store';
import { useSubjectsStore } from '@/store/use-subjects-store';
import { useUserStore } from '@/store/use-user-store';

// Keep the native splash (app icon) up until the JS splash screen has mounted.
SplashScreen.preventAutoHideAsync();

/** The hackathon build is light-only — the theme toggle arrives in Phase 9. */
export default function RootLayout() {
  // Design fonts; native splash stays up until ready so text never flashes in the system font.
  const [fontsLoaded] = useFonts({
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    HankenGrotesk_400Regular,
    HankenGrotesk_400Regular_Italic,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  // Init all stores from SQLite/AsyncStorage once, as early as possible.
  const initNotes = useNotesStore((s) => s.init);
  const initSubjects = useSubjectsStore((s) => s.init);
  const initOnboarding = useOnboardingStore((s) => s.init);
  const initUser = useUserStore((s) => s.init);
  const initChat = useChatStore((s) => s.init);
  const initQuiz = useQuizStore((s) => s.init);
  const initDeadlines = useDeadlinesStore((s) => s.init);
  const initSettings = useSettingsStore((s) => s.init);
  const recordDailyActivity = useUserStore((s) => s.recordDailyActivity);
  useEffect(() => {
    initNotes();
    initSubjects();
    initOnboarding();
    initChat();
    initQuiz();
    initDeadlines();
    initSettings();
    // Count the streak only after the profile loads, or a first tick overwrites lastActiveDate.
    initUser().then(recordDailyActivity);
  }, [initNotes, initSubjects, initOnboarding, initChat, initQuiz, initDeadlines, initSettings, initUser, recordDailyActivity]);

  if (!fontsLoaded) return null;

  return (
    // Root host for react-native-gesture-handler (the Ask screen's swipe-back).
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.light.background },
            animation: 'fade',
          }}
        />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
