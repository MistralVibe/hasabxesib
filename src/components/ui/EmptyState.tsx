import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';

export function EmptyState({ icon = 'wallet-outline', title, body }: { icon?: string; title: string; body?: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.root}>
      <Ionicons name={icon as never} size={44} color={theme.colors.textSecondary} />
      <Text style={{ color: theme.colors.text, fontSize: theme.type.heading, fontWeight: '700', textAlign: 'center' }}>{title}</Text>
      {body ? (
        <Text style={{ color: theme.colors.textSecondary, fontSize: theme.type.body, textAlign: 'center' }}>{body}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ root: { alignItems: 'center', gap: 8, paddingVertical: 32 } });
