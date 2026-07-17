import { useRouter } from 'expo-router';

import { NoteForm } from '@/components/note/note-form';
import { emptyNoteDraft } from '@/data/note-detail';
import { isRichContentEmpty } from '@/lib/rich-text';
import { useNotesStore } from '@/store/use-notes-store';

/** Add — Paste. Opens the note editor with an empty draft; saving persists to Memory. */
export default function PasteScreen() {
  const router = useRouter();
  const addNote = useNotesStore((s) => s.addNote);
  const close = () => (router.canGoBack() ? router.back() : router.navigate('/add'));

  return (
    <NoteForm
      headerTitle="Add Note"
      initial={emptyNoteDraft}
      onBack={close}
      onSave={async (values) => {
        // Save when there's real text, an inline image, or any attachment.
        if (!isRichContentEmpty(values.contentHtml) || values.attachments.length) {
          await addNote({
            title: values.title,
            subject: values.subject,
            content: values.content,
            contentHtml: values.contentHtml,
            tags: values.tags,
            attachments: values.attachments,
            source: 'paste',
          });
        }
        router.replace('/memory');
      }}
    />
  );
}
