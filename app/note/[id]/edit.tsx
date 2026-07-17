import { useLocalSearchParams, useRouter } from 'expo-router';

import { DeleteNoteButton } from '@/components/note/delete-note-button';
import { NoteForm } from '@/components/note/note-form';
import { NoteMissing } from '@/components/note/note-missing';
import { useNoteDetail } from '@/data/note-detail';
import { useNotesStore } from '@/store/use-notes-store';

/** Edit Note — the shared editor pre-filled from the saved note, with a Delete footer. */
export default function EditNoteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const noteId = id ?? '';
  const note = useNoteDetail(noteId);
  const updateNote = useNotesStore((s) => s.updateNote);
  const removeNote = useNotesStore((s) => s.removeNote);

  const close = () => (router.canGoBack() ? router.back() : router.navigate('/memory'));

  if (!note) return <NoteMissing title="Edit Note" />;

  return (
    <NoteForm
      headerTitle="Edit Note"
      initial={{
        title: note.title,
        subject: note.subject,
        tags: note.tags,
        content: note.content,
        contentHtml: note.contentHtml ?? '',
        attachments: note.attachments,
      }}
      onBack={close}
      onSave={async (values) => {
        await updateNote(noteId, {
          title: values.title,
          subject: values.subject,
          content: values.content,
          contentHtml: values.contentHtml,
          tags: values.tags,
          attachments: values.attachments,
        });
        close();
      }}
      footer={
        <DeleteNoteButton
          onPress={async () => {
            await removeNote(noteId);
            router.navigate('/memory');
          }}
        />
      }
    />
  );
}
