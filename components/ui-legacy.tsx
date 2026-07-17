import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../hooks/use-theme-legacy';

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const { colors } = useTheme();
  return <View style={[{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 24, padding: 18, gap: 12, boxShadow: '0 5px 16px rgba(20, 20, 50, 0.06)' }, style]}>{children}</View>;
}
export function Eyebrow({ children }: { children: React.ReactNode }) { const { colors } = useTheme(); return <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>{children}</Text>; }
export function Button({ title, onPress, secondary = false }: { title: string; onPress: () => void; secondary?: boolean }) {
  const { colors } = useTheme();
  return <Pressable onPress={onPress} style={({ pressed }) => ({ backgroundColor: secondary ? colors.accentSoft : colors.accent, paddingVertical: 15, paddingHorizontal: 20, borderRadius: 16, opacity: pressed ? 0.75 : 1, alignItems: 'center' })}><Text style={{ color: secondary ? colors.accent : '#FFFFFF', fontWeight: '800', fontSize: 15 }}>{title}</Text></Pressable>;
}
export function IconButton({ icon, onPress }: { icon: string; onPress: () => void }) { const { colors } = useTheme(); return <Pressable onPress={onPress} style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.text, fontSize: 20 }}>{icon}</Text></Pressable>; }
