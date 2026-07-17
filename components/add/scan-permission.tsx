import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { CameraChrome } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  /** Once the OS stops re-prompting, point the student at Settings instead. */
  canAskAgain: boolean;
  onRequest: () => void;
};

/** Dark centred state shown inside the viewfinder until camera access is granted. */
export function ScanPermission({ canAskAgain, onRequest }: Props) {
  const colors = useTheme();

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View
        className="mb-4 h-16 w-16 items-center justify-center rounded-pill"
        style={{ backgroundColor: CameraChrome.controlWell }}>
        <AppIcon name="document-scanner" size={28} color={CameraChrome.icon} />
      </View>
      <Text className="mb-2" style={styles.title}>
        Camera access needed
      </Text>
      <Text className="text-center" style={styles.message}>
        {canAskAgain
          ? 'readIQ uses the camera to scan pages of your notes.'
          : 'Camera access is turned off — enable it for readIQ in your device Settings.'}
      </Text>
      {canAskAgain ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onRequest}
          className="mt-6 items-center justify-center rounded-btn px-6 py-3"
          style={{ backgroundColor: colors.secondaryContainer }}>
          <Text style={[styles.action, { color: colors.onPrimary }]}>Allow camera access</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.headingBold,
    color: CameraChrome.icon,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.bodyRegular,
    color: withAlpha(CameraChrome.icon, 0.7),
  },
  action: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
