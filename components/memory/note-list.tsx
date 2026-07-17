import { StyleSheet, Text, View } from 'react-native';

import { NoteCard } from '@/components/memory/note-card';
import { fonts } from '@/constants/typography';
import type { MemoryNote } from '@/data/memory-notes';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  notes: MemoryNote[];
  onPressNote: (note: MemoryNote) => void;
  /** Message shown when the list is empty (differs for no-notes vs no-matches). */
  emptyLabel?: string;
  /** Render each card with a selection checkbox (Memory Panel select mode). */
  selectMode?: boolean;
  /** Ids of the currently ticked notes. */
  selectedIds?: Set<string>;
};

/** The Memory Panel list — one card per saved note, or a friendly empty state. */
export function NoteList({ notes, onPressNote, emptyLabel, selectMode = false, selectedIds }: Props) {
  const colors = useTheme();

  if (notes.length === 0) {
    return (
      <View className="items-center px-5 py-16">
        <Text style={[styles.empty, { color: colors.onSurfaceVariant }]}>
          {emptyLabel ?? 'No notes found — try a different search or subject.'}
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onPress={() => onPressNote(note)}
          selectable={selectMode}
          selected={selectedIds?.has(note.id) ?? false}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyRegular,
    textAlign: 'center',
  },
});
