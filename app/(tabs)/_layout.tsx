import { Tabs } from 'expo-router';

import { AppTabBar } from '@/components/navigation/tab-bar';

/** Main app tabs (see the dashboard mock): Home · Ask AI · [+] · Memory · Profile. */
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <AppTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="ask" options={{ title: 'Ask AI' }} />
      <Tabs.Screen name="memory" options={{ title: 'Memory' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
