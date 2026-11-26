import React, { useMemo, useState } from 'react';
import {
  Alert, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { useTheme } from '@/theme/ThemeProvider';
import { useI18n } from '@/i18n';
import { useShallow } from 'zustand/react/shallow';
import { useDataStore } from '@/stores/useDataStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useFormatters } from '@/hooks/useFormatters';
import { parseAmountInput, toMinor, minorToInputString } from '@/domain/money';
import { nextDueAfter, parseISODate, startOfDayISO, toISODate } from '@/domain/dates';
import { upcomingOccurrences } from '@/domain/recurring';
import { RecurringFrequency, RecurringRule, TransactionType } from '@/domain/types';

const FREQUENCIES: RecurringFrequency[] = ['daily', 'weekly', 'monthly', 'yearly'];

const FREQUENCY_LABEL_KEY = {
  daily: 'recurring.daily',
  weekly: 'recurring.weekly',
  monthly: 'recurring.monthly',
  yearly: 'recurring.yearly',
} as const;

/** Occurrences shown per rule in the scheduled queue. */
const QUEUE_SIZE = 3;

function isValidISODate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  return toISODate(parseISODate(iso)) === iso;
}

/** A rule's not-yet-posted occurrences, starting from its next due date. */
function queueFor(rule: RecurringRule, today: string): string[] {
  return upcomingOccurrences(rule, today, QUEUE_SIZE);
}

