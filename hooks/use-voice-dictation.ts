// Voice-to-text for the Ask composer: hold-free tap-to-record → stop → transcribe
// via Groq Whisper (lib/transcription). Expo-Go-safe (expo-audio + plain fetch,
// no dev build) — the same audio path as the Record add-note flow. The recognised
// text is handed back to the caller to drop into the input for review (never auto-sent).

import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

import { transcribeAudio } from '@/lib/transcription';

export type DictationStatus = 'idle' | 'recording' | 'transcribing';

type Options = {
  /** Called with the transcript once recording stops and Whisper returns. */
  onResult: (text: string) => void;
  /** Called with a friendly message when the mic is denied or transcription fails. */
  onError?: (message: string) => void;
};

const MIC_DENIED = 'Microphone access is off. Enable it in Settings to dictate.';
const NO_SPEECH = "I couldn't catch that — try again or type your question.";

/** Tap-to-dictate state machine: start() records, stop() transcribes and returns text. */
export function useVoiceDictation({ onResult, onError }: Options) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [status, setStatus] = useState<DictationStatus>('idle');
  const [seconds, setSeconds] = useState(0);
  // Latest callbacks without re-triggering the tick effect.
  const cbs = useRef({ onResult, onError });
  cbs.current = { onResult, onError };

  useEffect(() => {
    if (status !== 'recording') return;
    setSeconds(0);
    const id = setInterval(() => setSeconds((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  /** Begin capturing; asks mic permission on first use. */
  const start = async () => {
    if (status !== 'idle') return;
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        cbs.current.onError?.(MIC_DENIED);
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStatus('recording');
    } catch {
      cbs.current.onError?.(MIC_DENIED);
      setStatus('idle');
    }
  };

  /** Stop and transcribe; hands the text to onResult (or onError on failure). */
  const stop = async () => {
    if (status !== 'recording') return;
    setStatus('transcribing');
    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri ?? null;
    } catch {
      // Already stopped — fall through to whatever uri we have.
    }
    if (!uri) {
      cbs.current.onError?.(NO_SPEECH);
      setStatus('idle');
      return;
    }
    try {
      const text = (await transcribeAudio(uri)).trim();
      if (text) cbs.current.onResult(text);
      else cbs.current.onError?.(NO_SPEECH);
    } catch (err) {
      cbs.current.onError?.(err instanceof Error ? err.message : NO_SPEECH);
    } finally {
      setStatus('idle');
    }
  };

  /** Stop without transcribing (user tapped the ×). */
  const cancel = async () => {
    if (status !== 'recording') return;
    try {
      await recorder.stop();
    } catch {
      // Nothing to clean up.
    }
    setStatus('idle');
  };

  return { status, seconds, start, stop, cancel };
}
