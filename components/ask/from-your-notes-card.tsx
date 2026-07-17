import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  noteId: string;
  noteTitle: string;
};

/** Trust tag proving the answer came from a saved note; taps open it. */
export function FromYourNotesCard({ noteId, noteTitle }: Props) {
  const colors = useTheme();
  const router = useRouter();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`From your notes: ${noteTitle}. Opens the note.`}
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/note/[id]', params: { id: noteId } })}
      className="max-w-[70%] flex-row items-center gap-3 rounded-inner p-3"
      style={{
        backgroundColor: withAlpha(colors.secondaryFixed, 0.3),
        borderWidth: 1,
        borderColor: withAlpha(colors.secondary, 0.2),
      }}>
      <View
        className="h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: withAlpha(colors.surfaceLowest, 0.5) }}>
        <AppIcon name="auto-awesome" size={20} color={colors.secondary} filled />
      </View>
      <View>
        <Text style={[styles.label, { color: colors.secondary }]}>FROM YOUR NOTES</Text>
        <Text className="mt-1" style={[styles.title, { color: colors.onSurface }]}>
          {noteTitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 10,
    lineHeight: 12,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: fonts.bodySemibold,
  },
});
