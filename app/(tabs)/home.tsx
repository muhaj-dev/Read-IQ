import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AchievementCard } from '@/components/home/achievement-card';
import { DeadlineList } from '@/components/home/deadline-list';
import { EmptyHint } from '@/components/home/empty-hint';
import { HomeHeader } from '@/components/home/home-header';
import { PracticeCard } from '@/components/home/practice-card';
import { SectionHeader } from '@/components/home/section-header';
import { StatCards } from '@/components/home/stat-cards';
import { WeakTopicChips } from '@/components/home/weak-topic-chips';
import { useDashboard } from '@/hooks/use-dashboard';
import { useTheme } from '@/hooks/use-theme';

/** HOME tab — the dashboard, wired to the real user + notes stores. */
export default function HomeScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { user, achievements, stats, deadlines, weakTopics } = useDashboard();
  // Keep the dashboard calm — preview the first few, send the rest to their own page.
  const WEAK_PREVIEW = 3;
  const weakPreview = weakTopics.slice(0, WEAK_PREVIEW);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      {/* SafeAreaView doesn't support className (Style Exception Rule) → StyleSheet. */}
      <SafeAreaView edges={['top']} style={styles.safe}>
        <HomeHeader
          name={user.name}
          streakDays={user.streakDays}
          onPressBrand={() => router.push('/profile')}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View className="gap-3">
            {/* Non-tappable on the dashboard — the Achievements page opens only from Settings. */}
            <AchievementCard {...achievements} />
            <StatCards stats={stats} />
          </View>

          <View className="gap-3">
            <SectionHeader title="Practice" />
            <PracticeCard onPress={() => router.push('/quiz')} />
          </View>

          <View className="gap-3">
            <SectionHeader
              title="Upcoming Deadlines"
              action={deadlines.length > 0 ? 'View all' : undefined}
              onAction={() => router.push('/deadlines')}
            />
            {deadlines.length > 0 ? (
              <DeadlineList deadlines={deadlines} />
            ) : (
              <EmptyHint
                icon="schedule"
                title="No deadlines yet"
                subtitle="Add your exam and assignment dates to see them counted down here."
                cta="Add a deadline"
                onPress={() => router.push('/deadlines/add')}
              />
            )}
          </View>

          <View className="gap-3">
            <SectionHeader
              title="Weak Topics"
              action={weakTopics.length > WEAK_PREVIEW ? 'View all' : undefined}
              onAction={() => router.push('/weak-topics')}
            />
            {weakTopics.length > 0 ? (
              <WeakTopicChips topics={weakPreview} />
            ) : (
              <EmptyHint
                icon="quiz"
                title="No weak topics yet"
                subtitle="Take a quiz and we'll surface the topics worth reviewing."
                cta="Start a quiz"
                onPress={() => router.push('/quiz')}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 40,
  },
});
