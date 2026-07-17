import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import type { AnnotationMode } from '@/data/note-annotations';
import type { PdfOpenComment } from '@/data/pdf-annotations';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import { buildPdfReaderDocument } from '@/lib/pdf-reader-doc';
import type { PdfAnnotations } from '@/types/note';

// pdf.js UMD build, pinned (exposes window.pdfjsLib + renderTextLayer). The PDF
// itself never leaves the device — only this viewer library loads from the CDN.
const PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/** Imperative comment actions the reader view drives from the modal. */
export type PdfReaderWebViewHandle = {
  commitComment: (id: string, body: string) => void;
  cancelComment: (id: string) => void;
  deleteComment: (id: string) => void;
};

type Props = {
  pdfBase64: string;
  /** Captured once into the doc; later changes flow through the WebView, not props. */
  initialAnnotations: PdfAnnotations;
  mode: AnnotationMode;
  highlightColor: string;
  onSave: (annotations: PdfAnnotations) => void;
  onRequestComment: (id: string, quote: string) => void;
  onOpenComment: (comment: PdfOpenComment) => void;
  onError?: (message: string) => void;
};

/** Renders the real PDF (pdf.js) with an annotation layer; bridges page events to RN. */
export const PdfReaderWebView = forwardRef<PdfReaderWebViewHandle, Props>(function PdfReaderWebView(
  { pdfBase64, initialAnnotations, mode, highlightColor, onSave, onRequestComment, onOpenComment, onError },
  ref,
) {
  const colors = useTheme();
  const webRef = useRef<WebView>(null);

  // Built once from the PDF bytes + initial annotations — annotating never reloads it.
  const html = useMemo(
    () =>
      buildPdfReaderDocument({
        pdfBase64,
        annotations: initialAnnotations,
        mode,
        highlightColor,
        pdfjsUrl: PDFJS_URL,
        pdfjsWorkerUrl: PDFJS_WORKER_URL,
        colors: {
          appBg: colors.surface,
          pageBg: colors.surfaceLowest,
          accent: colors.secondary,
          commentTint: withAlpha(colors.secondary, 0.16),
          text: colors.onSurfaceVariant,
          muted: colors.outline,
        },
      }),
    // Rebuild only when the PDF itself changes, not on tool/colour toggles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pdfBase64],
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
    commitComment: (id, body) =>
      webRef.current?.injectJavaScript(
        `window.__commitComment && window.__commitComment(${JSON.stringify(id)}, ${JSON.stringify(body)}); true;`,
      ),
    cancelComment: (id) =>
      webRef.current?.injectJavaScript(
        `window.__cancelComment && window.__cancelComment(${JSON.stringify(id)}); true;`,
      ),
    deleteComment: (id) =>
      webRef.current?.injectJavaScript(
        `window.__deleteComment && window.__deleteComment(${JSON.stringify(id)}); true;`,
      ),
  }));

  const onMessage = (event: WebViewMessageEvent) => {
    let msg: {
      type: string;
      annotations?: PdfAnnotations;
      id?: string;
      quote?: string;
      body?: string;
      createdAt?: string;
      message?: string;
    };
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'save' && msg.annotations) onSave(msg.annotations);
    else if (msg.type === 'requestComment' && msg.id != null) onRequestComment(msg.id, msg.quote ?? '');
    else if (msg.type === 'openComment' && msg.id != null)
      onOpenComment({ id: msg.id, quote: msg.quote ?? '', body: msg.body ?? '', createdAt: msg.createdAt ?? '' });
    else if (msg.type === 'error') onError?.(msg.message ?? 'error');
  };

  return (
    <WebView
      ref={webRef}
      originWhitelist={['*']}
      source={{ html }}
      onMessage={onMessage}
      style={[styles.web, { backgroundColor: colors.surface }]}
      showsVerticalScrollIndicator
      androidLayerType="hardware"
      overScrollMode="never"
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
