import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors } from '../constants/colors';

type ThemeContextValue = { colors: typeof lightColors; dark: boolean; toggle: () => void };
const ThemeContext = createContext<ThemeContextValue>({ colors: lightColors, dark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [override, setOverride] = useState<boolean | null>(null);
  const dark = override ?? system === 'dark';
  const value = useMemo(() => ({ colors: dark ? darkColors : lightColors, dark, toggle: () => setOverride(!dark) }), [dark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
