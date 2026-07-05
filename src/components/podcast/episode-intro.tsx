import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import { HOSTS, type PodcastCoverage } from '@/types/podcast';

import { hostAccent } from './host-accent';

type Props = {
  title: string;
  noteTitle: string;
  coverage: PodcastCoverage;
  /** Opens the voice picker (pick a device voice per host + speaking speed). */
  onEditVoices?: () => void;
};

/** A host chip — avatar initial + name + role — for the episode header. */
function HostChip({ speaker, role }: { speaker: 'A' | 'B'; role: string }) {
  const colors = useTheme();
  const accent = hostAccent(colors, speaker);
  const name = HOSTS[speaker];
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-7 w-7 items-center justify-center rounded-pill" style={{ backgroundColor: accent }}>
        <Text style={[styles.chipInitial, { color: colors.onPrimary }]}>{name.charAt(0)}</Text>
      </View>
      <Text style={[styles.chipText, { color: colors.onSurfaceVariant }]}>
        {name} · {role}
      </Text>
    </View>
  );
}

/** The episode header: the "From your notes" eyebrow, the title, which note it
 *  was made from, the two hosts, and an honest banner when the note is thin. */
export function EpisodeIntro({ title, noteTitle, coverage, onEditVoices }: Props) {
  const colors = useTheme();

  return (
    <View className="gap-4 pb-2">
      <View className="gap-1.5">
        <Text style={[styles.eyebrow, { color: colors.secondary }]}>FROM YOUR NOTES · BROADCAST</Text>
        <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
        <Text style={[styles.note, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
          Made from your note: {noteTitle}
        </Text>
      </View>

      <View className="flex-row flex-wrap items-center gap-x-5 gap-y-2">
        <HostChip speaker="A" role="asks" />
        <HostChip speaker="B" role="explains" />
      </View>

      {onEditVoices ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Change host voices"
          activeOpacity={0.7}
          onPress={onEditVoices}
          className="flex-row items-center gap-1.5 self-start rounded-pill px-3 py-1.5"
          style={{ backgroundColor: withAlpha(colors.secondary, 0.1) }}>
          <AppIcon name="settings" size={15} color={colors.secondary} />
          <Text style={[styles.voicesBtn, { color: colors.secondary }]}>Change voices</Text>
        </TouchableOpacity>
      ) : null}

      {coverage === 'partial' ? (
        <View
          className="flex-row gap-2 rounded-inner p-3"
          style={{ backgroundColor: withAlpha(colors.flame, 0.1) }}>
          <AppIcon name="warning" size={18} color={colors.flame} />
          <Text style={[styles.hint, { color: colors.onSurface }]}>
            This note is only a few lines so far — add more to it for a fuller episode.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.6,
    fontFamily: fonts.bodyBold,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: fonts.headingBold,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bodyMedium,
  },
  chipInitial: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.headingBold,
  },
  chipText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bodyMedium,
  },
  voicesBtn: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bodySemibold,
  },
  hint: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.bodyMedium,
  },
});
