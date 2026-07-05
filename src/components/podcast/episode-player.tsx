import { useState } from 'react';
import { View } from 'react-native';

import { useEpisodePlayer } from '@/hooks/use-episode-player';
import { HOSTS, type PodcastEpisode } from '@/types/podcast';

import { EpisodeIntro } from './episode-intro';
import { PodcastPlayerBar } from './podcast-player-bar';
import { PodcastTranscript } from './podcast-transcript';
import { VoicePickerSheet } from './voice-picker-sheet';

type Props = {
  episode: PodcastEpisode;
  noteTitle: string;
};

/** The ready state: the scrolling two-host transcript plus the pinned player
 *  controls, wired to the read-along engine (which advances the highlight). */
export function EpisodePlayer({ episode, noteTitle }: Props) {
  const player = useEpisodePlayer(episode.turns);
  const activeSpeaker = episode.turns[player.activeIndex]?.speaker;
  const speakerName = activeSpeaker ? HOSTS[activeSpeaker] : '';
  const [voicesOpen, setVoicesOpen] = useState(false);

  const openVoices = () => {
    // Pause the episode so its narration doesn't clash with voice previews.
    if (player.playing) player.toggle();
    setVoicesOpen(true);
  };

  return (
    <View className="flex-1">
      <PodcastTranscript
        turns={episode.turns}
        activeIndex={player.activeIndex}
        onSeek={player.seek}
        header={
          <EpisodeIntro
            title={episode.title}
            noteTitle={noteTitle}
            coverage={episode.coverage}
            onEditVoices={openVoices}
          />
        }
      />
      <PodcastPlayerBar
        playing={player.playing}
        atEnd={player.atEnd}
        progress={player.progress}
        activeIndex={player.activeIndex}
        count={player.count}
        speakerName={speakerName}
        onToggle={player.toggle}
        onRestart={player.restart}
      />
      <VoicePickerSheet visible={voicesOpen} onClose={() => setVoicesOpen(false)} />
    </View>
  );
}
