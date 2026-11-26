import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const bg = variant === 'primary' ? c.accent : variant === 'secondary' ? c.accentSoft : variant === 'danger' ? c.danger : 'transparent';
  const fg = variant === 'primary' ? c.accentText : variant === 'danger' ? '#FFFFFF' : c.accent;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderRadius: theme.radii.md, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
      accessibilityRole="button"
    >
      <Text style={{ color: fg, fontSize: theme.type.body, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
});
