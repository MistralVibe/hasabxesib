import React, { useMemo, useState } from 'react';
import {
  Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { useI18n } from '@/i18n';
import { useDataStore } from '@/stores/useDataStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useFormatters } from '@/hooks/useFormatters';
import { parseAmountInput, toMinor } from '@/domain/money';
import { startOfDayISO } from '@/domain/dates';
import { TransactionType } from '@/domain/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

export default function TransactionModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useI18n();
  const { money } = useFormatters();
  const { accounts, categories, transactions, addTransaction, updateTransaction, removeTransaction } = useDataStore();

  const existing = id ? transactions.find((tx) => tx.id === id) : undefined;

  const [type, setType] = useState<TransactionType>(existing?.type ?? 'expense');
  const [amountInput, setAmountInput] = useState(existing ? (existing.amount / 100).toFixed(2) : '');
  const [categoryId, setCategoryId] = useState<string | undefined>(existing?.categoryId);
  const [accountId, setAccountId] = useState<string | undefined>(existing?.accountId ?? accounts[0]?.id);
  const [note, setNote] = useState(existing?.note ?? '');
  const [date, setDate] = useState(existing?.date ?? startOfDayISO(new Date()));
  const [error, setError] = useState('');

  const c = theme.colors;
  const visibleCategories = useMemo(() => categories.filter((cat) => cat.type === type), [categories, type]);
  const amount = parseAmountInput(amountInput);

  const save = () => {
    setError('');
    if (!accountId) { setError(t('errors.noAccounts')); return; }
    if (!categoryId) { setError(t('transactions.selectCategory')); return; }
    const currency = useSettingsStore.getState().settings.currency;
    const minorUnits = toMinor(amountInput, currency);
    if (minorUnits === null || minorUnits <= 0) { setError(t('errors.invalidAmount')); return; }
    const input = { accountId, categoryId, type, amount: minorUnits, note, date };
    const result = existing ? updateTransaction(existing.id, input) : addTransaction(input);
    if (!result.ok) { setError(result.error); return; }
    router.back();
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert(t('transactions.deleteTitle'), t('transactions.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          removeTransaction(existing.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.md, gap: 12 }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: c.text, fontSize: theme.type.heading, fontWeight: '800' }}>
          {existing ? t('transactions.edit') : t('transactions.add')}
        </Text>

        <View style={styles.segmentRow}>
          {(['expense', 'income'] as const).map((opt) => (
            <Pressable
              key={opt}
              onPress={() => { setType(opt); setCategoryId(undefined); }}
              style={[
                styles.segment,
                {
                  backgroundColor: type === opt ? (opt === 'income' ? c.income : c.expense) : c.surface,
                  borderColor: c.border,
                  borderRadius: theme.radii.md,
                },
              ]}
            >
              <Text style={{ color: type === opt ? '#FFFFFF' : c.text, fontWeight: '700', fontSize: theme.type.body }}>
                {t(opt === 'income' ? 'common.income' : 'common.expense')}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={amountInput}
          onChangeText={setAmountInput}
          placeholder={t('transactions.amountPlaceholder')}
          placeholderTextColor={c.textSecondary}
          keyboardType="decimal-pad"
          autoFocus={!existing}
          style={[styles.bigInput, { color: c.text, borderColor: c.border, borderRadius: theme.radii.md, fontSize: theme.type.title }]}
        />
        {amount !== null ? (
          <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>
            ≈ {money(Math.round(amount * 100))}
          </Text>
        ) : null}

        <Text style={[styles.label, { color: c.textSecondary, fontSize: theme.type.caption }]}>{t('common.category')}</Text>
        <View style={styles.chips}>
          {visibleCategories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setCategoryId(cat.id)}
              style={[
                styles.chip,
                { borderColor: categoryId === cat.id ? cat.color : c.border, backgroundColor: categoryId === cat.id ? `${cat.color}22` : c.surface, borderRadius: theme.radii.full },
              ]}
            >
              <CategoryIcon icon={cat.icon} color={cat.color} size={16} />
              <Text style={{ color: c.text, fontSize: theme.type.caption, marginLeft: 6 }}>
                {cat.nameKey ? t(`categories.${cat.nameKey.split('.')[1]}` as never) : cat.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: c.textSecondary, fontSize: theme.type.caption }]}>{t('common.account')}</Text>
        <View style={styles.chips}>
          {accounts.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => setAccountId(a.id)}
              style={[
                styles.chip,
                { borderColor: accountId === a.id ? c.accent : c.border, backgroundColor: accountId === a.id ? c.accentSoft : c.surface, borderRadius: theme.radii.full },
              ]}
            >
              <Text style={{ color: c.text, fontSize: theme.type.caption }}>{a.name}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={t('transactions.notePlaceholder')}
          placeholderTextColor={c.textSecondary}
          style={[styles.input, { color: c.text, borderColor: c.border, borderRadius: theme.radii.md, backgroundColor: c.surface }]}
        />
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="yyyy-mm-dd"
          placeholderTextColor={c.textSecondary}
          autoCapitalize="none"
          style={[styles.input, { color: c.text, borderColor: c.border, borderRadius: theme.radii.md, backgroundColor: c.surface }]}
        />

        {error ? <Text style={{ color: c.danger, fontSize: theme.type.body }}>{error}</Text> : null}

        <Button title={t('common.save')} onPress={save} />
        {existing ? <Button title={t('common.delete')} variant="danger" onPress={confirmDelete} /> : null}
        <Button title={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
  bigInput: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 14, fontWeight: '800', textAlign: 'center' },
  input: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 10 },
  label: { marginTop: 4, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderWidth: StyleSheet.hairlineWidth },
});
