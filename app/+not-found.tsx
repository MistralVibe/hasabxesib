import React from 'react';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useI18n } from '@/i18n';

export default function NotFoundScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Text style={{ color: theme.colors.text, fontSize: theme.type.heading }}>{t('notFound.title')}</Text>
      <Link href="/" style={{ color: theme.colors.accent }}>
        {t('notFound.goHome')}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 } });