function RuleForm({ existing, onClose }: { existing?: RecurringRule; onClose: () => void }) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { money } = useFormatters();
  const { accounts, categories, addRecurringRule, updateRecurringRule, removeRecurringRule } = useDataStore(
    useShallow((s) => ({
      accounts: s.accounts, categories: s.categories, addRecurringRule: s.addRecurringRule,
      updateRecurringRule: s.updateRecurringRule, removeRecurringRule: s.removeRecurringRule,
    })),
  );

  const [type, setType] = useState<TransactionType>(existing?.type ?? 'expense');
  const [amountInput, setAmountInput] = useState(existing ? minorToInputString(existing.amount, useSettingsStore.getState().settings.currency) : '');
  const [categoryId, setCategoryId] = useState<string | undefined>(existing?.categoryId);
  const [accountId, setAccountId] = useState<string | undefined>(existing?.accountId ?? accounts[0]?.id);
  const [note, setNote] = useState(existing?.note ?? '');
  const [frequency, setFrequency] = useState<RecurringFrequency>(existing?.frequency ?? 'monthly');
  const [startDate, setStartDate] = useState(existing?.startDate ?? startOfDayISO(new Date()));
  const [error, setError] = useState('');

  const c = theme.colors;
  const visibleCategories = useMemo(() => categories.filter((cat) => cat.type === type), [categories, type]);
  const amount = parseAmountInput(amountInput);

  const save = () => {
    setError('');
    if (!accountId) { setError(t('errors.noAccounts')); return; }
    if (!categoryId) { setError(t('errors.required')); return; }
    const currency = useSettingsStore.getState().settings.currency;
    const amountMinor = toMinor(amountInput, currency);
    if (amountMinor === null || amountMinor <= 0) { setError(t('errors.invalidAmount')); return; }
    if (!isValidISODate(startDate)) { setError(t('errors.invalidDate')); return; }

    if (existing) {
      const patch: Partial<RecurringRule> = { accountId, categoryId, type, amount: amountMinor, note, frequency, startDate };
      // A shifted schedule restarts the queue; skipped dates belonged to the old one.
      if (startDate !== existing.startDate || frequency !== existing.frequency) {
        patch.nextDueDate = nextDueAfter(startDate, frequency, startOfDayISO(new Date())) ?? startDate;
        patch.skippedDates = [];
      }
      updateRecurringRule(existing.id, patch);
    } else {
      addRecurringRule({
        accountId,
        categoryId,
        type,
        amount: amountMinor,
        note,
        frequency,
        startDate,
        nextDueDate: startDate,
        skippedDates: [],
        isActive: true,
      });
    }
    onClose();
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert(t('recurring.deleteTitle'), t('recurring.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          removeRecurringRule(existing.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <View style={{ gap: 12 }}>
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
                borderRadius: theme.radii.md, borderCurve: 'continuous',
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
        placeholder={t('common.amount')}
        placeholderTextColor={c.textSecondary}
        keyboardType="decimal-pad"
        style={[styles.bigInput, { color: c.text, borderColor: c.border, borderRadius: theme.radii.md, borderCurve: 'continuous', fontSize: theme.type.title }]}
      />
      {amount !== null ? (
        <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>
          ≈ {money(toMinor(amountInput, useSettingsStore.getState().settings.currency) ?? 0)}
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
              {
                borderColor: categoryId === cat.id ? cat.color : c.border,
                backgroundColor: categoryId === cat.id ? `${cat.color}22` : c.surface,
                borderRadius: theme.radii.full, borderCurve: 'continuous',
              },
            ]}
          >
            <CategoryIcon icon={cat.icon} color={cat.color} size={16} />
            <Text style={{ color: c.text, fontSize: theme.type.caption, marginLeft: 6 }}>
              {cat.nameKey ? t(cat.nameKey as never) : cat.name}
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
              {
                borderColor: accountId === a.id ? c.accent : c.border,
                backgroundColor: accountId === a.id ? c.accentSoft : c.surface,
                borderRadius: theme.radii.full, borderCurve: 'continuous',
              },
            ]}
          >
            <Text style={{ color: c.text, fontSize: theme.type.caption }}>{a.name}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, { color: c.textSecondary, fontSize: theme.type.caption }]}>{t('recurring.frequency')}</Text>
      <View style={styles.chips}>
        {FREQUENCIES.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFrequency(f)}
            style={[
              styles.chip,
              {
                borderColor: frequency === f ? c.accent : c.border,
                backgroundColor: frequency === f ? c.accentSoft : c.surface,
                borderRadius: theme.radii.full, borderCurve: 'continuous',
              },
            ]}
          >
            <Text style={{ color: c.text, fontSize: theme.type.caption }}>{t(FREQUENCY_LABEL_KEY[f])}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={t('common.note')}
        placeholderTextColor={c.textSecondary}
        style={[styles.input, { color: c.text, borderColor: c.border, borderRadius: theme.radii.md, borderCurve: 'continuous', backgroundColor: c.surface }]}
      />

      <Text style={[styles.label, { color: c.textSecondary, fontSize: theme.type.caption }]}>{t('recurring.startDate')}</Text>
      <TextInput
        value={startDate}
        onChangeText={setStartDate}
        placeholder="yyyy-mm-dd"
        placeholderTextColor={c.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.input, { color: c.text, borderColor: c.border, borderRadius: theme.radii.md, borderCurve: 'continuous', backgroundColor: c.surface }]}
      />

      {error ? <Text style={{ color: c.danger, fontSize: theme.type.body }}>{error}</Text> : null}

      <Button title={t('common.save')} onPress={save} />
      {existing ? <Button title={t('common.delete')} variant="danger" onPress={confirmDelete} /> : null}
      <Button title={t('common.cancel')} variant="ghost" onPress={onClose} />
    </View>
  );
}

