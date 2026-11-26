import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function SectionTitle({ title, action, onAction, style }: { title: string; action?: string; onAction?: () => void; style?: ViewStyle }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.row, style]}>
      <Text style={{ color: theme.colors.text, fontSize: theme.type.heading, fontWeight: '700' }}>{title}</Text>
      {action ? (
        <Text onPress={onAction} style={{ color: theme.colors.accent, fontSize: theme.type.body, fontWeight: '600' }}>
          {action}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } });
