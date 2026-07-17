import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CommentModal } from '@/components/note/comment-modal';
import { HighlightPalette } from '@/components/note/highlight-palette';
import { NoteHeader } from '@/components/note/note-header';
import { PdfReaderWebView, type PdfReaderWebViewHandle } from '@/components/note/pdf-reader-webview';
import { ReaderToolbar } from '@/components/note/reader-toolbar';
import { fonts } from '@/constants/typography';
import type { NoteDetail } from '@/data/note-detail';
import { usePdfAnnotations } from '@/data/pdf-annotations';
import { useTheme } from '@/hooks/use-theme';
import { readPdfBase64 } from '@/lib/pdf-file';
import type { NoteAttachment } from '@/types/note';

type Props = { note: NoteDetail; attachment: NoteAttachment };
type Status = 'loading' | 'ready' | 'error';

/** PDF Reader: renders the real PDF and lets the student highlight, comment, and broadcast. */
export function PdfReaderView({ note, attachment }: Props) {
  const colors = useTheme();
  const router = useRouter();
  const webRef = useRef<PdfReaderWebViewHandle>(null);
  const ann = usePdfAnnotations(note);

  const [status, setStatus] = useState<Status>('loading');
  const [base64, setBase64] = useState('');

  const load = useCallback(() => {
    setStatus('loading');
    readPdfBase64(attachment)
      .then((data) => {
        setBase64(data);
        setStatus(data ? 'ready' : 'error');
      })
      .catch(() => setStatus('error'));
  }, [attachment]);

  useEffect(() => load(), [load]);

  const saveComment = (body: string) => {
    if (ann.draft) {
      webRef.current?.commitComment(ann.draft.id, body);
      ann.closeDraft();
    } else if (ann.opened) {
      webRef.current?.commitComment(ann.opened.id, body);
      ann.closeOpened();
    }
  };
  const cancelComment = () => {
    if (ann.draft) {
      webRef.current?.cancelComment(ann.draft.id);
      ann.closeDraft();
    } else {
      ann.closeOpened();
    }
  };
  const deleteComment = () => {
    if (ann.opened) webRef.current?.deleteComment(ann.opened.id);
    ann.closeOpened();
  };

  const modalVisible = ann.draft != null || ann.opened != null;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <NoteHeader
          title="PDF Reader"
          tinted
          action={{
            icon: 'ios-share',
            label: 'Options',
            onPress: () => router.push({ pathname: '/note/[id]/options', params: { id: note.id } }),
          }}
        />

        <View className="flex-1">
          {status === 'ready' ? (
            <PdfReaderWebView
              ref={webRef}
              pdfBase64={base64}
              initialAnnotations={ann.initialAnnotations}
              mode={ann.mode}
              highlightColor={ann.highlightColor}
              onSave={ann.onSave}
              onRequestComment={ann.onRequestComment}
              onOpenComment={ann.onOpenComment}
            />
          ) : (
            <View className="flex-1 items-center justify-center gap-4 px-8">
              {status === 'loading' ? (
                <>
                  <ActivityIndicator color={colors.secondary} />
                  <Text style={[styles.hint, { color: colors.onSurfaceVariant }]}>Opening PDF…</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.title, { color: colors.onSurface }]}>Couldn&apos;t open this PDF</Text>
                  <Text style={[styles.hint, { color: colors.onSurfaceVariant }]}>
                    The file may no longer be available. Re-upload it, or try again.
                  </Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={load}
                    className="rounded-pill px-6 py-2.5"
                    style={{ backgroundColor: colors.secondaryContainer }}>
                    <Text style={[styles.retry, { color: colors.onPrimary }]}>Try again</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>

        {status === 'ready' ? (
          <View className="absolute inset-x-5 bottom-6">
            {ann.mode === 'highlight' ? (
              <HighlightPalette selected={ann.highlightColor} onSelect={ann.setHighlightColor} />
            ) : null}
            <ReaderToolbar
              mode={ann.mode}
              onSetMode={ann.setMode}
              onListen={() => router.push({ pathname: '/note/[id]/listen', params: { id: note.id } })}
            />
          </View>
        ) : null}
      </SafeAreaView>

      <CommentModal
        visible={modalVisible}
        editing={ann.opened != null}
        quote={ann.draft?.quote ?? ann.opened?.quote ?? ''}
        initialBody={ann.opened?.body ?? ''}
        timestamp={ann.opened?.createdAt ?? null}
        onSave={saveComment}
        onDelete={deleteComment}
        onCancel={cancelComment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.headingSemibold,
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyRegular,
    textAlign: 'center',
  },
  retry: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
