import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ModelOptionCard } from '@/components/settings/model-option-card';
import { SettingsHeader } from '@/components/settings/settings-header';
import { fonts } from '@/constants/typography';
import { AI_MODELS } from '@/data/ai-models';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore } from '@/store/use-settings-store';

/** AI MODEL — pick which BTL model writes answers. Grounding is unaffected. */
export default function ModelPickerScreen() {
  const colors = useTheme();
  const router = useRouter();
  const chatModel = useSettingsStore((s) => s.chatModel);
  const setChatModel = useSettingsStore((s) => s.setChatModel);

  const pick = (id: string) => {
    setChatModel(id);
    router.back();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <SettingsHeader title="AI Model" accent />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={[styles.blurb, { color: colors.onSurfaceVariant }]}>
            Choose which model on the BTL Runtime answers your questions. Every answer still comes
            only from your saved notes — this just changes who writes it.
          </Text>

          {AI_MODELS.map((model) => (
            <ModelOptionCard
              key={model.id}
              model={model}
              selected={model.id === chatModel}
              onPress={() => pick(model.id)}
            />
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
    paddingTop: 8,
    paddingBottom: 40,
    gap: 12,
  },
  blurb: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyRegular,
    marginBottom: 8,
  },
});
