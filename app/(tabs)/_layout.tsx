import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useI18n } from '@/i18n';

type TabRoute = { key: string; name: string };

/** Subset of @react-navigation's BottomTabBarProps that the dock actually needs. */
type TabDockProps = {
  state: { index: number; routes: TabRoute[] };
  descriptors: Record<string, { options: { title?: string } }>;
  navigateToTab: (routeKey: string) => void;
  insets: { bottom: number };
};

type IconPair = [outline: keyof typeof Ionicons.glyphMap, filled: keyof typeof Ionicons.glyphMap];

const TAB_ICONS: Record<string, IconPair> = {
  home: ['home-outline', 'home'],
  transactions: ['swap-vertical-outline', 'swap-vertical'],
  budgets: ['pie-chart-outline', 'pie-chart'],
  reports: ['bar-chart-outline', 'bar-chart'],
  settings: ['settings-outline', 'settings'],
};

function TabDock({ state, descriptors, navigateToTab, insets }: TabDockProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10), backgroundColor: c.background }]}>
      <View
        style={[
          styles.dock,
          theme.shadows.card,
          { backgroundColor: c.surface, borderColor: c.border, borderRadius: theme.radii.lg, borderCurve: 'continuous' },
        ]}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const icons = TAB_ICONS[route.name] ?? ['ellipse-outline', 'ellipse'];
          const label = descriptors[route.key]?.options.title ?? route.name;
          const color = focused ? c.tabBarActive : c.tabBarInactive;
          return (
            <Pressable
              key={route.key}
              onPress={() => navigateToTab(route.key)}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
              style={({ pressed }) => [
                styles.item,
                {
                  backgroundColor: focused ? c.accentSoft : 'transparent',
                  borderRadius: theme.radii.md,
                  borderCurve: 'continuous',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons name={focused ? icons[1] : icons[0]} size={21} color={color} />
              <Text numberOfLines={1} style={{ color, fontSize: 10, fontWeight: focused ? '700' : '600', marginTop: 3 }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const c = theme.colors;

  return (
    <Tabs
      tabBar={(props) => <TabDock {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.tabBarActive,
        tabBarInactiveTintColor: c.tabBarInactive,
      }}
    >
      <Tabs.Screen name="home" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="transactions" options={{ title: t('tabs.transactions') }} />
      <Tabs.Screen name="budgets" options={{ title: t('tabs.budgets') }} />
      <Tabs.Screen name="reports" options={{ title: t('tabs.reports') }} />
      <Tabs.Screen name="settings" options={{ title: t('tabs.settings') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingTop: 6 },
  dock: {
    flexDirection: 'row',
    padding: 8,
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: '0px 6px 18px rgba(15, 23, 42, 0.10)',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 7 },
});
