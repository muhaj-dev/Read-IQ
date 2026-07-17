import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScanControls } from '@/components/add/scan-controls';
import { ScanFrame } from '@/components/add/scan-frame';
import { ScanPermission } from '@/components/add/scan-permission';
import { ScanTopBar } from '@/components/add/scan-top-bar';
import { CameraChrome } from '@/constants/theme';

/** Add — Scan. Live viewfinder; a capture or gallery pick opens Scan Result. */
export default function ScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  const [showFrame, setShowFrame] = useState(true);
  const [busy, setBusy] = useState(false);

  const openResult = (uri: string) =>
    router.push({ pathname: '/add/scan-result', params: { uri } });

  const capture = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync();
      if (photo?.uri) openResult(photo.uri);
    } catch {
      // Capture failed (e.g. camera tearing down) — stay on the viewfinder.
    } finally {
      setBusy(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) openResult(result.assets[0].uri);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: CameraChrome.background }}>
      <StatusBar style="light" />
      {/* SafeAreaView doesn't support className (Style Exception Rule) → inline styles. */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: CameraChrome.topBar }}>
        <ScanTopBar onToggleFrame={() => setShowFrame((now) => !now)} />
      </SafeAreaView>

      <View className="flex-1">
        {permission?.granted ? (
          <>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
              flash={flashOn ? 'on' : 'off'}
            />
            {showFrame ? <ScanFrame /> : null}
          </>
        ) : permission ? (
          <ScanPermission canAskAgain={permission.canAskAgain} onRequest={requestPermission} />
        ) : null}
      </View>

      <View style={{ backgroundColor: CameraChrome.bottomBar }}>
        <SafeAreaView edges={['bottom']}>
          <ScanControls
            flashOn={flashOn}
            busy={busy}
            onPickImage={pickImage}
            onCapture={capture}
            onToggleFlash={() => setFlashOn((now) => !now)}
          />
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
});
