import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NoteHeader } from '@/components/note/note-header';
import { NoteMissing } from '@/components/note/note-missing';
import { EpisodeGate } from '@/components/podcast/episode-gate';
import { EpisodePlayer } from '@/components/podcast/episode-player';
import { useTheme } from '@/hooks/use-theme';
import { useNotesStore } from '@/store/use-notes-store';
import { usePodcastStore } from '@/store/use-podcast-store';

/** "From Your Notes" — the note's two-host podcast episode. The script is written
 *  strictly from this note (no retrieval, no outside facts) and cached, so the
 *  runtime is only called when the student taps "Create episode" or regenerates. */
export default function ListenScreen() {
  const colors = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const noteId = id ?? '';

  const note = useNotesStore((s) => s.notes.find((n) => n.id === noteId));
  const episode = usePodcastStore((s) => s.episodes[noteId]);
  const status = usePodcastStore((s) => s.status[noteId]) ?? 'idle';
  const error = usePodcastStore((s) => s.error[noteId]) ?? '';
  const load = usePodcastStore((s) => s.load);
  const generate = usePodcastStore((s) => s.generate);

  // Read the cached episode from SQLite on open (cheap — no model call).
  useEffect(() => {
    if (noteId) load(noteId);
  }, [noteId, load]);

  if (!note) return <NoteMissing title="From Your Notes" />;

  const ready = status === 'ready' && !!episode && episode.turns.length > 0;
  const onGenerate = () => generate(note);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <NoteHeader
          title="From Your Notes"
          tinted
          action={ready ? { icon: 'replay', label: 'Regenerate episode', onPress: onGenerate } : undefined}
        />
        {ready ? (
          <EpisodePlayer episode={episode} noteTitle={note.title} />
        ) : (
          <EpisodeGate status={status} error={error} onGenerate={onGenerate} />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
