import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MemoryHeader } from '@/components/memory/memory-header';
import { MemorySearchBar } from '@/components/memory/memory-search-bar';
import { MemorySelectBar } from '@/components/memory/memory-select-bar';
import { NoteList } from '@/components/memory/note-list';
import { SubjectChips } from '@/components/memory/subject-chips';
import type { MemoryNote } from '@/data/memory-notes';
import { useTheme } from '@/hooks/use-theme';
import { toMemoryNote } from '@/lib/note-view';
import { useNotesStore } from '@/store/use-notes-store';

/** MEMORY tab — the Memory Panel: saved notes, searchable/filterable, with multi-select Share/Delete. */
export default function MemoryScreen() {
  const colors = useTheme();
  const router = useRouter();
  const storeNotes = useNotesStore((s) => s.notes);
  const removeNote = useNotesStore((s) => s.removeNote);
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('All');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const cards = useMemo(() => storeNotes.map(toMemoryNote), [storeNotes]);
  const subjects = useMemo(() => [...new Set(cards.map((n) => n.subject))], [cards]);

  const notes = cards.filter(
    (note) =>
      (subject === 'All' || note.subject === subject) &&
      note.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const emptyLabel =
    storeNotes.length === 0
      ? 'No notes yet — add your first one!'
      : 'No notes found — try a different search or subject.';

  const toggleSelectMode = () => {
    setSelectMode((on) => !on);
    setSelectedIds(new Set());
  };

  const pressNote = (note: MemoryNote) => {
    if (!selectMode) {
      router.push({ pathname: '/note/[id]', params: { id: note.id } });
      return;
    }
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(note.id)) next.delete(note.id);
      else next.add(note.id);
      return next;
    });
  };

  const shareSelected = async () => {
    const chosen = storeNotes.filter((n) => selectedIds.has(n.id));
    if (chosen.length === 0) return;
    const message = chosen
      .map((n) => `${n.title}\n\n${n.content}`.trim())
      .join('\n\n———\n\n');
    try {
      await Share.share({ message, title: chosen.length === 1 ? chosen[0].title : 'My notes' });
    } catch {
      // Share sheet dismissed or unavailable — nothing to recover.
    }
  };

  const deleteSelected = () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    Alert.alert(
      ids.length === 1 ? 'Delete note?' : `Delete ${ids.length} notes?`,
      'This removes them from your memory and can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Promise.all(ids.map((id) => removeNote(id)));
            setSelectedIds(new Set());
            setSelectMode(false);
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      {/* SafeAreaView doesn't support className (Style Exception Rule) → StyleSheet. */}
      <SafeAreaView edges={['top']} style={styles.safe}>
        <MemoryHeader selectMode={selectMode} onToggleSelect={toggleSelectMode} />

        <View className="mt-4 px-5">
          <MemorySearchBar value={query} onChangeText={setQuery} />
        </View>

        <View className="mt-6">
          <SubjectChips subjects={subjects} active={subject} onSelect={setSubject} />
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}>
          <NoteList
            notes={notes}
            emptyLabel={emptyLabel}
            onPressNote={pressNote}
            selectMode={selectMode}
            selectedIds={selectedIds}
          />
        </ScrollView>

        {selectMode ? (
          <MemorySelectBar
            count={selectedIds.size}
            onShare={shareSelected}
            onDelete={deleteSelected}
          />
        ) : null}
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
    paddingVertical: 24,
  },
});
