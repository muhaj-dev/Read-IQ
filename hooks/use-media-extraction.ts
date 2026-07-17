// Shared "media → editable text" flow for Scan (OCR) and Record (transcription).
// Runs a one-shot BTL extraction, then a best-effort summary, exposing a
// reading → summarizing → ready | error state machine. On failure the student can
// retry or skip to type the text in themselves — the AI read never blocks a save.

import { useCallback, useEffect, useRef, useState } from 'react';

import { BtlError } from '@/lib/btl';
import { summarizeNoteText } from '@/lib/summarize';

export type ExtractionState = 'reading' | 'summarizing' | 'ready' | 'error';

export type MediaExtraction = {
  status: ExtractionState;
  text: string;
  setText: (text: string) => void;
  aiSummary: string | null;
  error?: string;
  retry: () => void;
  /** Give up on the AI read and let the student type the text in. */
  skip: () => void;
};

/** `run` must be a stable module-level extractor: `(uri) => Promise<text>`. */
export function useMediaExtraction(
  uri: string | undefined,
  run: (uri: string) => Promise<string>,
  fallbackError: string,
): MediaExtraction {
  const [status, setStatus] = useState<ExtractionState>('reading');
  const [text, setText] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const started = useRef(false);

  const extract = useCallback(async () => {
    if (!uri) {
      setStatus('ready'); // nothing to read — go straight to the manual editor
      return;
    }
    setStatus('reading');
    setError(undefined);
    let result = '';
    try {
      result = (await run(uri)).trim();
    } catch (err) {
      setError(err instanceof BtlError ? err.friendly : fallbackError);
      setStatus('error');
      return;
    }
    setText(result);
    // Summarize once here so the save stays instant; a hiccup just leaves it off.
    if (result) {
      setStatus('summarizing');
      try {
        setAiSummary((await summarizeNoteText(result)) || null);
      } catch {
        setAiSummary(null);
      }
    }
    setStatus('ready');
  }, [uri, run, fallbackError]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    extract();
  }, [extract]);

  return { status, text, setText, aiSummary, error, retry: extract, skip: () => setStatus('ready') };
}
