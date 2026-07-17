import { useLocalSearchParams } from 'expo-router';

import { NoteMissing } from '@/components/note/note-missing';
import { NoteReaderView } from '@/components/note/note-reader-view';
import { useNoteDetail } from '@/data/note-detail';

/** Note Reader — read + annotate the note: pen highlights, comment tool pins margin notes. */
export default function NoteReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const note = useNoteDetail(id ?? '');

  if (!note) return <NoteMissing title="Note Reader" />;

  return <NoteReaderView note={note} />;
}
