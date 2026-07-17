import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { CameraChrome } from '@/constants/theme';
import { withAlpha } from '@/lib/color';

type Props = {
  flashOn: boolean;
  /** Disables the shutter while a capture is in flight. */
  busy: boolean;
  onPickImage: () => void;
  onCapture: () => void;
  onToggleFlash: () => void;
};

/** Camera bottom bar: gallery · shutter · flash (see the scan mock). */
export function ScanControls({ flashOn, busy, onPickImage, onCapture, onToggleFlash }: Props) {
  return (
    <View className="flex-row items-center justify-between px-5 pb-12 pt-8">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Pick an image from your gallery"
        onPress={onPickImage}
        className="h-14 w-14 items-center justify-center rounded-inner"
        style={styles.gallery}>
        <AppIcon name="image" size={26} color={withAlpha(CameraChrome.shutter, 0.85)} />
      </TouchableOpacity>

      <View className="items-center justify-center">
        <View style={styles.shutterRing} />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          activeOpacity={0.8}
          disabled={busy}
          onPress={onCapture}
          className="h-[72px] w-[72px] items-center justify-center rounded-pill"
          style={[styles.shutter, busy && styles.shutterBusy]}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={flashOn ? 'Turn flash off' : 'Turn flash on'}
        onPress={onToggleFlash}
        className="h-14 w-14 items-center justify-center rounded-pill"
        style={{ backgroundColor: CameraChrome.controlWell }}>
        <AppIcon
          name={flashOn ? 'flash-on' : 'flash-off'}
          size={24}
          color={flashOn ? CameraChrome.icon : withAlpha(CameraChrome.icon, 0.6)}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  gallery: {
    backgroundColor: CameraChrome.controlWell,
    borderWidth: 1,
    borderColor: CameraChrome.controlBorder,
  },
  shutterRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: CameraChrome.shutterRing,
  },
  shutter: {
    backgroundColor: CameraChrome.shutter,
    shadowColor: CameraChrome.shutter,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  shutterBusy: {
    opacity: 0.6,
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: CameraChrome.shutterInner,
  },
});
