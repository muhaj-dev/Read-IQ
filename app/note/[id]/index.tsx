import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AiSummary } from '@/components/note/ai-summary';
import { ContentPreview } from '@/components/note/content-preview';
import { KeyTopics } from '@/components/note/key-topics';
import { NoteAttachments } from '@/components/note/note-attachments';
import { NoteHeader } from '@/components/note/note-header';
import { NoteMissing } from '@/components/note/note-missing';
import { NoteStatsRow } from '@/components/note/note-stats-row';
import { OpenNoteButton } from '@/components/note/open-note-button';
import { SubjectBadges } from '@/components/note/subject-badges';
import { fonts } from '@/constants/typography';
import { useNoteDetail } from '@/data/note-detail';
import { useTheme } from '@/hooks/use-theme';

/** Note Details — reads the note live from the Memory store so edits show immediately. */
export default function NoteDetailScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const note = useNoteDetail(id ?? '');

  if (!note) return <NoteMissing title="Note Details" />;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      {/* SafeAreaView doesn't support className (Style Exception Rule) → StyleSheet. */}
      <SafeAreaView edges={['top']} style={styles.flex}>
        <NoteHeader
          title="Note Details"
          tinted
          action={{
            icon: 'edit',
            label: 'Edit note',
            onPress: () => router.push({ pathname: '/note/[id]/edit', params: { id: note.id } }),
          }}
        />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View className="gap-6">
            <View>
              <Text className="mb-2" style={[styles.title, { color: colors.onSurface }]}>
                {note.title}
              </Text>
              <SubjectBadges subject={note.subject} badges={note.badges} />
            </View>
            <AiSummary summary={note.aiSummary} more={note.aiSummaryMore} />
            <KeyTopics topics={note.keyTopics} />
            <NoteStatsRow stats={note.stats} />
            <ContentPreview
              heading={note.preview.heading}
              excerpt={note.preview.excerpt}
              image={note.preview.image}
            />
            <NoteAttachments attachments={note.attachments} />
          </View>
        </ScrollView>

        <View className="px-5 pb-6 pt-2">
          <OpenNoteButton
            label="Open Note"
            onPress={() =>
              router.push({ pathname: '/note/[id]/reader', params: { id: note.id } })
            }
          />
        </View>
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
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: fonts.headingBold,
  },
});
