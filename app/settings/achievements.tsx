import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AchievementRow } from '@/components/achievements/achievement-row';
import { AchievementSummary } from '@/components/achievements/achievement-summary';
import { SettingsHeader } from '@/components/settings/settings-header';
import { encourageAchievements } from '@/lib/achievements';
import { useAchievements } from '@/hooks/use-achievements';
import { useTheme } from '@/hooks/use-theme';

/** ACHIEVEMENTS — all 12 badges with their earned / locked state. */
export default function AchievementsScreen() {
  const colors = useTheme();
  const { list, unlockedCount, total } = useAchievements();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <SettingsHeader title="Achievements" accent />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <AchievementSummary
            unlockedCount={unlockedCount}
            total={total}
            encouragement={encourageAchievements(unlockedCount, total)}
          />
          <View className="gap-3">
            {list.map((achievement) => (
              <AchievementRow key={achievement.id} achievement={achievement} />
            ))}
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
    paddingTop: 8,
    paddingBottom: 40,
    gap: 20,
  },
});
