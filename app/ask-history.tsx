import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SessionCard } from '@/components/ask/session-card';
import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { useChatStore } from '@/store/use-chat-store';

/** Chat history — saved Ask conversations, newest first; tap to reopen or start fresh. */
export default function AskHistoryScreen() {
  const colors = useTheme();
  const router = useRouter();
  const sessions = useChatStore((s) => s.sessions);
  const init = useChatStore((s) => s.init);
  const openSession = useChatStore((s) => s.openSession);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const newChat = useChatStore((s) => s.newChat);

  useEffect(() => {
    init();
  }, [init]);

  const open = async (id: string) => {
    await openSession(id);
    router.back();
  };

  const startNew = () => {
    newChat();
    router.back();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View className="h-14 flex-row items-center px-2">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-pill">
            <AppIcon name="chevron-left" size={26} color={colors.onSurface} />
          </TouchableOpacity>
          <Text className="flex-1 text-center" style={[styles.title, { color: colors.onSurface }]}>
            Chat history
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="New chat"
            onPress={startNew}
            className="h-11 w-11 items-center justify-center rounded-pill">
            <AppIcon name="edit-note" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              onOpen={() => open(item.id)}
              onDelete={() => deleteSession(item.id)}
            />
          )}
          ListEmptyComponent={
            <View className="mt-24 items-center px-8">
              <View
                className="mb-4 h-16 w-16 items-center justify-center rounded-pill"
                style={{ backgroundColor: colors.surfaceContainer }}>
                <AppIcon name="schedule" size={30} color={colors.secondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>No saved chats yet</Text>
              <Text className="mt-1 text-center" style={[styles.emptyBody, { color: colors.onSurfaceVariant }]}>
                Your conversations with readIQ will appear here so you can revisit them anytime.
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.headingBold,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: fonts.bodySemibold,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyRegular,
  },
});