export default function RecurringScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useI18n();
  const { signed } = useFormatters();
  const { recurringRules, categories, accounts, skipRecurringOccurrence } = useDataStore(
    useShallow((s) => ({
      recurringRules: s.recurringRules, categories: s.categories, accounts: s.accounts,
      skipRecurringOccurrence: s.skipRecurringOccurrence,
    })),
  );

  const [formMode, setFormMode] = useState<{ open: boolean; id?: string }>({ open: false });

  const c = theme.colors;
  const today = startOfDayISO(new Date());

  const categoryById = (id: string) => categories.find((cat) => cat.id === id);
  const accountById = (id: string) => accounts.find((a) => a.id === id);

  const editing = formMode.id ? recurringRules.find((r) => r.id === formMode.id) : undefined;

  const openForm = (id?: string) => setFormMode({ open: true, id });
  const closeForm = () => setFormMode({ open: false });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={{ color: c.text, fontSize: theme.type.title, fontWeight: '800' }}>{t('recurring.title')}</Text>
        <Pressable
          onPress={() => (formMode.open ? closeForm() : openForm())}
          accessibilityRole="button"
          style={[styles.headerAction, { borderColor: c.border, borderRadius: theme.radii.full, borderCurve: 'continuous', backgroundColor: c.surface }]}
        >
          <Ionicons name={formMode.open ? 'close' : 'add'} size={20} color={c.accent} />
        </Pressable>
      </View>

      {formMode.open ? (
        <RuleForm key={editing?.id ?? 'new'} existing={editing} onClose={closeForm} />
      ) : (
        <>
          {recurringRules.length === 0 ? (
            <EmptyState icon="repeat-outline" title={t('recurring.emptyTitle')} body={t('recurring.emptyBody')} />
          ) : (
            <>
              <SectionTitle title={t('recurring.rules')} action={t('recurring.add')} onAction={() => openForm()} />
              {recurringRules.map((rule) => {
                const category = categoryById(rule.categoryId);
                const account = accountById(rule.accountId);
                const queue = rule.isActive ? queueFor(rule, today) : [];
                return (
                  <Card key={rule.id} style={styles.ruleCard}>
                    <Pressable onPress={() => openForm(rule.id)} style={styles.ruleRow}>
                      {category ? <CategoryIcon icon={category.icon} color={category.color} /> : null}
                      <View style={styles.flex}>
                        <Text style={{ color: c.text, fontSize: theme.type.body, fontWeight: '600' }}>
                          {rule.note || (category?.nameKey ? t(category.nameKey as never) : category?.name ?? t('recurring.title'))}
                        </Text>
                        <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>
                          {t(FREQUENCY_LABEL_KEY[rule.frequency])}
                          {account ? ` · ${account.name}` : ''}
                          {' · '}
                          {t('recurring.nextOn', { date: rule.nextDueDate })}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: rule.type === 'income' ? c.income : c.expense,
                          fontSize: theme.type.body,
                          fontWeight: '700',
                        }}
                      >
                        {signed(rule.type === 'income' ? rule.amount : -rule.amount)}
                      </Text>
                    </Pressable>

                    <View style={[styles.queue, { borderTopColor: c.border }]}>
                      <Text style={{ color: c.textSecondary, fontSize: theme.type.caption, fontWeight: '600' }}>
                        {t('recurring.upcoming')}
                      </Text>
                      {queue.length === 0 ? (
                        <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>{t('recurring.emptyUpcoming')}</Text>
                      ) : (
                        queue.map((date) => (
                          <View key={date} style={styles.queueRow}>
                            <Text style={{ color: c.text, fontSize: theme.type.caption }}>
                              {t('recurring.dueOn', { date })}
                            </Text>
                            <Pressable
                              onPress={() => skipRecurringOccurrence(rule.id, date)}
                              accessibilityRole="button"
                              hitSlop={8}
                            >
                              <Text style={{ color: c.accent, fontSize: theme.type.caption, fontWeight: '600' }}>
                                {t('recurring.skip')}
                              </Text>
                            </Pressable>
                          </View>
                        ))
                      )}
                    </View>
                  </Card>
                );
              })}
            </>
          )}
          <Button title={t('common.close')} variant="ghost" onPress={() => router.back()} style={styles.close} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerAction: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  ruleCard: { marginBottom: 12, padding: 14, gap: 10 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  queue: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 6 },
  queueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flex: { flex: 1 },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
  bigInput: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 14, fontWeight: '800', textAlign: 'center' },
  input: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 10 },
  label: { marginTop: 4, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderWidth: StyleSheet.hairlineWidth },
  close: { marginTop: 8 },
});
