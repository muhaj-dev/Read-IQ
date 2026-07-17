import { useLocalSearchParams } from 'expo-router';

import { NoteMissing } from '@/components/note/note-missing';
import { PdfReaderView } from '@/components/note/pdf-reader-view';
import { useNoteDetail } from '@/data/note-detail';
import { firstPdf } from '@/lib/pdf-file';

/** PDF Reader — view the note's original PDF exactly, then highlight / comment / broadcast. */
export default function PdfReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const note = useNoteDetail(id ?? '');
  const pdf = note ? firstPdf(note.attachments) : null;

  if (!note || !pdf) return <NoteMissing title="PDF Reader" />;

  return <PdfReaderView note={note} attachment={pdf} />;
}
