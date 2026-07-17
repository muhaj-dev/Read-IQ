import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddHeader } from '@/components/add/add-header';
import { MethodCard } from '@/components/add/method-card';
import { TipCard } from '@/components/add/tip-card';
import { fonts } from '@/constants/typography';
import { addMethods, addNoteTip } from '@/data/add-methods';
import { useTheme } from '@/hooks/use-theme';

/** Add Note — choose one of the four methods (see the add-note mock). */
export default function AddNoteScreen() {
  const colors = useTheme();
  const router = useRouter();

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.navigate('/home');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      {/* SafeAreaView doesn't support className (Style Exception Rule) → StyleSheet. */}
      <SafeAreaView edges={['top']} style={styles.flex}>
        <AddHeader title="Add Note" onClose={close} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text className="mb-2 text-center" style={[styles.headline, { color: colors.onSurface }]}>
            How do you want to add your note?
          </Text>
          <Text
            className="mb-10 self-center text-center"
            style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Select your preferred method to start processing academic information with AI.
          </Text>

          <View className="mb-10 flex-row flex-wrap justify-between gap-y-4">
            {addMethods.map((method) => (
              <MethodCard
                key={method.key}
                method={method}
                onPress={() => router.push(method.href)}
              />
            ))}
          </View>

          <TipCard title={addNoteTip.title} body={addNoteTip.body} />
        </ScrollView>
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
    paddingTop: 40,
    paddingBottom: 32,
  },
  headline: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: fonts.headingBold,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.bodyRegular,
    maxWidth: 320,
  },
});
