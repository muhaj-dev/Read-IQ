import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CommentModal } from '@/components/note/comment-modal';
import { HighlightPalette } from '@/components/note/highlight-palette';
import { NoteHeader } from '@/components/note/note-header';
import { ReaderHistoryBar } from '@/components/note/reader-history-bar';
import { ReaderToolbar } from '@/components/note/reader-toolbar';
import { ReaderWebView, type ReaderWebViewHandle } from '@/components/note/reader-webview';
import { useNoteAnnotations } from '@/data/note-annotations';
import type { NoteDetail } from '@/data/note-detail';
import { useTheme } from '@/hooks/use-theme';

type Props = { note: NoteDetail };

/** Annotatable Note Reader: a WebView page with a highlight + comment toolbar. */
export function NoteReaderView({ note }: Props) {
  const colors = useTheme();
  const router = useRouter();
  const webRef = useRef<ReaderWebViewHandle>(null);
  const ann = useNoteAnnotations(note);

  // Cancelling a new comment unwraps its anchor; the unwrap re-persists clean HTML.
  const cancelDraft = () => {
    const cid = ann.discardDraft();
    if (cid) webRef.current?.removeMark(cid);
  };

  const deleteOpened = () => {
    const id = ann.openedComment?.id;
    if (!id) return;
    ann.removeComment(id);
    webRef.current?.removeMark(id);
  };

  // Undo/redo return the HTML snapshot to restore; push it into the WebView DOM.
  const undo = () => {
    const html = ann.undo();
    if (html != null) webRef.current?.setHtml(html);
  };
  const redo = () => {
    const html = ann.redo();
    if (html != null) webRef.current?.setHtml(html);
  };

  const modalVisible = ann.draft != null || ann.openedComment != null;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surfaceLowest }}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <NoteHeader
          title="Note Reader"
          tinted
          action={{
            icon: 'ios-share',
            label: 'Options',
            onPress: () => router.push({ pathname: '/note/[id]/options', params: { id: note.id } }),
          }}
        />

        <View className="flex-1">
          <ReaderWebView
            ref={webRef}
            title={note.title}
            initialHtml={ann.initialHtml}
            mode={ann.mode}
            highlightColor={ann.highlightColor}
            onChangeHtml={ann.onChangeHtml}
            onRequestComment={ann.onRequestComment}
            onOpenComment={ann.onOpenComment}
          />

          {/* Floating history controls — step highlights/comments back & forward. */}
          <View className="absolute right-3 top-2" style={styles.history}>
            <ReaderHistoryBar
              canUndo={ann.canUndo}
              canRedo={ann.canRedo}
              onUndo={undo}
              onRedo={redo}
            />
          </View>
        </View>

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
      </SafeAreaView>

      <CommentModal
        visible={modalVisible}
        editing={ann.openedComment != null}
        quote={ann.draft?.quote ?? ann.openedComment?.quote ?? ''}
        initialBody={ann.openedComment?.body ?? ''}
        timestamp={ann.openedComment?.createdAt ?? null}
        onSave={(body) =>
          ann.draft ? ann.saveDraft(body) : ann.openedComment && ann.saveEdit(ann.openedComment.id, body)
        }
        onDelete={deleteOpened}
        onCancel={ann.draft ? cancelDraft : ann.closeOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  // Keep the history pill above the WebView (pill carries its own Android elevation).
  history: {
    zIndex: 10,
  },
});
