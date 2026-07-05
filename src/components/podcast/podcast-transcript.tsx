import { type ReactNode, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { HOSTS, type PodcastTurn } from '@/types/podcast';

import { HostTurn } from './host-turn';

type Props = {
  turns: PodcastTurn[];
  activeIndex: number;
  onSeek: (index: number) => void;
  /** The episode header, scrolled with the turns (kept in the same content). */
  header: ReactNode;
};

/** The scrollable conversation. Records each turn's offset and gently scrolls the
 *  active one into view as the read-along advances, so the student stays hands-free. */
export function PodcastTranscript({ turns, activeIndex, onSeek, header }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<number[]>([]);

  useEffect(() => {
    const y = offsets.current[activeIndex];
    if (y == null) return;
    // Keep the active turn a comfortable third down the screen, not jammed to the top.
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 140), animated: true });
  }, [activeIndex]);

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      {header}
      <View className="gap-4">
        {turns.map((turn, i) => (
          <View
            key={i}
            onLayout={(e) => {
              offsets.current[i] = e.nativeEvent.layout.y;
            }}>
            <HostTurn
              speaker={turn.speaker}
              name={HOSTS[turn.speaker]}
              text={turn.text}
              active={i === activeIndex}
              onPress={() => onSeek(i)}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
});
