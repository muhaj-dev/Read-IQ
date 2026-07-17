import { Colors } from '@/constants/theme';

/** Light-only build: always returns the light tokens (theme toggle deferred). */
export function useTheme() {
  return Colors.light;
}
