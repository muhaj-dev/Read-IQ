import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NoteIqMark } from '@/components/brand/brand-logo';
import { OnboardButton } from '@/components/onboarding/onboard-button';
import { ProgressHeader } from '@/components/onboarding/progress-header';
import { ValuePropRow } from '@/components/onboarding/value-prop-row';
import { Onboard } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import type { OnboardIconName } from '@/components/onboarding/onboard-icon';

const VALUE_PROPS: { icon: OnboardIconName; title: string; description: string }[] = [
  {
    icon: 'save',
    title: 'Remembers your notes',
    description: 'Everything you add is saved and organized.',
  },
  {
    icon: 'lightbulb',
    title: 'Answers from your notes',
    description: "I only answer from what you've saved.",
  },
  {
    icon: 'psychology',
    title: 'Quizzes you',
    description: 'Practice, improve and ace your exams.',
  },
];

/** Onboarding 1/3 — the value promise. The splash auto-advances here. */
export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1" style={{ backgroundColor: Onboard.surface }}>
      <StatusBar style="dark" />
      {/* SafeAreaView doesn't support className (Style Exception Rule) → StyleSheet. */}
      <SafeAreaView style={styles.safe}>
        <View className="pt-3">
          <ProgressHeader step={1} />
        </View>

        <View className="flex-1 px-5">
          <Text className="mb-2" style={styles.title}>
            Welcome 👋
          </Text>
          <Text style={styles.subtitle}>Let&apos;s study smarter together.</Text>

          <View className="flex-1 items-center justify-center py-6">
            <NoteIqMark width={118} />
          </View>

          <View className="gap-6 pb-8">
            {VALUE_PROPS.map((prop) => (
              <ValuePropRow key={prop.title} {...prop} />
            ))}
          </View>
        </View>

        <View className="px-5 pb-3 pt-5" style={styles.footer}>
          <OnboardButton label="Get Started" onPress={() => router.push('/about')} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: fonts.headingBold,
    color: Onboard.onSurface,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.bodyRegular,
    color: Onboard.onSurfaceVariant,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Onboard.borderFaint,
  },
});
