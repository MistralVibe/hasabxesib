import React from 'react';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export default function NotFoundScreen() {
  const { theme } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Text style={{ color: theme.colors.text, fontSize: theme.type.heading }}>Not found</Text>
      <Link href="/" style={{ color: theme.colors.accent }}>
        Go home
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 } });
