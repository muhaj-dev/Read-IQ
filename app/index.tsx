import { type Href, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { LogoReveal } from '@/components/splash/logo-reveal';
import { SplashBackground } from '@/components/splash/splash-background';
import { SplashFooter } from '@/components/splash/splash-footer';
import { useOnboardingStore } from '@/store/use-onboarding-store';

const WELCOME: Href = '/welcome';
const HOME: Href = '/home';

/** Splash flow: mark → wordmark → loading bar, then route to onboarding or Home. */
export default function SplashRoute() {
  const router = useRouter();
  const [settled, setSettled] = useState(false);
  const [finished, setFinished] = useState(false);
  const onboardingLoaded = useOnboardingStore((s) => s.loaded);
  const onboardingCompleted = useOnboardingStore((s) => s.completed);

  const hideNativeSplash = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const handleSettled = useCallback(() => setSettled(true), []);
  const handleFinished = useCallback(() => setFinished(true), []);

  // Route only after the loading bar finishes AND the flag is read, so returners aren't flashed onboarding.
  useEffect(() => {
    if (!finished || !onboardingLoaded) return;
    router.replace(onboardingCompleted ? HOME : WELCOME);
  }, [finished, onboardingLoaded, onboardingCompleted, router]);

  return (
    <View className="flex-1 items-center justify-center" onLayout={hideNativeSplash}>
      <StatusBar style="dark" />
      <SplashBackground />

      <LogoReveal onSettled={handleSettled} />
      {settled ? <SplashFooter durationMs={1000} onComplete={handleFinished} /> : null}
    </View>
  );
}
