import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NoteHeader } from '@/components/note/note-header';
import { OptionRow } from '@/components/note/option-row';
import { noteOptions } from '@/data/note-options';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

/** Note Options — the actions menu card (Favorites toggles locally). */
export default function NoteOptionsScreen() {
  const colors = useTheme();
  const [favorite, setFavorite] = useState(true);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      {/* SafeAreaView doesn't support className (Style Exception Rule) → StyleSheet. */}
      <SafeAreaView edges={['top']} style={styles.flex}>
        <NoteHeader title="Note Options" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View
            className="overflow-hidden rounded-lg border"
            style={[
              styles.card,
              {
                backgroundColor: colors.surfaceLowest,
                borderColor: withAlpha(colors.outlineVariant, 0.25),
                shadowColor: colors.shadow,
              },
            ]}>
            {noteOptions.map((option, index) => (
              <OptionRow
                key={option.key}
                option={option}
                divider={index < noteOptions.length - 1}
                toggled={favorite}
                onToggle={setFavorite}
              />
            ))}
          </View>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  card: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
