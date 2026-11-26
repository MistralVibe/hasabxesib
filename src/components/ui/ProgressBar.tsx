import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function ProgressBar({ ratio, color }: { ratio: number; color?: string }) {
  const { theme } = useTheme();
  const clamped = Math.min(Math.max(ratio, 0), 1);
  return (
    <View style={[styles.track, { backgroundColor: theme.colors.border, borderRadius: theme.radii.full }]}>
      <View
        style={{
          width: `${clamped * 100}%`,
          backgroundColor: color ?? theme.colors.accent,
          borderRadius: theme.radii.full,
          ...styles.fill,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, overflow: 'hidden' },
  fill: { height: '100%' },
});
