import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrivacyActionCard } from '@/components/settings/privacy-action-card';
import { SettingsHeader } from '@/components/settings/settings-header';
import { privacyActionGroups } from '@/data/settings';
import { useTheme } from '@/hooks/use-theme';

/** DATA & PRIVACY — data management, legal, and delete-account cards. */
export default function DataPrivacyScreen() {
  const colors = useTheme();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <SettingsHeader title="Data & Privacy" accent />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {privacyActionGroups.map((group) => (
            // The danger group sits apart from the rest (mock's larger gap).
            <View key={group.key} className={group.key === 'danger' ? 'gap-4 pt-8' : 'gap-4'}>
              {group.actions.map((action) => (
                <PrivacyActionCard key={action.key} action={action} />
              ))}
            </View>
          ))}
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
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
});
