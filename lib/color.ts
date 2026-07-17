// Alpha variants of theme tokens (the mock uses e.g. errorContainer @ 30%).
// Deriving them here keeps constants/theme.ts small and components hex-free.

/** '#rrggbb' + opacity 0–1 → '#rrggbbaa' (React Native supports 8-digit hex). */
export function withAlpha(hex: string, opacity: number): string {
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${alpha}`;
}
