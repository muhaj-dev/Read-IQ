import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import type { EpisodeStatus } from '@/store/use-podcast-store';

type Props = {
  status: EpisodeStatus;
  error: string;
  onGenerate: () => void;
};

/** Everything before an episode is ready: the "Create episode" invitation, the
 *  while-writing spinner, and a friendly error with retry. Shown centred on the
 *  Listen screen; the player replaces it once the script is ready. */
export function EpisodeGate({ status, error, onGenerate }: Props) {
  const colors = useTheme();

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.secondary} />
      </View>
    );
  }

  if (status === 'generating') {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <View className="h-16 w-16 items-center justify-center rounded-pill" style={{ backgroundColor: withAlpha(colors.secondary, 0.1) }}>
          <ActivityIndicator color={colors.secondary} />
        </View>
        <Text style={[styles.title, { color: colors.onSurface }]}>Writing your episode…</Text>
        <Text style={[styles.blurb, { color: colors.onSurfaceVariant }]}>
          Maya and Leo are talking through your note. This uses only what you saved — no outside facts.
        </Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <View className="h-16 w-16 items-center justify-center rounded-pill" style={{ backgroundColor: withAlpha(colors.flame, 0.12) }}>
          <AppIcon name="warning" size={28} color={colors.flame} />
        </View>
        <Text style={[styles.title, { color: colors.onSurface }]}>Couldn&apos;t make the episode</Text>
        <Text style={[styles.blurb, { color: colors.onSurfaceVariant }]}>{error}</Text>
        <PrimaryButton label="Try again" onPress={onGenerate} />
      </View>
    );
  }

  // idle — no episode yet.
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8">
      <View className="h-20 w-20 items-center justify-center rounded-pill" style={{ backgroundColor: withAlpha(colors.secondary, 0.1) }}>
        <AppIcon name="headphones" size={38} color={colors.secondary} />
      </View>
      <Text style={[styles.title, { color: colors.onSurface }]}>Broadcast this note</Text>
      <Text style={[styles.blurb, { color: colors.onSurfaceVariant }]}>
        Two hosts talk through your note like a mini broadcast, so you can revise by listening.
        Written only from what you saved.
      </Text>
      <PrimaryButton label="Create episode" onPress={onGenerate} />
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const colors = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.85}
      onPress={onPress}
      className="mt-1 h-12 flex-row items-center justify-center gap-2 rounded-card px-6"
      style={{ backgroundColor: colors.secondary }}>
      <AppIcon name="auto-awesome" size={18} color={colors.onPrimary} filled />
      <Text style={[styles.button, { color: colors.onPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
    fontFamily: fonts.headingBold,
  },
  blurb: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    fontFamily: fonts.bodyRegular,
  },
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
