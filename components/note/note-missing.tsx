import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NoteHeader } from '@/components/note/note-header';
import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title?: string;
};

/** Fallback shown when a note id can't be found (deleted or stale link). */
export function NoteMissing({ title = 'Note' }: Props) {
  const colors = useTheme();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      {/* SafeAreaView doesn't support className (Style Exception Rule) → StyleSheet. */}
      <SafeAreaView edges={['top']} style={styles.flex}>
        <NoteHeader title={title} tinted />
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <AppIcon name="article" size={40} color={colors.outlineVariant} />
          <Text style={[styles.text, { color: colors.onSurfaceVariant }]}>
            This note isn&apos;t here anymore.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: fonts.bodyRegular,
  },
});
