// Episode player: spoken playback of a "From Your Notes" episode via on-device TTS (expo-speech).
// On-device, not BTL: the BTL runtime has no working text-to-speech (gpt-audio 400s). Voice per host + speed come from the voice store.

import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';

import { HOST_PITCH } from '@/lib/podcast-voices';
import { usePodcastVoiceStore } from '@/store/use-podcast-voice-store';
import type { PodcastTurn } from '@/types/podcast';

export type EpisodePlayer = {
  /** The turn currently spoken / highlighted. */
  activeIndex: number;
  playing: boolean;
  /** Playback has reached and stopped on the last turn. */
  atEnd: boolean;
  /** 0–1 across the episode, for the progress bar. */
  progress: number;
  count: number;
  /** Play / pause; from the end, play restarts from the top. */
  toggle: () => void;
  /** Jump back to the first turn and play. */
  restart: () => void;
  /** Move to a specific turn (tapping it in the transcript). */
  seek: (index: number) => void;
};

export function useEpisodePlayer(turns: PodcastTurn[]): EpisodePlayer {
  const count = turns.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const turnsRef = useRef(turns);
  turnsRef.current = turns;
  const idxRef = useRef(0);
  const playingRef = useRef(false);
  // Bumped on every stop/seek so a stale utterance's onDone can't advance playback.
  const genRef = useRef(0);

  // Chosen voice per host + speed, kept in a ref so chained speak() reads the latest without re-creating callbacks.
  const initVoices = usePodcastVoiceStore((s) => s.init);
  const prefs = usePodcastVoiceStore((s) => s.prefs);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  // Load device voices + saved prefs once (idempotent — guarded in the store).
  useEffect(() => {
    initVoices();
  }, [initVoices]);

  const stopSpeech = useCallback(() => {
    genRef.current += 1; // invalidate any in-flight onDone/onError
    Speech.stop();
  }, []);

  // Speak turn `start`, then chain to the next on completion while still playing.
  const speakFrom = useCallback((start: number) => {
    const myGen = genRef.current;
    const speak = (i: number) => {
      const list = turnsRef.current;
      if (i >= list.length) {
        idxRef.current = list.length; // past the end → next play restarts
        playingRef.current = false;
        setPlaying(false);
        return;
      }
      idxRef.current = i;
      setActiveIndex(i);
      const turn = list[i];
      const advance = () => {
        // Ignore callbacks from an utterance we've since stopped/replaced.
        if (genRef.current !== myGen || !playingRef.current) return;
        speak(i + 1);
      };
      Speech.speak(turn.text, {
        pitch: HOST_PITCH[turn.speaker],
        rate: prefsRef.current.rate,
        voice: prefsRef.current[turn.speaker] ?? undefined,
        onDone: advance,
        onError: advance, // never get stuck on a single turn
      });
    };
    speak(start);
  }, []);

  const play = useCallback(() => {
    if (count === 0) return;
    stopSpeech();
    if (idxRef.current >= count) idxRef.current = 0; // from the end → start over
    playingRef.current = true;
    setPlaying(true);
    speakFrom(idxRef.current);
  }, [count, stopSpeech, speakFrom]);

  const pause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    stopSpeech();
  }, [stopSpeech]);

  const toggle = useCallback(() => {
    if (playingRef.current) pause();
    else play();
  }, [pause, play]);

  const restart = useCallback(() => {
    stopSpeech();
    idxRef.current = 0;
    setActiveIndex(0);
    playingRef.current = true;
    setPlaying(true);
    speakFrom(0);
  }, [stopSpeech, speakFrom]);

  const seek = useCallback(
    (index: number) => {
      if (count === 0) return;
      const clamped = Math.max(0, Math.min(index, count - 1));
      idxRef.current = clamped;
      setActiveIndex(clamped);
      if (playingRef.current) {
        stopSpeech();
        speakFrom(clamped);
      }
    },
    [count, stopSpeech, speakFrom],
  );

  // Stop audio when the screen unmounts so a voice never trails a gone screen.
  useEffect(
    () => () => {
      playingRef.current = false;
      Speech.stop();
    },
    [],
  );

  const atEnd = !playing && count > 0 && activeIndex >= count - 1;
  const progress = count === 0 ? 0 : (activeIndex + 1) / count;

  return { activeIndex, playing, atEnd, progress, count, toggle, restart, seek };
}
