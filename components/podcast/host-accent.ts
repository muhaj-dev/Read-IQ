import type { ColorTokens } from '@/constants/theme';
import type { PodcastSpeaker } from '@/types/podcast';

/** Distinct accent per host — Maya (A) indigo, Leo (B) violet. */
export function hostAccent(colors: ColorTokens, speaker: PodcastSpeaker): string {
  return speaker === 'A' ? colors.secondary : colors.methodRecord;
}
