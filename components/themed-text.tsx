import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && [styles.linkPrimary, { color: theme.accent }],
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyMedium,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyBold,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.bodyMedium,
  },
  title: {
    fontSize: 48,
    fontFamily: fonts.headingSemibold,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontFamily: fonts.headingSemibold,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
