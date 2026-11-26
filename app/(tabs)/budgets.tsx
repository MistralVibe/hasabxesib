import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/theme/ThemeProvider';
import { useI18n } from '@/i18n';
import { useCategoryLabel } from '@/hooks/useCategoryLabel';
import { useShallow } from 'zustand/react/shallow';
import { useDataStore } from '@/stores/useDataStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useFormatters } from '@/hooks/useFormatters';
import { allBudgetsProgress, monthBudgetSummary, spentForCategory } from '@/domain/budgets';
import { budgetStatusColor, budgetStatusLabel } from '@/components/ui/budgetStatus';
import { startOfDayISO, monthKeyOf } from '@/domain/dates';
import { toMinor, minorToInputString } from '@/domain/money';
import { Category } from '@/domain/types';

export default function BudgetsScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const categoryLabel = useCategoryLabel();
  const { money } = useFormatters();
  const currency = useSettingsStore((s) => s.settings.currency);
  const { categories, transactions, budgets, upsertBudget, removeBudget } = useDataStore(
    useShallow((s) => ({
      categories: s.categories, transactions: s.transactions, budgets: s.budgets,
      upsertBudget: s.upsertBudget, removeBudget: s.removeBudget,
    })),
  );

  const c = theme.colors;
  const monthKey = monthKeyOf(startOfDayISO(new Date()));

  const progress = useMemo(
    () => allBudgetsProgress(budgets, transactions, monthKey),
    [budgets, transactions, monthKey],
  );
  const summary = useMemo(() => monthBudgetSummary(budgets, transactions, monthKey), [budgets, transactions, monthKey]);

  const expenseCategories = categories.filter((cat) => cat.type === 'expense');
  const unbudgeted = useMemo(() => {
    const budgetedIds = new Set(budgets.map((b) => b.categoryId));
    return expenseCategories
      .filter((cat) => !budgetedIds.has(cat.id))
      .map((cat) => ({ category: cat, spent: spentForCategory(transactions, cat.id, monthKey) }))
      .filter((x) => x.spent > 0);
  }, [expenseCategories, budgets, transactions, monthKey]);

  const [editing, setEditing] = useState<Category | null>(null);
  const [capInput, setCapInput] = useState('');

  const openEdit = (cat: Category, currentCap?: number) => {
    setEditing(cat);
    setCapInput(currentCap ? minorToInputString(currentCap, useSettingsStore.getState().settings.currency) : '');
  };

  const saveBudget = () => {
    if (!editing) return;
    const minor = toMinor(capInput, currency);
    if (minor === null || minor <= 0) {
      Alert.alert(t('common.error'), t('errors.invalidAmount'));
      return;
    }
    const existing = budgets.find((b) => b.categoryId === editing.id);
    upsertBudget({ id: existing?.id, categoryId: editing.id, amount: minor });
    setEditing(null);
    setCapInput('');
  };

  const confirmDelete = (budgetId: string) => {
    Alert.alert(t('budgets.deleteTitle'), t('budgets.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeBudget(budgetId) },
    ]);
  };


  return (
    <Screen>
      <Text style={[styles.title, { color: c.text, fontSize: theme.type.title }]}>{t('budgets.title')}</Text>

      {budgets.length > 0 ? (
        <Card style={styles.summary}>
          <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>{t('budgets.totalBudget')}</Text>
          <View style={styles.summaryRow}>
            <Text style={{ color: c.text, fontSize: theme.type.heading, fontWeight: '800' }}>
              {money(summary.totalSpent)} / {money(summary.totalBudget)}
            </Text>
            <Text style={{ color: budgetStatusColor(summary.status, { ok: c.income, warning: c.warning, danger: c.danger }), fontWeight: '700', fontSize: theme.type.caption }}>
              {Math.round(summary.ratio * 100)}%
            </Text>
          </View>
          <ProgressBar ratio={summary.ratio} color={budgetStatusColor(summary.status, { ok: c.accent, warning: c.warning, danger: c.danger })} />
        </Card>
      ) : null}

      <SectionTitle title={t('budgets.title')} />
      {budgets.length === 0 && unbudgeted.length === 0 ? (
        <EmptyState icon="pie-chart-outline" title={t('budgets.emptyTitle')} body={t('budgets.emptyBody')} />
      ) : (
        <FlashList
          data={progress}
          keyExtractor={(p) => p.budget.id}
          scrollEnabled={false}
          renderItem={({ item: p }) => {
            const cat = categories.find((x) => x.id === p.budget.categoryId);
            if (!cat) return null;
            return (
              <Pressable onPress={() => openEdit(cat, p.cap)} onLongPress={() => confirmDelete(p.budget.id)}>
                <Card style={styles.row}>
                  <CategoryIcon icon={cat.icon} color={cat.color} />
                  <View style={styles.flex}>
                    <View style={styles.summaryRow}>
                      <Text style={{ color: c.text, fontWeight: '600', fontSize: theme.type.body }}>
                        {cat.nameKey ? categoryLabel(cat) : cat.name}
                      </Text>
                      <Text style={{ color: budgetStatusColor(p.status, { ok: c.income, warning: c.warning, danger: c.danger }), fontSize: theme.type.caption, fontWeight: '700' }}>
                        {budgetStatusLabel(p.status, t)}
                      </Text>
                    </View>
                    <ProgressBar ratio={p.ratio} color={budgetStatusColor(p.status, { ok: c.accent, warning: c.warning, danger: c.danger })} />
                    <Text style={{ color: c.textSecondary, fontSize: theme.type.caption, marginTop: 4 }}>
                      {t('budgets.spentOf', { spent: money(p.spent), cap: money(p.cap) })}
                      {p.status === 'exceeded' ? ` · ${t('budgets.overBy', { amount: money(p.spent - p.cap) })}` : p.status === 'warning' ? '' : ` · ${t('budgets.remaining', { amount: money(p.cap - p.spent) })}`}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            );
          }}
        />
      )}

      {unbudgeted.length > 0 ? (
        <>
          <SectionTitle title={t('common.all')} style={styles.gap} />
          {unbudgeted.map(({ category, spent }) => (
            <Pressable key={category.id} onPress={() => openEdit(category)}>
              <Card style={styles.row}>
                <CategoryIcon icon={category.icon} color={category.color} />
                <View style={styles.flex}>
                  <Text style={{ color: c.text, fontWeight: '600', fontSize: theme.type.body }}>
                    {category.nameKey ? categoryLabel(category) : category.name}
                  </Text>
                  <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>
                    {money(spent)} · {t('home.noBudget')}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </>
      ) : null}

      <Text style={[styles.label, { color: c.textSecondary, fontSize: theme.type.caption, marginTop: 12 }]}>{t('budgets.add')}</Text>
      <View style={styles.chips}>
        {expenseCategories.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => openEdit(cat, budgets.find((b) => b.categoryId === cat.id)?.amount)}
            style={[styles.chip, { borderColor: c.border, backgroundColor: c.surface, borderRadius: theme.radii.full , borderCurve: 'continuous'}]}
          >
            <CategoryIcon icon={cat.icon} color={cat.color} size={16} />
            <Text style={{ color: c.text, fontSize: theme.type.caption, marginLeft: 6 }}>
              {cat.nameKey ? categoryLabel(cat) : cat.name}
            </Text>
          </Pressable>
        ))}
      </View>

      {editing ? (
        <Card style={styles.editor}>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: theme.type.body, marginBottom: 8 }}>
            {editing.nameKey ? categoryLabel(editing) : editing.name}
          </Text>
          <TextInput
            value={capInput}
            onChangeText={setCapInput}
            placeholder={t('budgets.capPlaceholder')}
            placeholderTextColor={c.textSecondary}
            keyboardType="decimal-pad"
            autoFocus
            style={[styles.input, { color: c.text, borderColor: c.border, borderRadius: theme.radii.md, borderCurve: 'continuous', backgroundColor: c.background }]}
          />
          <View style={styles.editorButtons}>
            <Button title={t('common.cancel')} variant="ghost" onPress={() => setEditing(null)} style={styles.flex} />
            <Button title={t('common.save')} onPress={saveBudget} style={styles.flex} />
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '800', marginBottom: 12 },
  summary: { marginBottom: 16, gap: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, paddingVertical: 10 },
  flex: { flex: 1 },
  gap: { marginTop: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderWidth: StyleSheet.hairlineWidth },
  label: { fontWeight: '600' },
  editor: { marginTop: 16, gap: 8 },
  input: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 10 },
  editorButtons: { flexDirection: 'row', gap: 12 },
});
