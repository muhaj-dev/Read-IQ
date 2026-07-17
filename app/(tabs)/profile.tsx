import { useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileBackground } from '@/components/profile/profile-background';
import { ProfileEditForm } from '@/components/profile/profile-edit-form';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileMenu } from '@/components/profile/profile-menu';
import { ProfileStats } from '@/components/profile/profile-stats';
import { useProfile } from '@/hooks/use-profile';
import { useProfileMenu } from '@/hooks/use-profile-menu';

/** PROFILE tab — identity, study stats, and the account menu (see the profile mock). */
export default function ProfileScreen() {
  // Light status-bar icons only while focused; sibling tabs keep their dark StatusBar.
  const focused = useIsFocused();
  // Identity + stats from the stores; menu subtitles are live too.
  const { user, stats, form, save } = useProfile();
  const menu = useProfileMenu();
  const [editing, setEditing] = useState(false);

  return (
    <View className="flex-1">
      <ProfileBackground />
      {focused && <StatusBar style="light" />}
      {/* SafeAreaView doesn't support className (Style Exception Rule) → StyleSheet. */}
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* mb-2 stretches the 32px section gap to the mock's 40px under the header. */}
          <Animated.View layout={LinearTransition.duration(280)} className="mb-2">
            <ProfileHeader {...user} onEdit={() => setEditing(true)} />
          </Animated.View>

          {/* The edit form slides in above the stats and pushes the cards down. */}
          {editing && (
            <Animated.View
              entering={FadeInDown.duration(260)}
              exiting={FadeOutUp.duration(180)}
              layout={LinearTransition.duration(280)}>
              <ProfileEditForm initial={form} onSave={save} onCancel={() => setEditing(false)} />
            </Animated.View>
          )}

          <Animated.View layout={LinearTransition.duration(280)}>
            <ProfileStats stats={stats} />
          </Animated.View>
          <Animated.View layout={LinearTransition.duration(280)}>
            <ProfileMenu items={menu} />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    gap: 32,
  },
});
