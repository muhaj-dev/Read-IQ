import { Stack } from 'expo-router';

/** Onboarding steps slide horizontally like a paged flow. */
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
