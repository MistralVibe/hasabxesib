import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';

export function CategoryIcon({ icon, color, size = 20 }: { icon: string; color: string; size?: number }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderRadius: theme.radii.full , borderCurve: 'continuous'}]}>
      <Ionicons name={icon as never} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
