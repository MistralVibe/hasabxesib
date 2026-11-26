import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/theme/ThemeProvider';
import { useI18n, Language } from '@/i18n';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useDataStore } from '@/stores/useDataStore';
import { useFormatters } from '@/hooks/useFormatters';
import { ThemeMode } from '@/theme/tokens';
import { isLockAvailable } from '@/services/lock';
import { exportCsv, exportJsonBackup, importJsonBackup } from '@/services/backup';
import { scheduleNotification, cancelNotification, ensurePermissions } from '@/services/notifications';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const { theme, mode, setMode } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const { money, currency } = useFormatters();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const reload = useDataStore((s) => s.reload);
  const c = theme.colors;

  const [busy, setBusy] = useState('');

  const toggleLock = async (value: boolean) => {
    if (value) {
      const available = await isLockAvailable();
      if (!available) {
        Alert.alert(t('common.error'), t('errors.biometricUnavailable'));
        return;
      }
    }
    update('lockEnabled', value);
  };

  const toggleReminder = async (value: boolean) => {
    update('reminderEnabled', value);
    if (value) {
      const granted = await ensurePermissions();
      if (!granted) {
        Alert.alert(t('common.error'), t('errors.notificationsBlocked'));
        update('reminderEnabled', false);
        return;
      }
      const [h, m] = settings.reminderTime.split(':').map(Number);
      await scheduleNotification({
        id: 'daily-reminder',
        title: t('notifications.dailyReminderTitle'),
        body: t('notifications.dailyReminderBody'),
        trigger: { hour: h, minute: m },
      });
    } else {
      await cancelNotification('daily-reminder');
    }
  };

  const changeReminderTime = (text: string) => {
    update('reminderTime', text);
    if (settings.reminderEnabled) {
      const [h, m] = text.split(':').map(Number);
      if (Number.isInteger(h) && Number.isInteger(m) && h >= 0 && h < 24 && m >= 0 && m < 60) {
        void scheduleNotification({
          id: 'daily-reminder',
          title: t('notifications.dailyReminderTitle'),
          body: t('notifications.dailyReminderBody'),
          trigger: { hour: h, minute: m },
        });
      }
    }
  };

  const doExportCsv = async () => {
    setBusy('csv');
    try {
      await exportCsv(currency);
    } catch {
      Alert.alert(t('common.error'), t('errors.exportFailed'));
    } finally {
      setBusy('');
    }
  };

  const doExportJson = async () => {
    setBusy('json');
    try {
      await exportJsonBackup();
    } catch {
      Alert.alert(t('common.error'), t('errors.exportFailed'));
    } finally {
      setBusy('');
    }
  };

  const doImport = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    Alert.alert(t('settings.importConfirmTitle'), t('settings.importConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.apply'),
        onPress: async () => {
          const r = await importJsonBackup(result.assets[0].uri);
          if (r.ok) {
            reload();
            Alert.alert(t('common.done'));
          } else {
            Alert.alert(t('common.error'), `${t('errors.importFailed')}: ${r.error}`);
          }
        },
      },
    ]);
  };

  const optionRow = (label: string, options: { value: string; label: string }[], current: string, onChange: (v: string) => void) => (
    <View style={styles.chips}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          style={[
            styles.chip,
            { borderColor: current === o.value ? c.accent : c.border, backgroundColor: current === o.value ? c.accentSoft : c.surface, borderRadius: theme.radii.full },
          ]}
        >
          <Text style={{ color: current === o.value ? c.accent : c.text, fontSize: theme.type.caption, fontWeight: '600' }}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <Screen>
      <Text style={[styles.title, { color: c.text, fontSize: theme.type.title }]}>{t('settings.title')}</Text>

      <SectionTitle title={t('settings.appearance')} />
      <Card style={styles.card}>
        <Text style={{ color: c.textSecondary, fontSize: theme.type.caption, marginBottom: 6 }}>{t('settings.theme')}</Text>
        {optionRow('', [
          { value: 'system', label: t('settings.themeSystem') },
          { value: 'light', label: t('settings.themeLight') },
          { value: 'dark', label: t('settings.themeDark') },
        ], mode, (v) => setMode(v as ThemeMode))}
        <Text style={{ color: c.textSecondary, fontSize: theme.type.caption, margin: '8px 0' }}>{t('settings.language')}</Text>
        {optionRow('', [
          { value: 'en', label: 'English' },
          { value: 'ru', label: 'Русский' },
        ], language, (v) => setLanguage(v as Language))}
        <Text style={{ color: c.textSecondary, fontSize: theme.type.caption, marginTop: 8 }}>
          {t('settings.currencyDisplay')}: {currency} ({money(0)})
        </Text>
      </Card>

      <SectionTitle title={t('settings.security')} style={styles.gap} />
      <Card style={[styles.card, styles.rowBetween]}>
        <View style={styles.flex}>
          <Text style={{ color: c.text, fontWeight: '600', fontSize: theme.type.body }}>{t('settings.appLock')}</Text>
          <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>{t('settings.appLockBody')}</Text>
        </View>
        <Switch value={settings.lockEnabled} onValueChange={toggleLock} trackColor={{ true: c.accent }} />
      </Card>

      <SectionTitle title={t('settings.reminders')} style={styles.gap} />
      <Card style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={{ color: c.text, fontWeight: '600', fontSize: theme.type.body }}>{t('settings.dailyReminder')}</Text>
          <Switch value={settings.reminderEnabled} onValueChange={toggleReminder} trackColor={{ true: c.accent }} />
        </View>
        {settings.reminderEnabled ? (
          <TextInput
            value={settings.reminderTime}
            onChangeText={changeReminderTime}
            placeholder="HH:MM"
            placeholderTextColor={c.textSecondary}
            keyboardType="numbers-and-punctuation"
            style={[
              styles.timeInput,
              { color: c.text, borderColor: c.border, borderRadius: theme.radii.sm, backgroundColor: c.background, marginTop: 8 },
            ]}
          />
        ) : null}
      </Card>

      <SectionTitle title={t('settings.data')} style={styles.gap} />
      <Card style={styles.card}>
        <Button title={busy === 'csv' ? '…' : t('settings.exportCsv')} variant="secondary" onPress={doExportCsv} style={styles.dataBtn} />
        <Button title={busy === 'json' ? '…' : t('settings.exportJson')} variant="secondary" onPress={doExportJson} style={styles.dataBtn} />
        <Button title={t('settings.importJson')} variant="secondary" onPress={doImport} style={styles.dataBtn} />
      </Card>

      <SectionTitle title={t('settings.about')} style={styles.gap} />
      <Card style={styles.card}>
        <Text style={{ color: c.text, fontWeight: '600', fontSize: theme.type.body }}>HasabXesib</Text>
        <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>
          {t('settings.version')} {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '800', marginBottom: 12 },
  card: { marginBottom: 8, gap: 4 },
  gap: { marginTop: 16 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: StyleSheet.hairlineWidth },
  timeInput: { alignSelf: 'flex-start', borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 6, fontWeight: '700' },
  dataBtn: { marginBottom: 8 },
});
