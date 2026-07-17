import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import type { AnnotationMode } from '@/data/note-annotations';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import { buildReaderDocument } from '@/lib/reader-doc';

/** Imperative handle: unwrap a mark, or restore a DOM snapshot (undo/redo). */
export type ReaderWebViewHandle = {
  removeMark: (cid: string) => void;
  /** Replace the reader's body HTML in place — used by undo/redo. */
  setHtml: (html: string) => void;
};

type Props = {
  title: string;
  /** Captured once — highlights/comments then mutate the DOM in place. */
  initialHtml: string;
  mode: AnnotationMode;
  highlightColor: string;
  onChangeHtml: (html: string) => void;
  onRequestComment: (cid: string, quote: string, html: string) => void;
  onOpenComment: (cid: string) => void;
};

/** Note rendered as an annotatable page; bridges in-page events to React Native. */
export const ReaderWebView = forwardRef<ReaderWebViewHandle, Props>(function ReaderWebView(
  { title, initialHtml, mode, highlightColor, onChangeHtml, onRequestComment, onOpenComment },
  ref,
) {
  const colors = useTheme();
  const webRef = useRef<WebView>(null);

  // Built once from the INITIAL html/tool so annotating never reloads the page.
  const html = useMemo(
    () =>
      buildReaderDocument({
        title,
        html: initialHtml,
        mode,
        highlightColor,
        colors: {
          surface: colors.surfaceLowest,
          ink: colors.onSurfaceVariant,
          heading: colors.onSurface,
          accent: colors.secondary,
          accentSoft: withAlpha(colors.secondaryFixed, 0.5),
          line: withAlpha(colors.outlineVariant, 0.5),
          well: colors.surfaceLow,
        },
      }),
    // Rebuild only when the note itself changes, not on tool/colour toggles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [title, initialHtml],
  );

  // Push the active tool + colour into the page without reloading it.
  useEffect(() => {
    webRef.current?.injectJavaScript(`window.__setMode && window.__setMode(${JSON.stringify(mode)}); true;`);
  }, [mode]);
  useEffect(() => {
    webRef.current?.injectJavaScript(
      `window.__setColor && window.__setColor(${JSON.stringify(highlightColor)}); true;`,
    );
  }, [highlightColor]);

  useImperativeHandle(ref, () => ({
    removeMark: (cid: string) => {
      webRef.current?.injectJavaScript(`window.__removeMark && window.__removeMark(${JSON.stringify(cid)}); true;`);
    },
    setHtml: (html: string) => {
      webRef.current?.injectJavaScript(`window.__setHtml && window.__setHtml(${JSON.stringify(html)}); true;`);
    },
  }));

  const onMessage = (event: WebViewMessageEvent) => {
    let msg: { type: string; html?: string; cid?: string; quote?: string };
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'change' && msg.html != null) onChangeHtml(msg.html);
    else if (msg.type === 'requestComment' && msg.cid != null)
      onRequestComment(msg.cid, msg.quote ?? '', msg.html ?? '');
    else if (msg.type === 'openComment' && msg.cid != null) onOpenComment(msg.cid);
  };

  return (
    <WebView
      ref={webRef}
      originWhitelist={['*']}
      source={{ html }}
      onMessage={onMessage}
      style={[styles.web, { backgroundColor: colors.surfaceLowest }]}
      showsVerticalScrollIndicator={false}
      // GPU-composited layer + no overscroll glow → smooth, non-janky scrolling.
      androidLayerType="hardware"
      overScrollMode="never"
      // Let file:// attachment images resolve inside the inline document.
      allowFileAccess
      allowFileAccessFromFileURLs
      allowUniversalAccessFromFileURLs
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
    />
  );
});

const styles = StyleSheet.create({
  web: {
    flex: 1,
  },
});
