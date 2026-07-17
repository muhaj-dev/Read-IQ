import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  state: 'reading' | 'summarizing' | 'error';
  fileName: string;
  /** Friendly error line (shown when state === 'error'). */
  message?: string;
  /** Override the "reading" step copy (Scan → "Reading your photo…", Record → "Transcribing…"). */
  readingTitle?: string;
  readingHint?: string;
  /** Override the error heading + skip-button label per context. */
  errorTitle?: string;
  skipLabel?: string;
  onRetry: () => void;
  onSkip: () => void;
};

// Default busy copy (the upload flow); each step runs through the BTL runtime.
const SUMMARIZING = {
  title: 'Summarizing…',
  hint: 'Writing a quick summary with your study assistant.',
};
const READING = {
  title: 'Reading your document…',
  hint: 'Pulling the text out through your study assistant.',
};

/** Full-screen status while media is read/summarized via BTL: spinner or graceful error. */
export function ExtractStatus({
  state,
  fileName,
  message,
  readingTitle,
  readingHint,
  errorTitle,
  skipLabel,
  onRetry,
  onSkip,
}: Props) {
  const colors = useTheme();
  const busy =
    state === 'summarizing'
      ? SUMMARIZING
      : { title: readingTitle ?? READING.title, hint: readingHint ?? READING.hint };

  return (
    <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: colors.surface }}>
      {state !== 'error' ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-6 text-center" style={[styles.title, { color: colors.onSurface }]}>
            {busy.title}
          </Text>
          <Text numberOfLines={1} className="mt-1.5 text-center" style={[styles.body, { color: colors.onSurfaceVariant }]}>
            {fileName}
          </Text>
          <Text className="mt-1 text-center" style={[styles.hint, { color: colors.outline }]}>
            {busy.hint}
          </Text>
        </>
      ) : (
        <>
          <View
            className="h-16 w-16 items-center justify-center rounded-pill"
            style={{ backgroundColor: withAlpha(colors.errorContainer, 0.6) }}>
            <AppIcon name="warning" size={30} color={colors.error} />
          </View>
          <Text className="mt-5 text-center" style={[styles.title, { color: colors.onSurface }]}>
            {errorTitle ?? "Couldn't read that document"}
          </Text>
          <Text className="mt-2 text-center" style={[styles.body, { color: colors.onSurfaceVariant }]}>
            {message ?? 'Something went wrong reading the file.'}
          </Text>

          <TouchableOpacity
            accessibilityRole="button"
            onPress={onRetry}
            className="mt-7 w-full items-center rounded-lg py-3.5"
            style={{ backgroundColor: colors.primaryContainer }}>
            <Text style={[styles.btnPrimary, { color: colors.onPrimary }]}>Try again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onSkip}
            className="mt-3 w-full items-center py-3">
            <Text style={[styles.btnGhost, { color: colors.primary }]}>{skipLabel ?? 'Add without text'}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.headingBold,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.bodyRegular,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bodyRegular,
  },
  btnPrimary: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.bodySemibold,
  },
  btnGhost: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
