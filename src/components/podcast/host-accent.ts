import type { ColorTokens } from '@/constants/theme';
import type { PodcastSpeaker } from '@/types/podcast';

/** Each host gets a distinct, on-brand accent so the two voices read apart at a
 *  glance — Maya (A) indigo, Leo (B) violet. Used by the avatar + active turn. */
export function hostAccent(colors: ColorTokens, speaker: PodcastSpeaker): string {
  return speaker === 'A' ? colors.secondary : colors.methodRecord;
}
