import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function Placeholder({ title }: { title: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.root}>
      <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.type.heading }]}>{title}</Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary, fontSize: theme.type.body }]}>
        Coming in the next ticket.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontWeight: '700' },
  body: {},
});
