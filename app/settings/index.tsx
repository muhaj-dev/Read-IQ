import { type Href, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsHeader } from '@/components/settings/settings-header';
import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsSection } from '@/components/settings/settings-section';
import { modelLabelFor } from '@/data/ai-models';
import { settingsSections } from '@/data/settings';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore } from '@/store/use-settings-store';

/** SETTINGS — grouped preference rows; AI Model + Data & Privacy navigate. */
export default function SettingsScreen() {
  const colors = useTheme();
  const router = useRouter();
  const [focusMode, setFocusMode] = useState(true);
  const chatModel = useSettingsStore((s) => s.chatModel);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <SettingsHeader title="Settings" />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {settingsSections.map((section) => (
            <SettingsSection key={section.key} label={section.label}>
              {section.rows.map((row, index) => (
                <SettingsRow
                  key={row.key}
                  // The AI Model row shows the live selection, not a static label.
                  item={row.key === 'model' ? { ...row, value: modelLabelFor(chatModel) } : row}
                  divider={index < section.rows.length - 1}
                  toggled={row.key === 'focus' ? focusMode : undefined}
                  onToggle={row.key === 'focus' ? setFocusMode : undefined}
                  onPress={
                    row.key === 'data-privacy'
                      ? () => router.push('/settings/data-privacy')
                      : row.key === 'model'
                        ? () => router.push('/settings/model' as Href)
                        : undefined
                  }
                />
              ))}
            </SettingsSection>
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
    gap: 40,
  },
});
