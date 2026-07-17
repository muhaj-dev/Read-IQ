import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { GlassCard } from '@/components/profile/glass-card';
import { AppIcon } from '@/components/ui/app-icon';
import type { ColorTokens } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import type { ProfileMenuItem, ProfileMenuTone } from '@/data/profile';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  items: ProfileMenuItem[];
};

function toneColors(tone: ProfileMenuTone, colors: ColorTokens): { icon: string; well: string } {
  if (tone === 'green') return { icon: colors.menuGreen, well: colors.menuGreenWell };
  if (tone === 'blue') return { icon: colors.menuBlue, well: colors.menuBlueWell };
  if (tone === 'orange') return { icon: colors.menuOrange, well: colors.menuOrangeWell };
  if (tone === 'purple') return { icon: colors.menuPurple, well: colors.menuPurpleWell };
  return { icon: colors.menuSlate, well: colors.menuSlateWell };
}

/** The glass action list (Study Sessions · Quiz Performance · …). */
export function ProfileMenu({ items }: Props) {
  const colors = useTheme();
  const router = useRouter();

  return (
    <GlassCard className="rounded-[32px] p-2">
      {items.map((item, index) => {
        const tone = toneColors(item.tone, colors);

        return (
          <TouchableOpacity
            key={item.id}
            accessibilityRole="button"
            activeOpacity={0.7}
            // Rows without an href aren't navigable yet.
            onPress={() => item.href && router.push(item.href)}
            className="flex-row items-center justify-between p-5"
            style={
              index > 0 && {
                borderTopWidth: 1,
                borderTopColor: withAlpha(colors.onPrimary, 0.1),
              }
            }>
            <View className="flex-row items-center gap-4">
              <View
                className="h-10 w-10 items-center justify-center rounded-inner"
                style={{ backgroundColor: tone.well }}>
                <AppIcon name={item.icon} size={22} color={tone.icon} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.onPrimary }]}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={[styles.subtitle, { color: colors.onPrimarySoft }]}>
                    {item.subtitle}
                  </Text>
                )}
              </View>
            </View>
            <AppIcon name="chevron-right" size={24} color={colors.onPrimarySoft} />
          </TouchableOpacity>
        );
      })}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
});
