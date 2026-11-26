import React, { useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { I18nProvider, useI18n } from '@/i18n';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useDataStore } from '@/stores/useDataStore';
import { androidChannelSetup, ensurePermissions } from '@/services/notifications';
import { refreshBudgetAlerts } from '@/services/budgetAlerts';
import { authenticate, isLockAvailable } from '@/services/lock';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function StartupGate({ children }: { children: React.ReactNode }) {
  const { settings, loaded } = useSettingsStore();
  const { t } = useI18n();
  const { theme } = useTheme();
  const [locked, setLocked] = useState(false);
  const [lockChecked, setLockChecked] = useState(false);
  const tRef = React.useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    // Run once on mount: load stores, post overdue recurring rules, set up alerts.
    useSettingsStore.getState().load();
    useDataStore.getState().load();
    useDataStore.getState().materializeRecurring();
    androidChannelSetup();
    void ensurePermissions();
    // Re-evaluate budget alerts whenever transactions or budgets change.
    const unsub = useDataStore.subscribe((state, prev) => {
      if (state.transactions !== prev.transactions || state.budgets !== prev.budgets) {
        void refreshBudgetAlerts((path, params) => tRef.current(path, params));
      }
    });
    void refreshBudgetAlerts((path, params) => tRef.current(path, params));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    let mounted = true;
    const checkLock = async () => {
      if (!settings.lockEnabled) {
        setLocked(false);
        setLockChecked(true);
        return;
      }
      const available = await isLockAvailable();
      if (!mounted) return;
      if (!available) {
        setLocked(false);
      } else {
        const ok = await authenticate(tRef.current('settings.appLock'));
        if (mounted) setLocked(!ok);
      }
      if (mounted) setLockChecked(true);
    };
    void checkLock();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // Daily check: re-evaluate budget alerts whenever the app comes to foreground.
        void refreshBudgetAlerts((path, params) => tRef.current(path, params));
        if (settings.lockEnabled) {
          setLockChecked(false);
          void checkLock();
        }
      }
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, [loaded, settings.lockEnabled]);

  if (!loaded || (settings.lockEnabled && !lockChecked)) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text, fontSize: theme.type.heading }}>HasabXesib</Text>
      </View>
    );
  }

  if (locked) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text, fontSize: theme.type.heading, marginBottom: 16 }}>
          {t('settings.appLock')}
        </Text>
        <Button
          title={t('common.unlock')}
          onPress={async () => {
            const ok = await authenticate(t('settings.appLock'));
            setLocked(!ok);
          }}
        />
      </View>
    );
  }

  if (!settings.onboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <View style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <I18nProvider>
            <ErrorBoundary>
            <StartupGate>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="onboarding" options={{ presentation: 'modal', headerShown: false, gestureEnabled: false }} />
                <Stack.Screen name="transaction" options={{ presentation: 'modal' }} />
                <Stack.Screen name="accounts" options={{ presentation: 'modal' }} />
                <Stack.Screen name="recurring" options={{ presentation: 'modal' }} />
                <Stack.Screen name="+not-found" />
              </Stack>
            </StartupGate>
            </ErrorBoundary>
          </I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
