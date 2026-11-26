import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useI18n } from '@/i18n';

export default function TabsLayout() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const c = theme.colors;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.tabBarActive,
        tabBarInactiveTintColor: c.tabBarInactive,
        tabBarStyle: { backgroundColor: c.tabBarBackground, borderTopColor: c.border },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: t('tabs.home'), tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="transactions"
        options={{ title: t('tabs.transactions'), tabBarIcon: ({ color, size }) => <Ionicons name="swap-vertical" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="budgets"
        options={{ title: t('tabs.budgets'), tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: t('tabs.reports'), tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t('tabs.settings'), tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
