// Plays back a recorded clip (the Record Result screen) via expo-audio.
// Routes audio out loud — the recorder left the session in record mode — and
// restarts from the top once a clip has finished.

import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect } from 'react';

export type AudioPlayback = {
  /** True once there's a source to play. */
  available: boolean;
  playing: boolean;
  /** Elapsed seconds. */
  position: number;
  /** Clip length in seconds (0 until known). */
  duration: number;
  /** 0–1 played fraction, for the progress fill. */
  progress: number;
  toggle: () => void;
};

export function useAudioPlayback(uri?: string): AudioPlayback {
  const player = useAudioPlayer(uri ? { uri } : null);
  const status = useAudioPlayerStatus(player);

  // Recording left the audio session in "record" mode → force playback out loud.
  useEffect(() => {
    setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
  }, []);

  const duration = status.duration || 0;
  const position = status.currentTime || 0;

  const toggle = () => {
    if (!uri) return;
    if (status.playing) {
      player.pause();
      return;
    }
    // Finished clips replay from the start rather than sitting at the end.
    if (status.didJustFinish || (duration > 0 && position >= duration - 0.1)) {
      player.seekTo(0);
    }
    player.play();
  };

  return {
    available: !!uri,
    playing: status.playing,
    position,
    duration,
    progress: duration > 0 ? Math.min(1, position / duration) : 0,
    toggle,
  };
}
