import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/theme/ThemeProvider';
import { useI18n } from '@/i18n';
import { useDataStore } from '@/stores/useDataStore';
import { useFormatters } from '@/hooks/useFormatters';
import { monthBudgetSummary } from '@/domain/budgets';
import { upcomingOccurrences } from '@/domain/recurring';
import { startOfDayISO, monthKeyOf } from '@/domain/dates';
import { Transaction } from '@/domain/types';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { money, signed } = useFormatters();
  const router = useRouter();
  const { accounts, transactions, budgets, recurringRules, totalBalance, loaded } = useDataStore();
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
    if (next) {
      nextRecurring = { rule, next, category: categories.find((c) => c.id === rule.categoryId) };
      break;
    }
  }

  const categoryById = (id: string) => categories.find((c) => c.id === id);
  const accountById = (id: string) => accounts.find((a) => a.id === id);

  const c = theme.colors;
  const statusColor = summary.status === 'exceeded' ? c.danger : summary.status === 'warning' ? c.warning : c.accent;

  return (
    <Screen>
      <Text style={[styles.title, { color: c.text, fontSize: theme.type.title }]}>{t('home.title')}</Text>

      <Card style={styles.balanceCard}>
        <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>{t('home.totalBalance')}</Text>
        <Text style={{ color: c.text, fontSize: theme.type.title, fontWeight: '800' }}>{money(totalBalance())}</Text>
        <View style={styles.monthRow}>
          <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>
            {t('home.monthSpent')}: {money(summary.totalSpent)}
            {summary.totalBudget > 0 ? ` ${t('home.ofBudget', { amount: money(summary.totalBudget) })}` : ` · ${t('home.noBudget')}`}
          </Text>
        </View>
        {summary.totalBudget > 0 ? <ProgressBar ratio={summary.ratio} color={statusColor} /> : null}
      </Card>

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
                        {cat?.nameKey ? t(`categories.${cat.nameKey.split('.')[1]}` as never) : cat?.name ?? ''}
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

      <Button
        title={t('home.addTransaction')}
        onPress={() => router.push({ pathname: '/transaction', params: {} })}
        style={styles.fab}
      />
      {!loaded ? null : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '800', marginBottom: 12 },
  balanceCard: { marginBottom: 20, gap: 6 },
  monthRow: { marginTop: 4 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, paddingVertical: 10 },
  flex: { flex: 1 },
  fab: { marginTop: 12 },
});
