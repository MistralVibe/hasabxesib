import React, { useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { I18nProvider, useI18n } from '@/i18n';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useDataStore } from '@/stores/useDataStore';
import { androidChannelSetup, ensurePermissions } from '@/services/notifications';
import { authenticate, isLockAvailable } from '@/services/lock';
import { Button } from '@/components/ui/Button';

function StartupGate({ children }: { children: React.ReactNode }) {
  const { settings, loaded, load } = useSettingsStore();
  const dataStore = useDataStore();
  const { t } = useI18n();
  const { theme } = useTheme();
  const [locked, setLocked] = useState(false);
  const [lockChecked, setLockChecked] = useState(false);

  useEffect(() => {
    load();
    dataStore.load();
    dataStore.materializeRecurring();
    androidChannelSetup();
    void ensurePermissions();
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
        const ok = await authenticate(t('settings.appLock'));
        if (mounted) setLocked(!ok);
      }
      if (mounted) setLockChecked(true);
    };
    void checkLock();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && settings.lockEnabled) {
        setLockChecked(false);
        void checkLock();
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <I18nProvider>
            <StartupGate>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="onboarding" options={{ presentation: 'modal', headerShown: false, gestureEnabled: false }} />
                <Stack.Screen name="transaction" options={{ presentation: 'modal' }} />
                <Stack.Screen name="accounts" options={{ presentation: 'modal' }} />
                <Stack.Screen name="+not-found" />
              </Stack>
            </StartupGate>
          </I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
