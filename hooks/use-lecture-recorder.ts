import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useEffect, useState } from 'react';

export type RecorderStatus = 'starting' | 'denied' | 'recording' | 'paused' | 'stopped';

/** Drives the Record Lecture screen: mic permission, immediate record, elapsed-seconds timer. */
export function useLectureRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [status, setStatus] = useState<RecorderStatus>('starting');
  const [seconds, setSeconds] = useState(0);

  // The student already chose "Record Lecture", so recording starts on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (cancelled) return;
        if (!permission.granted) {
          setStatus('denied');
          return;
        }
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        if (cancelled) return;
        recorder.record();
        setStatus('recording');
      } catch {
        if (!cancelled) setStatus('denied');
      }
    })();
    return () => {
      cancelled = true;
    };
    // The recorder instance is stable across renders (expo-audio owns it).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== 'recording') return;
    const id = setInterval(() => setSeconds((now) => now + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  /** Pause ↔ resume. */
  const toggle = () => {
    if (status === 'recording') {
      recorder.pause();
      setStatus('paused');
    } else if (status === 'paused') {
      recorder.record();
      setStatus('recording');
    }
  };

  /** Stop the recorder and return the recorded file uri (null if nothing was captured). */
  const stop = async (): Promise<string | null> => {
    if (status !== 'recording' && status !== 'paused') return recorder.uri ?? null;
    setStatus('stopped');
    try {
      await recorder.stop();
    } catch {
      // Already stopped or never started — nothing to clean up.
    }
    return recorder.uri ?? null;
  };

  return { status, seconds, toggle, stop };
}
