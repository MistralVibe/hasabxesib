import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { BudgetRing } from '@/components/ui/BudgetRing';
import { useTheme } from '@/theme/ThemeProvider';
import { TranslationPath, useI18n } from '@/i18n';
import { useCategoryLabel } from '@/hooks/useCategoryLabel';
import { useCountUp } from '@/hooks/useCountUp';
import { useShallow } from 'zustand/react/shallow';
import { useDataStore } from '@/stores/useDataStore';
import { useFormatters } from '@/hooks/useFormatters';
import { formatAmount } from '@/domain/money';
import { monthBudgetSummary } from '@/domain/budgets';
import { netInMonth } from '@/domain/transactions';
import { upcomingOccurrences } from '@/domain/recurring';
import { parseISODate, monthKeyOf, startOfDayISO, timeOfDayBucket, TimeOfDay } from '@/domain/dates';
import { Transaction } from '@/domain/types';

const HERO_RADIUS = 36;
const RING_SIZE = 104;
const RING_THICKNESS = 10;
const COUNT_UP_MS = 900;

const GREETING_KEYS: Record<TimeOfDay, TranslationPath> = {
  night: 'home.greetingNight',
  morning: 'home.greetingMorning',
  afternoon: 'home.greetingAfternoon',
  evening: 'home.greetingEvening',
};

// Hermes-safe date formatting: Intl.DateTimeFormat is available, Intl.DisplayNames
// and Intl.supportedValuesOf are not — never touch those at runtime.
const dateFmtCache = new Map<string, Intl.DateTimeFormat>();
function dateLabel(iso: string, locale: string, style: 'long' | 'short'): string {
  const key = `${locale}:${style}`;
  let fmt = dateFmtCache.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: style });
    dateFmtCache.set(key, fmt);
  }
  return fmt.format(parseISODate(iso));
}

