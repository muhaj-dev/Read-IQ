import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { GlassCard } from '@/components/profile/glass-card';
import { AppIcon } from '@/components/ui/app-icon';
import { images } from '@/constants/images';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  name: string;
  /** Contact email shown under the name. Hidden if empty. */
  email: string;
  /** The student's study goal, shown under the email. Hidden if empty. */
  goal: string;
  role: string;
  /** Opens the inline edit form (avatar badge + name pencil). */
  onEdit?: () => void;
};

/** Identity block: avatar with edit badge, name, email, goal, and the course chip. */
export function ProfileHeader({ name, email, goal, role, onEdit }: Props) {
  const colors = useTheme();

  return (
    <View className="items-center">
      {/* Avatar — the noteIQ mark in a soft double ring. */}
      <View className="mb-6">
        <View
          className="h-32 w-32 rounded-pill border-4 p-1"
          style={{ borderColor: withAlpha(colors.onPrimary, 0.2) }}>
          <View
            className="flex-1 items-center justify-center rounded-pill border-2 p-2"
            style={{
              borderColor: colors.onPrimarySoft,
              backgroundColor: withAlpha(colors.onPrimary, 0.06),
            }}>
            <Image
              source={images.mark}
              style={styles.mark}
              contentFit="contain"
              accessibilityLabel="Profile photo"
            />
          </View>
        </View>
        {/* Edit badge → opens the inline profile editor. */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          activeOpacity={0.8}
          onPress={onEdit}
          className="absolute bottom-1 right-1 h-8 w-8 items-center justify-center rounded-pill border-2"
          style={[
            styles.editBadge,
            {
              backgroundColor: colors.onPrimary,
              borderColor: colors.primary,
              shadowColor: colors.shadow,
            },
          ]}>
          <AppIcon name="edit" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Edit name"
        activeOpacity={0.7}
        onPress={onEdit}
        className="mb-1 flex-row items-center gap-2">
        {/* Spacer mirrors the pencil so the name stays truly centered. */}
        <View className="w-5" />
        <Text style={[styles.name, { color: colors.onPrimary }]}>{name}</Text>
        <AppIcon name="edit" size={20} color={withAlpha(colors.onPrimarySoft, 0.6)} />
      </TouchableOpacity>
      {email ? (
        <Text className={goal ? 'mb-1' : 'mb-4'} style={[styles.email, { color: colors.onPrimarySoft }]}>
          {email}
        </Text>
      ) : !goal ? (
        <View className="mb-4" />
      ) : null}
      

      <GlassCard className="rounded-pill px-4 py-1.5">
        <Text style={[styles.role, { color: colors.onPrimary }]}>{role}</Text>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: '100%',
    height: '100%',
  },
  editBadge: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  name: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: fonts.headingBold,
  },
  email: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.bodyRegular,
  },
  goal: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyRegular,
  },
  role: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
    letterSpacing: 0.1,
  },
});
