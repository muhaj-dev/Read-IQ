import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddHeader } from '@/components/add/add-header';
import { RecordControls } from '@/components/add/record-controls';
import { RecordTimer } from '@/components/add/record-timer';
import { RecordWaveform } from '@/components/add/record-waveform';
import { TabPlaceholder } from '@/components/ui/tab-placeholder';
import { useLectureRecorder } from '@/hooks/use-lecture-recorder';
import { useTheme } from '@/hooks/use-theme';

/** Add — Record Lecture. Recording starts on entry; transcript lands in Phase 8. */
export default function RecordScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { status, seconds, toggle, stop } = useLectureRecorder();

  // Discard: stop and back out of the flow.
  const leave = async () => {
    await stop();
    if (router.canGoBack()) router.back();
    else router.navigate('/add');
  };

  // Finish: stop and hand the recording (uri + duration) to the Record Result screen.
  const finish = async () => {
    const uri = await stop();
    router.replace({
      pathname: '/add/record-result',
      params: { seconds: String(seconds), uri: uri ?? '' },
    });
  };

  if (status === 'denied') {
    return (
      <TabPlaceholder
        icon="mic"
        title="Microphone access needed"
        message="Allow microphone access so readIQ can record and transcribe your lecture."
        action={{ label: 'Go back', onPress: () => router.back() }}
      />
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      {/* SafeAreaView doesn't support className (Style Exception Rule) → StyleSheet. */}
      <SafeAreaView edges={['top']} style={styles.flex}>
        <AddHeader title="Record Lecture" />
        {/* Waveform centred (~60%), timer below, controls with bottom breathing room. */}
        <View className="flex-1 px-5">
          <View className="flex-[6] items-center justify-center">
            <RecordWaveform active={status === 'recording'} />
          </View>
          <RecordTimer seconds={seconds} status={status} />
          <View className="flex-1" />
          {/* Finish opens the Record Result screen (transcript + save). */}
          <RecordControls
            paused={status === 'paused'}
            onDiscard={leave}
            onToggle={toggle}
            onFinish={finish}
          />
          <View className="h-24" />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