/** Group header for the Home lists — quieter than a page title. */
function GroupHeader({ title, action, onAction, color, accent }: { title: string; action: string; onAction: () => void; color: string; accent: string }) {
  return (
    <View style={styles.groupHeader}>
      <Text style={[styles.groupTitle, { color }]}>{title}</Text>
      <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={action} hitSlop={8}>
        <Text style={[styles.groupAction, { color: accent }]}>{action}</Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const categoryLabel = useCategoryLabel();
  const { money, signed, currency, locale } = useFormatters();
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

  // One clock read per mount, so the greeting and the month key stay consistent.
  const [today] = useState(() => startOfDayISO(new Date()));
  const [greetingBucket] = useState<TimeOfDay>(() => timeOfDayBucket(new Date()));
  const monthKey = monthKeyOf(today);

  const summary = useMemo(
    () => monthBudgetSummary(budgets, transactions, monthKey),
    [budgets, transactions, monthKey],
  );
  const net = useMemo(() => netInMonth(transactions, monthKey), [transactions, monthKey]);
  const recent = useMemo(() => transactions.slice(0, 5), [transactions]);
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

  const balance = totalBalance();
  const animatedBalance = useCountUp(balance, COUNT_UP_MS);

  const c = theme.colors;
  const isDark = theme.scheme === 'dark';
  // Sky colors are fixed by the gradient, so the hero owns its own palette.
  const onSky = isDark ? '#F1F0FF' : '#171935';
  const onSkyMuted = isDark ? 'rgba(241,240,255,0.66)' : 'rgba(23,25,53,0.62)';
  const onSkyTrack = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(23,25,53,0.12)';
  const auroraA = isDark ? 'rgba(129,140,248,0.40)' : 'rgba(99,102,241,0.22)';
  const auroraB = isDark ? 'rgba(192,132,252,0.32)' : 'rgba(168,85,247,0.18)';

  const ringRatio = summary.totalBudget > 0 ? Math.min(summary.totalSpent / summary.totalBudget, 1) : 0;
  const percentUsed = summary.totalBudget > 0 ? Math.round((summary.totalSpent / summary.totalBudget) * 100) : 0;
  const remaining = summary.totalBudget - summary.totalSpent;
  const budgetStateColor = summary.totalBudget === 0 ? c.textSecondary : remaining < 0 ? c.danger : c.text;
  const deltaColor = net > 0 ? c.income : net < 0 ? c.expense : onSkyMuted;
  const deltaBackground = net > 0 ? `${c.income}2E` : net < 0 ? `${c.expense}2E` : 'transparent';
  const deltaIcon = net > 0 ? 'caret-up' : net < 0 ? 'caret-down' : 'remove';

  return (
    <Screen scroll={false} style={styles.screen} background={c.skyGradient[0]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={theme.colors.skyGradient}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.sky}
        >
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', auroraA, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.aurora, styles.auroraA]}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', auroraB, 'transparent']}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={[styles.aurora, styles.auroraB]}
          />

          <View style={styles.heroTop}>
            <Text numberOfLines={1} style={[styles.greeting, { color: onSky }]}>
              {t(GREETING_KEYS[greetingBucket])} · {dateLabel(today, locale, 'long')}
            </Text>
            <View style={[styles.currencyChip, { borderColor: onSkyMuted }]}>
              <Text style={[styles.currencyChipText, { color: onSky }]}>{currency}</Text>
            </View>
          </View>

          <Text style={[styles.heroCaption, { color: onSkyMuted }]}>{t('home.totalBalance').toUpperCase()}</Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            accessibilityLabel={`${t('home.totalBalance')} ${money(balance)}`}
            style={[styles.heroBalance, { color: onSky }]}
          >
            {formatAmount(animatedBalance, currency, locale)}
          </Text>

          <View style={[styles.delta, { backgroundColor: deltaBackground }]}>
            <Ionicons name={deltaIcon} size={11} color={deltaColor} />
            <Text style={[styles.deltaText, { color: deltaColor }]}>
              {t('home.thisMonth', { amount: signed(net) })}
            </Text>
          </View>

          <View style={styles.heroRow}>
            <View style={styles.flex}>
              <Text numberOfLines={1} style={[styles.heroCaption, { color: onSkyMuted }]}>
                {t('home.monthSpent').toUpperCase()}
              </Text>
              <Text numberOfLines={1} style={[styles.heroSpent, { color: onSky }]}>
                {money(summary.totalSpent)}
              </Text>
              <Text numberOfLines={1} style={[styles.heroOf, { color: onSkyMuted }]}>
                {summary.totalBudget > 0 ? t('home.ofBudget', { amount: money(summary.totalBudget) }) : t('home.noBudget')}
              </Text>
            </View>
            <BudgetRing
              ratio={ringRatio}
              size={RING_SIZE}
              thickness={RING_THICKNESS}
              from={c.accent}
              to={c.accent2}
              trackColor={onSkyTrack}
              label={`${percentUsed}%`}
              caption={t('home.ofBudgetLabel')}
              labelColor={onSky}
              captionColor={onSkyMuted}
            />
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <Card style={styles.budgetCard}>
            <Text style={[styles.cardCaption, { color: c.textSecondary }]}>{t('budgets.totalBudget')}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.cardBig, { color: budgetStateColor }]}>
              {summary.totalBudget > 0
                ? remaining >= 0
                  ? t('budgets.remaining', { amount: money(remaining) })
                  : t('budgets.overBy', { amount: money(-remaining) })
                : t('home.noBudget')}
            </Text>
            <View style={[styles.barTrack, { backgroundColor: c.border }]}>
              <LinearGradient
                colors={[c.accent, c.accent2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.barFill, { width: `${ringRatio * 100}%` }]}
              />
            </View>
            <View style={styles.barMeta}>
              <Text style={[styles.barMetaText, { color: c.textSecondary }]}>
                {summary.totalBudget > 0
                  ? t('budgets.spentOf', { spent: money(summary.totalSpent), limit: money(summary.totalBudget) })
                  : `${t('budgets.totalSpent')}: ${money(summary.totalSpent)}`}
              </Text>
              {summary.totalBudget > 0 ? (
                <Text style={[styles.barMetaText, { color: c.textSecondary }]}>{t('budgets.percentUsed', { percent: percentUsed })}</Text>
              ) : null}
            </View>
          </Card>

          {transactions.length === 0 ? (
            <EmptyState icon="receipt-outline" title={t('home.emptyTitle')} body={t('home.emptyBody')} />
          ) : (
            <>
              <GroupHeader
                title={t('home.recent')}
                action={t('home.seeAll')}
                onAction={() => router.push('/(tabs)/transactions')}
                color={c.text}
                accent={c.accent}
              />
              <View style={[styles.group, { backgroundColor: c.surface, borderColor: c.border }]}>
                {recent.map((item: Transaction, index) => {
                  const cat = categoryById(item.categoryId);
                  const acc = accountById(item.accountId);
                  const isLast = index === recent.length - 1;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => router.push({ pathname: '/transaction', params: { id: item.id } })}
                      accessibilityRole="button"
                      accessibilityLabel={cat?.nameKey ? categoryLabel(cat) : cat?.name ?? ''}
                      style={({ pressed }) => [
                        styles.row,
                        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
                        pressed && styles.rowPressed,
                      ]}
                    >
                      {cat ? <CategoryIcon icon={cat.icon} color={cat.color} /> : null}
                      <View style={styles.flex}>
                        <Text numberOfLines={1} style={[styles.rowTitle, { color: c.text }]}>
                          {cat?.nameKey ? categoryLabel(cat) : cat?.name ?? ''}
                        </Text>
                        <Text numberOfLines={1} style={[styles.rowSub, { color: c.textSecondary }]}>
                          {acc?.name ?? ''} · {dateLabel(item.date, locale, 'short')}
                        </Text>
                      </View>
                      <Text style={[styles.rowAmount, { color: item.type === 'income' ? c.income : c.expense }]}>
                        {signed(item.type === 'income' ? item.amount : -item.amount)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <GroupHeader
                title={t('home.upcomingRecurring')}
                action={t('home.seeAll')}
                onAction={() => router.push('/recurring')}
                color={c.text}
                accent={c.accent}
              />
              {nextRecurring ? (
                <Pressable
                  onPress={() => router.push('/recurring')}
                  accessibilityRole="button"
                  accessibilityLabel={nextRecurring.rule.note || t('recurring.title')}
                  style={({ pressed }) => [
                    styles.group,
                    styles.singleRowGroup,
                    { backgroundColor: c.surface, borderColor: c.border },
                    pressed && styles.rowPressed,
                  ]}
                >
                  {nextRecurring.category ? <CategoryIcon icon={nextRecurring.category.icon} color={nextRecurring.category.color} /> : null}
                  <View style={styles.flex}>
                    <Text numberOfLines={1} style={[styles.rowTitle, { color: c.text }]}>
                      {nextRecurring.rule.note || t('recurring.title')}
                    </Text>
                    <Text style={[styles.rowSub, { color: c.textSecondary }]}>{t('recurring.dueOn', { date: dateLabel(nextRecurring.next, locale, 'long') })}</Text>
                  </View>
                  <Text style={[styles.rowAmount, { color: nextRecurring.rule.type === 'income' ? c.income : c.expense }]}>
                    {signed(nextRecurring.rule.type === 'income' ? nextRecurring.rule.amount : -nextRecurring.rule.amount)}
                  </Text>
                </Pressable>
              ) : (
                <Text style={[styles.rowSub, { color: c.textSecondary }]}>{t('home.noUpcoming')}</Text>
              )}
            </>
          )}
        </View>
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
  screen: { padding: 0 },
  scrollContent: { flexGrow: 1, paddingBottom: 96 },
  flex: { flex: 1 },

  // — dusk sky hero —
  sky: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 26,
    borderBottomLeftRadius: HERO_RADIUS,
    borderBottomRightRadius: HERO_RADIUS,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  // Aurora washes are wide gradient bands that bleed past the sky's side edges and
  // fade to transparent top and bottom, so no hard boundary is ever visible
  // (a blurred radial glow would need expo-blur, banned by ADR-0005).
  aurora: { position: 'absolute', left: -70, right: -70 },
  auroraA: { height: 300, top: -70, transform: [{ rotate: '-12deg' }] },
  auroraB: { height: 250, bottom: -60, transform: [{ rotate: '9deg' }] },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  greeting: { flex: 1, fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  currencyChip: { borderWidth: 1, borderRadius: 9999, borderCurve: 'continuous', paddingHorizontal: 10, paddingVertical: 3 },
  currencyChipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  heroCaption: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginTop: 22 },
  heroBalance: { fontSize: 52, fontWeight: '800', letterSpacing: -2, lineHeight: 58, marginTop: 4, fontVariant: ['tabular-nums'] },
  delta: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, borderCurve: 'continuous' },
  deltaText: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 22 },
  heroSpent: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginTop: 5, fontVariant: ['tabular-nums'] },
  heroOf: { fontSize: 13, marginTop: 3, fontVariant: ['tabular-nums'] },

  // — quiet content below the sky —
  body: { paddingHorizontal: 16 },
  budgetCard: { marginTop: 18, paddingHorizontal: 20, paddingVertical: 18, borderRadius: 24, borderCurve: 'continuous' },
  cardCaption: { fontSize: 12, fontWeight: '600' },
  cardBig: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginTop: 3, fontVariant: ['tabular-nums'] },
  barTrack: { height: 8, marginTop: 14, borderRadius: 9999, borderCurve: 'continuous', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 9999, borderCurve: 'continuous' },
  barMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 7 },
  barMetaText: { fontSize: 12, fontVariant: ['tabular-nums'] },

  groupHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
  groupTitle: { fontSize: 15, fontWeight: '700' },
  groupAction: { fontSize: 13, fontWeight: '600' },
  group: { borderRadius: 22, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  singleRowGroup: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  rowPressed: { opacity: 0.85 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 1 },
  rowAmount: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },

  fab: {
    position: 'absolute', right: 20, bottom: 24, width: 56, height: 56,
    alignItems: 'center', justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
  },
});
