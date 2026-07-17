import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Onboard } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import { cn } from '@/lib/cn';

type Props = {
  label: string;
  onPress: () => void;
  /** 'filled' = solid indigo CTA · 'outline' = bordered secondary (Back). */
  variant?: 'filled' | 'outline';
  /** Filled tone: 'container' (#2e3192 — Get Started / Continue) or 'primary' (#15157d — Save to memory). */
  tone?: 'container' | 'primary';
  disabled?: boolean;
  /** Layout classes from the parent row (e.g. "flex-1"). */
  className?: string;
};

export function OnboardButton({
  label,
  onPress,
  variant = 'filled',
  tone = 'container',
  disabled = false,
  className,
}: Props) {
  const filled = variant === 'filled';
  const background = tone === 'primary' ? Onboard.primary : Onboard.primaryContainer;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      className={cn('min-h-[52px] items-center justify-center rounded-btn px-4', className)}
      style={[
        filled ? [styles.filled, { backgroundColor: background }] : styles.outline,
        disabled && styles.disabled,
      ]}>
      <Text style={[styles.label, { color: filled ? Onboard.onPrimary : Onboard.onSurfaceVariant }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  filled: {
    // Soft indigo glow from the mockup (0 4px 20px rgba(46,49,146,.15)).
    shadowColor: Onboard.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  outline: {
    borderWidth: 1,
    borderColor: Onboard.outlineVariant,
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
    letterSpacing: 0.14,
  },
});
