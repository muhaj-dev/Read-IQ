import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  visible: boolean;
  onClose: () => void;
  onLibrary: () => void;
  onCamera: () => void;
};

type Option = { icon: AppIconName; label: string; hint: string; run: 'library' | 'camera' };

const OPTIONS: Option[] = [
  { icon: 'image', label: 'Photo Library', hint: 'Pick an image to ask about', run: 'library' },
  { icon: 'center-focus', label: 'Take Photo', hint: 'Snap a page or slide now', run: 'camera' },
];

/** The "+" attach sheet: add an image (from library or camera) for the AI to read. */
export function AskAttachMenu({ visible, onClose, onLibrary, onCamera }: Props) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  const select = (run: Option['run']) => {
    onClose();
    // Launch after the sheet dismisses so the picker isn't stacked under the modal.
    setTimeout(() => (run === 'library' ? onLibrary() : onCamera()), 200);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          accessibilityLabel="Close"
          onPress={onClose}
          style={[styles.backdrop, { backgroundColor: withAlpha(colors.onSurface, 0.35) }]}
        />
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surfaceLowest, marginBottom: 16 + insets.bottom, shadowColor: colors.shadow },
          ]}>
          <Text style={[styles.title, { color: colors.onSurfaceVariant }]}>ADD AN IMAGE</Text>
          {OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.run}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              activeOpacity={0.7}
              onPress={() => select(option.run)}
              className="flex-row items-center gap-3 rounded-inner px-3 py-3">
              <View
                className="h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: withAlpha(colors.secondaryFixed, 0.5) }}>
                <AppIcon name={option.icon} size={22} color={colors.secondary} />
              </View>
              <View className="flex-1">
                <Text style={[styles.label, { color: colors.onSurface }]}>{option.label}</Text>
                <Text style={[styles.hint, { color: colors.outline }]}>{option.hint}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            activeOpacity={0.7}
            onPress={onClose}
            className="mt-1 items-center rounded-inner py-3"
            style={{ backgroundColor: colors.surfaceContainer }}>
            <Text style={[styles.cancel, { color: colors.onSurfaceVariant }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 12,
    gap: 2,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  title: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    fontFamily: fonts.bodyBold,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 4,
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyRegular,
  },
  cancel: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
