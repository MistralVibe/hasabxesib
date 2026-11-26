import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { useTheme } from '@/theme/ThemeProvider';
import { useI18n } from '@/i18n';
import { useCategoryLabel } from '@/hooks/useCategoryLabel';
import { useShallow } from 'zustand/react/shallow';
import { useDataStore } from '@/stores/useDataStore';
import { useFormatters } from '@/hooks/useFormatters';
import { monthKeyOf } from '@/domain/dates';
import { Transaction } from '@/domain/types';

type ListItem = { kind: 'header'; date: string } | { kind: 'tx'; tx: Transaction };

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const categoryLabel = useCategoryLabel();
  const { signed } = useFormatters();
  const router = useRouter();
  const { transactions, categories, accounts } = useDataStore(
    useShallow((s) => ({ transactions: s.transactions, categories: s.categories, accounts: s.accounts })),
  );

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');

  const c = theme.colors;

  const months = useMemo(() => {
    const set = new Set(transactions.map((tx) => monthKeyOf(tx.date)));
    return [...set].sort().reverse();
  }, [transactions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;
      if (accountFilter !== 'all' && tx.accountId !== accountFilter) return false;
      if (monthFilter !== 'all' && monthKeyOf(tx.date) !== monthFilter) return false;
      if (q) {
        const cat = categories.find((x) => x.id === tx.categoryId);
        const acc = accounts.find((x) => x.id === tx.accountId);
        const hay = `${tx.note} ${cat?.name ?? ''} ${acc?.name ?? ''} ${tx.amount}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, query, typeFilter, categoryFilter, accountFilter, monthFilter, categories, accounts]);

  const listData = useMemo<ListItem[]>(() => {
    const out: ListItem[] = [];
    let lastDate = '';
    for (const tx of filtered) {
      if (tx.date !== lastDate) {
        lastDate = tx.date;
        out.push({ kind: 'header', date: tx.date });
      }
      out.push({ kind: 'tx', tx });
    }
    return out;
  }, [filtered]);

  const catById = (id: string) => categories.find((x) => x.id === id);
  const accById = (id: string) => accounts.find((x) => x.id === id);

  const chip = (label: string, active: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: active ? c.accent : c.border, backgroundColor: active ? c.accentSoft : c.surface, borderRadius: theme.radii.full , borderCurve: 'continuous'},
      ]}
    >
      <Text style={{ color: active ? c.accent : c.text, fontSize: theme.type.caption, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );

  return (
    <Screen scroll={false} style={styles.screen}>
      <Text style={[styles.title, { color: c.text, fontSize: theme.type.title }]}>{t('transactions.title')}</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('transactions.searchPlaceholder')}
        placeholderTextColor={c.textSecondary}
        style={[styles.search, { backgroundColor: c.surface, color: c.text, borderColor: c.border, borderRadius: theme.radii.md , borderCurve: 'continuous'}]}
      />
      <View style={styles.filters}>
        {chip(t('common.all'), typeFilter === 'all', () => setTypeFilter('all'))}
        {chip(t('common.income'), typeFilter === 'income', () => setTypeFilter(typeFilter === 'income' ? 'all' : 'income'))}
        {chip(t('common.expense'), typeFilter === 'expense', () => setTypeFilter(typeFilter === 'expense' ? 'all' : 'expense'))}
        {chip(t('common.all'), monthFilter === 'all', () => setMonthFilter('all'))}
        {months.slice(0, 6).map((m) => chip(m, monthFilter === m, () => setMonthFilter(monthFilter === m ? 'all' : m)))}
      </View>
      <View style={styles.filters}>
        {chip(t('transactions.allCategories'), categoryFilter === 'all', () => setCategoryFilter('all'))}
        {categories.slice(0, 8).map((cat) =>
          chip(cat.nameKey ? categoryLabel(cat) : cat.name, categoryFilter === cat.id, () =>
            setCategoryFilter(categoryFilter === cat.id ? 'all' : cat.id)),
        )}
      </View>
      <View style={styles.filters}>
        {chip(t('transactions.allAccounts'), accountFilter === 'all', () => setAccountFilter('all'))}
        {accounts.map((a) => chip(a.name, accountFilter === a.id, () => setAccountFilter(accountFilter === a.id ? 'all' : a.id)))}
      </View>

      <FlashList
        data={listData}
        getItemType={(item: ListItem) => item.kind}
        keyExtractor={(item: ListItem) => (item.kind === 'header' ? `h-${item.date}` : item.tx.id)}
        renderItem={({ item }: { item: ListItem }) => {
          if (item.kind === 'header') {
            return <Text style={[styles.header, { color: c.textSecondary, fontSize: theme.type.caption }]}>{item.date}</Text>;
          }
          const { tx } = item;
          const cat = catById(tx.categoryId);
          const acc = accById(tx.accountId);
          return (
            <Pressable onPress={() => router.push({ pathname: '/transaction', params: { id: tx.id } })}>
              <Card style={styles.txRow}>
                {cat ? <CategoryIcon icon={cat.icon} color={cat.color} /> : null}
                <View style={styles.flex}>
                  <Text style={{ color: c.text, fontSize: theme.type.body, fontWeight: '600' }} numberOfLines={1}>
                    {cat?.nameKey ? categoryLabel(cat) : cat?.name ?? ''}
                    {tx.note ? ` · ${tx.note}` : ''}
                  </Text>
                  <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>{acc?.name ?? ''}</Text>
                </View>
                <Text style={{ color: tx.type === 'income' ? c.income : c.expense, fontWeight: '700', fontSize: theme.type.body }}>
                  {signed(tx.type === 'income' ? tx.amount : -tx.amount)}
                </Text>
              </Card>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title={query || typeFilter !== 'all' || categoryFilter !== 'all' || accountFilter !== 'all' || monthFilter !== 'all' ? t('transactions.noResultsTitle') : t('transactions.emptyTitle')}
            body={t('transactions.emptyBody')}
          />
        }
      />

      <Pressable
        onPress={() => router.push({ pathname: '/transaction', params: {} })}
        style={[styles.fab, { backgroundColor: c.accent, borderRadius: theme.radii.full , borderCurve: 'continuous'}]}
        accessibilityRole="button"
      >
        <Ionicons name="add" size={28} color={c.accentText} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { position: 'relative' },
  title: { fontWeight: '800', marginBottom: 12 },
  search: { paddingHorizontal: 14, paddingVertical: 10, borderWidth: StyleSheet.hairlineWidth, marginBottom: 8 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderWidth: StyleSheet.hairlineWidth },
  header: { fontWeight: '700', marginTop: 10, marginBottom: 4, paddingHorizontal: 4 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, paddingVertical: 10 },
  flex: { flex: 1 },
  fab: {
    position: 'absolute', right: 20, bottom: 20, width: 56, height: 56,
    alignItems: 'center', justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
  },
});
