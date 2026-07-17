import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { ExtractStatus } from '@/components/add/extract-status';
import { NoteForm } from '@/components/note/note-form';
import { emptyNoteDraft } from '@/data/note-detail';
import { useTheme } from '@/hooks/use-theme';
import { BtlError } from '@/lib/btl';
import { extractDocumentsText, isExtractable } from '@/lib/document-extract';
import { pickFileAttachments } from '@/lib/files';
import { plainTextToHtml } from '@/lib/rich-text';
import { summarizeNoteText } from '@/lib/summarize';
import { useNotesStore } from '@/store/use-notes-store';
import type { NoteAttachment } from '@/types/note';

type Status = 'picking' | 'reading' | 'summarizing' | 'error' | 'ready';

/** Add — Upload. Picks a PDF (text extracted via BTL) or a .docx (unpacked locally),
 *  then summarizes the extracted text. Other file types attach without extraction. */
export default function UploadScreen() {
  const colors = useTheme();
  const router = useRouter();
  const addNote = useNotesStore((s) => s.addNote);
  const started = useRef(false);

  const [status, setStatus] = useState<Status>('picking');
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [content, setContent] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  const back = () => (router.canGoBack() ? router.back() : router.navigate('/add'));

  const extract = async (files: NoteAttachment[]) => {
    setStatus('reading');
    setError(undefined);
    let text = '';
    try {
      text = await extractDocumentsText(files);
      console.log('[upload] extracted text length:', text.length);
    } catch (err) {
      console.warn('[upload] extraction threw:', err instanceof BtlError ? `${err.kind}: ${err.message}` : err);
      setError(err instanceof BtlError ? err.friendly : 'We could not read the text from that file.');
      setStatus('error');
      return;
    }
    // Extraction succeeded but found no text — don't silently save a blank note; let the student retry.
    if (files.some(isExtractable) && !text.trim()) {
      setError("We couldn't find readable text in that document. Add it as an attachment and type your notes, or try again.");
      setStatus('error');
      return;
    }
    setContent(text);
    // Summary is best-effort; a hiccup just leaves it off. Generated once here so save stays instant.
    if (text.trim()) {
      setStatus('summarizing');
      try {
        setAiSummary((await summarizeNoteText(text)) || null);
      } catch {
        setAiSummary(null);
      }
    }
    setStatus('ready');
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const files = await pickFileAttachments({ extractableOnly: true });
      if (!files.length) return back();
      setAttachments(files);
      // Picker is limited to PDF/.docx, but some Android pickers ignore the MIME filter —
      // keep the guard so a stray other type just attaches instead of failing extraction.
      const hasExtractable = files.some(isExtractable);
      console.log('[upload] extractable detected?', hasExtractable, '→', hasExtractable ? 'extracting' : 'skipping extraction');
      if (hasExtractable) extract(files);
      else setStatus('ready');
    })();
    // Runs once — the ref guards against a double pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'picking') {
    // The native file picker sits over this surface until the student chooses.
    return <View className="flex-1" style={{ backgroundColor: colors.surface }} />;
  }

  if (status === 'reading' || status === 'summarizing' || status === 'error') {
    return (
      <>
        <StatusBar style="dark" />
        <ExtractStatus
          state={status}
          fileName={attachments[0]?.name ?? 'Document'}
          message={error}
          onRetry={() => extract(attachments)}
          onSkip={() => setStatus('ready')}
        />
      </>
    );
  }

  return (
    <NoteForm
      headerTitle="Add Document"
      attachmentsFirst
      hideContent
      initial={{
        ...emptyNoteDraft,
        title: attachments[0]?.name ?? '',
        content,
        contentHtml: plainTextToHtml(content),
        attachments,
      }}
      onBack={back}
      onSave={async (values) => {
        await addNote({
          title: values.title,
          subject: values.subject,
          content: values.content,
          contentHtml: values.contentHtml,
          tags: values.tags,
          attachments: values.attachments,
          aiSummary,
          source: 'file',
        });
        router.replace('/memory');
      }}
    />
  );
}
