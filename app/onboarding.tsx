import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { useI18n } from '@/i18n';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useDataStore } from '@/stores/useDataStore';
import { listCurrencies, CurrencyInfo } from '@/domain/currencies';
import { toMinor } from '@/domain/money';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

type Step = 'currency' | 'budgets';

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const router = useRouter();
  const updateSettings = useSettingsStore((s) => s.update);
  const { categories, upsertBudget } = useDataStore();

  const [step, setStep] = useState<Step>('currency');
  const [query, setQuery] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [caps, setCaps] = useState<Record<string, string>>({});

  const currencies = useMemo(() => listCurrencies(language), [language]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return currencies;
    return currencies.filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }, [currencies, query]);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const finish = () => {
    updateSettings('currency', currency);
    updateSettings('language', language);
    for (const [categoryId, cap] of Object.entries(caps)) {
      const minor = toMinor(cap, currency);
      if (minor && minor > 0) upsertBudget({ categoryId, amount: minor });
    }
    updateSettings('onboarded', true);
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      {step === 'currency' ? (
        <View style={styles.step}>
          <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.type.title }]}>
            {t('onboarding.welcomeTitle')}
          </Text>
          <Text style={[styles.body, { color: theme.colors.textSecondary, fontSize: theme.type.body }]}>
            {t('onboarding.currencyBody')}
          </Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('onboarding.currencySearch')}
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border, borderRadius: theme.radii.md }]}
          />
          <FlatList
            data={filtered}
            keyExtractor={(c: CurrencyInfo) => c.code}
            style={styles.flex}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setCurrency(item.code)}
                style={[styles.row, { borderColor: theme.colors.border }]}
              >
                <View style={styles.rowText}>
                  <Text style={{ color: theme.colors.text, fontSize: theme.type.body, fontWeight: '600' }}>{item.code}</Text>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: theme.type.caption }}>{item.name}</Text>
                </View>
                <View style={[styles.radio, { borderColor: theme.colors.accent }]}>
                  {currency === item.code ? <View style={[styles.radioDot, { backgroundColor: theme.colors.accent }]} /> : null}
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: 24 }}>
                {t('onboarding.currencyEmpty')}
              </Text>
            }
          />
          <View style={styles.footer}>
            <Button title={t('common.next')} onPress={() => setStep('budgets')} />
          </View>
        </View>
      ) : (
        <View style={styles.step}>
          <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.type.heading }]}>
            {t('onboarding.budgetsTitle')}
          </Text>
          <Text style={[styles.body, { color: theme.colors.textSecondary, fontSize: theme.type.body }]}>
            {t('onboarding.budgetsBody')}
          </Text>
          <FlatList
            data={expenseCategories}
            keyExtractor={(c) => c.id}
            style={styles.flex}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Card style={styles.budgetRow}>
                <View style={styles.rowText}>
                  <CategoryIcon icon={item.icon} color={item.color} />
                  <Text style={{ color: theme.colors.text, fontSize: theme.type.body, marginLeft: 12 }}>
                    {item.nameKey ? t(`categories.${item.nameKey.split('.')[1]}` as never) : item.name}
                  </Text>
                </View>
                <TextInput
                  value={caps[item.id] ?? ''}
                  onChangeText={(v) => setCaps((s) => ({ ...s, [item.id]: v }))}
                  placeholder={t('budgets.capPlaceholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="decimal-pad"
                  style={[styles.capInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border, borderRadius: theme.radii.sm }]}
                />
              </Card>
            )}
          />
          <View style={[styles.footer, { flexDirection: 'row', gap: 12 }]}>
            <Button title={t('common.skip')} variant="ghost" onPress={finish} style={styles.flex} />
            <Button title={t('onboarding.finish')} onPress={finish} style={styles.flex} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  step: { flex: 1, padding: 16, gap: 12 },
  flex: { flex: 1 },
  title: { fontWeight: '800' },
  body: {},
  input: { paddingHorizontal: 14, paddingVertical: 10, borderWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  footer: { paddingTop: 8 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingVertical: 10 },
  capInput: { width: 120, paddingHorizontal: 10, paddingVertical: 8, borderWidth: StyleSheet.hairlineWidth, textAlign: 'right' },
});
