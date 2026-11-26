import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { useTheme } from '@/theme/ThemeProvider';
import { useI18n } from '@/i18n';
import { useCategoryLabel } from '@/hooks/useCategoryLabel';
import { useShallow } from 'zustand/react/shallow';
import { useDataStore } from '@/stores/useDataStore';
import { useFormatters } from '@/hooks/useFormatters';
import { monthBudgetSummary } from '@/domain/budgets';
import { upcomingOccurrences } from '@/domain/recurring';
import { startOfDayISO, monthKeyOf } from '@/domain/dates';
import { Transaction } from '@/domain/types';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const categoryLabel = useCategoryLabel();
  const { money, signed } = useFormatters();
  const router = useRouter();
  const { accounts, transactions, budgets, recurringRules, totalBalance } = useDataStore(
    useShallow((s) => ({
      accounts: s.accounts,
      transactions: s.transactions,
      budgets: s.budgets,
      recurringRules: s.recurringRules,
      totalBalance: s.totalBalance,
    })),
  );
  const categories = useDataStore((s) => s.categories);

  const monthKey = monthKeyOf(startOfDayISO(new Date()));
  const summary = useMemo(
    () => monthBudgetSummary(budgets, transactions, monthKey),
    [budgets, transactions, monthKey],
  );
  const recent = useMemo(() => transactions.slice(0, 5), [transactions]);
  const today = startOfDayISO(new Date());
  let nextRecurring: { rule: (typeof recurringRules)[number]; next: string; category: (typeof categories)[number] | undefined } | null = null;
  for (const rule of recurringRules) {
    if (!rule.isActive) continue;
    const next = upcomingOccurrences(rule, today, 1)[0];
    if (next && (!nextRecurring || next < nextRecurring.next)) {
      nextRecurring = { rule, next, category: categories.find((c) => c.id === rule.categoryId) };
    }
  }

  const categoryById = (id: string) => categories.find((c) => c.id === id);
  const accountById = (id: string) => accounts.find((a) => a.id === id);

  const c = theme.colors;
  const statusColor = summary.status === 'exceeded' ? c.danger : summary.status === 'warning' ? c.warning : c.accent;
  return (
    <Screen scroll={false} style={styles.screen}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.md, flexGrow: 1 }}>
      <Text style={[styles.title, { color: c.text, fontSize: theme.type.title }]}>{t('home.title')}</Text>

      <LinearGradient
        colors={[c.accent, c.accentDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.balanceCard, theme.shadows.fab, { borderRadius: theme.radii.xl, borderCurve: 'continuous', padding: theme.spacing.lg }]}
      >
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: theme.type.caption, fontWeight: '600' }}>{t('home.totalBalance')}</Text>
        <Text style={{ color: '#FFFFFF', fontSize: theme.type.amount, fontWeight: '800', marginTop: 4 }}>{money(totalBalance())}</Text>
        <View style={styles.monthRow}>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: theme.type.caption }}>
            {t('home.monthSpent')}: {money(summary.totalSpent)}
            {summary.totalBudget > 0 ? ` ${t('home.ofBudget', { amount: money(summary.totalBudget) })}` : ` · ${t('home.noBudget')}`}
          </Text>
        </View>
        {summary.totalBudget > 0 ? (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(summary.ratio, 1) * 100}%`, backgroundColor: statusColor === c.accent ? '#FFFFFF' : statusColor }]} />
          </View>
        ) : null}
      </LinearGradient>

      {transactions.length === 0 ? (
        <EmptyState icon="receipt-outline" title={t('home.emptyTitle')} body={t('home.emptyBody')} />
      ) : (
        <>
          <SectionTitle
            title={t('home.recent')}
            action={t('home.seeAll')}
            onAction={() => router.push('/(tabs)/transactions')}
          />
          <FlashList
            data={recent}
            keyExtractor={(tx: Transaction) => tx.id}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const cat = categoryById(item.categoryId);
              const acc = accountById(item.accountId);
              return (
                <Pressable onPress={() => router.push({ pathname: '/transaction', params: { id: item.id } })}>
                  <Card style={styles.txRow}>
                    {cat ? <CategoryIcon icon={cat.icon} color={cat.color} /> : null}
                    <View style={styles.flex}>
                      <Text style={{ color: c.text, fontSize: theme.type.body, fontWeight: '600' }}>
                        {cat?.nameKey ? categoryLabel(cat) : cat?.name ?? ''}
                      </Text>
                      <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>
                        {acc?.name ?? ''} · {item.date}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: item.type === 'income' ? c.income : c.expense,
                        fontSize: theme.type.body,
                        fontWeight: '700',
                      }}
                    >
                      {signed(item.type === 'income' ? item.amount : -item.amount)}
                    </Text>
                  </Card>
                </Pressable>
              );
            }}
          />

          <SectionTitle
            title={t('home.upcomingRecurring')}
            action={t('home.seeAll')}
            onAction={() => router.push('/recurring')}
          />
          {nextRecurring ? (
            <Pressable onPress={() => router.push('/recurring')}>
            <Card style={styles.txRow}>
              {nextRecurring.category ? <CategoryIcon icon={nextRecurring.category.icon} color={nextRecurring.category.color} /> : null}
              <View style={styles.flex}>
                <Text style={{ color: c.text, fontSize: theme.type.body, fontWeight: '600' }}>{nextRecurring.rule.note || t('recurring.title')}</Text>
                <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>{nextRecurring.next}</Text>
              </View>
              <Text style={{ color: nextRecurring.rule.type === 'income' ? c.income : c.expense, fontWeight: '700' }}>
                {signed(nextRecurring.rule.type === 'income' ? nextRecurring.rule.amount : -nextRecurring.rule.amount)}
              </Text>
            </Card>
            </Pressable>
          ) : (
            <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>{t('home.noUpcoming')}</Text>
          )}
        </>
      )}

      </ScrollView>
      <Pressable
        onPress={() => router.push({ pathname: '/transaction', params: {} })}
        style={[styles.fab, theme.shadows.fab, { backgroundColor: c.accent, borderRadius: theme.radii.full, borderCurve: 'continuous' }]}
        accessibilityRole="button"
        accessibilityLabel={t('home.addTransaction')}
      >
        <Ionicons name="add" size={28} color={c.accentText} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { position: 'relative' },
  title: { fontWeight: '800', marginBottom: 12 },
  balanceCard: { marginBottom: 20, gap: 6 },
  monthRow: { marginTop: 4 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, paddingVertical: 10 },
  flex: { flex: 1 },
  progressTrack: { height: 6, borderRadius: 9999, borderCurve: 'continuous', backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 10, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 9999, borderCurve: 'continuous' },
  fab: {
    position: 'absolute', right: 20, bottom: 24, width: 56, height: 56,
    alignItems: 'center', justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
  },
});
