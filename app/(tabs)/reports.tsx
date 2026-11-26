import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { useTheme } from '@/theme/ThemeProvider';
import { useI18n } from '@/i18n';
import { useShallow } from 'zustand/react/shallow';
import { useDataStore } from '@/stores/useDataStore';
import { useFormatters } from '@/hooks/useFormatters';
import { useCategoryLabel } from '@/hooks/useCategoryLabel';
import { biggestTransactions, monthlyIncomeExpense, spendingByCategory, spendingTrend } from '@/domain/reports';
import { addMonths, monthKeyOf, startOfDayISO } from '@/domain/dates';
import { Transaction } from '@/domain/types';

const WINDOW_MONTHS = 12;
const DONUT_SIZE = 184;
const DONUT_THICKNESS = 16;
const DONUT_TICKS = 132;
/**
 * Ring and legend both stop at five categories (no-pie-overuse); the ring
 * normalises shares over the slices it receives, so it always closes exactly.
 */
const DONUT_MAX_SLICES = 5;
const TREND_HEIGHT = 124;

/** "March 2025" in the active language, built from the month key. */
const monthFmtCache = new Map<string, Intl.DateTimeFormat>();
function monthFormatter(locale: string, month: 'long' | 'short'): Intl.DateTimeFormat {
  const key = `${locale}:${month}`;
  let f = monthFmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { month });
    monthFmtCache.set(key, f);
  }
  return f;
}

function monthLabel(key: string, locale: string): string {
  const [year, month] = key.split('-').map(Number);
  const name = monthFormatter(locale, 'long').format(new Date(year, month - 1, 1));
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function shortMonth(key: string, locale: string): string {
  const [year, month] = key.split('-').map(Number);
  return monthFormatter(locale, 'short').format(new Date(year, month - 1, 1));
}

/**
 * Donut drawn as a ring of colored ticks. Two reasons it is not victory-native:
 * the library needs react-native-skia (a peer that is not part of this app's
 * dependency set), and a ring of rotated dots stays sharp at every size without
 * a canvas. Each tick maps to one slice by cumulative share.
 */
function Donut({
  slices,
  centerLabel,
  centerCaption,
  accessibilityLabel,
}: {
  slices: { color: string; share: number }[];
  centerLabel: string;
  centerCaption: string;
  accessibilityLabel: string;
}) {
  const { theme } = useTheme();
  const dots = useMemo(() => {
    if (slices.length === 0) return [];
    const total = slices.reduce((sum, s) => sum + s.share, 0) || 1;
    // Turn shares into whole tick counts, handing the rounding remainder to the
    // largest slice so the ring always closes exactly.
    const counts = slices.map((s) => Math.round((s.share / total) * DONUT_TICKS));
    const drift = DONUT_TICKS - counts.reduce((sum, n) => sum + n, 0);
    if (drift !== 0) {
      const largest = counts.indexOf(Math.max(...counts));
      counts[largest] += drift;
    }
    const result: { color: string; x: number; y: number }[] = [];
    const radius = DONUT_SIZE / 2 - DONUT_THICKNESS / 2;
    const center = DONUT_SIZE / 2;
    let index = 0;
    counts.forEach((count, sliceIndex) => {
      for (let i = 0; i < Math.max(count, 0); i++) {
        const angle = (index / DONUT_TICKS) * Math.PI * 2 - Math.PI / 2;
        result.push({
          color: slices[sliceIndex].color,
          x: center + radius * Math.cos(angle) - DONUT_THICKNESS / 2,
          y: center + radius * Math.sin(angle) - DONUT_THICKNESS / 2,
        });
        index += 1;
      }
    });
    return result;
  }, [slices]);

  return (
    <View
      // The ring is pure Views, so TalkBack needs the summary to describe it.
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[styles.donut, { width: DONUT_SIZE, height: DONUT_SIZE }]}
    >
      {dots.map((dot, i) => (
        <View
          key={i}
          style={[
            styles.donutTick,
            {
              width: DONUT_THICKNESS,
              height: DONUT_THICKNESS,
              borderRadius: DONUT_THICKNESS / 2, borderCurve: 'continuous',
              backgroundColor: dot.color,
              left: dot.x,
              top: dot.y,
            },
          ]}
        />
      ))}
      <View style={styles.donutCenter} pointerEvents="none">
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ color: theme.colors.text, fontSize: theme.type.heading, fontWeight: '800' }}
        >
          {centerLabel}
        </Text>
        <Text numberOfLines={1} style={{ color: theme.colors.textSecondary, fontSize: theme.type.caption }}>
          {centerCaption}
        </Text>
      </View>
    </View>
  );
}

/** Income vs expense bars for the report window. */
function IncomeExpenseChart({
  series,
  labels,
  incomeColor,
  expenseColor,
  height = 132,
  axisColor,
  labelColor,
  accessibilityLabel,
}: {
  series: { income: number; expense: number }[];
  labels: string[];
  incomeColor: string;
  expenseColor: string;
  height?: number;
  axisColor: string;
  labelColor: string;
  accessibilityLabel: string;
}) {
  const max = Math.max(1, ...series.flatMap((m) => [m.income, m.expense]));
  const barHeight = (value: number) => (value > 0 ? Math.max(2, (value / max) * height) : 0);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <View style={[styles.barArea, { height }]}>
        {series.map((m, i) => (
          <View key={i} style={styles.barGroup}>
            <View style={styles.barPair}>
              <View style={[styles.bar, { height: barHeight(m.income), backgroundColor: incomeColor }]} />
              <View style={[styles.bar, { height: barHeight(m.expense), backgroundColor: expenseColor }]} />
            </View>
          </View>
        ))}
      </View>
      <View style={[styles.axis, { backgroundColor: axisColor }]} />
      <View style={styles.axisRow}>
        {labels.map((label, i) => (
          <Text key={i} numberOfLines={1} style={[styles.axisLabel, { color: labelColor }]}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** Trend line: dots on a measured width, segments as rotated 2px views. */
function TrendChart({
  values,
  color,
  height = TREND_HEIGHT,
  accessibilityLabel,
}: {
  values: number[];
  color: string;
  height?: number;
  accessibilityLabel: string;
}) {
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);
  const pad = 8;
  const max = Math.max(1, ...values);
  const points = useMemo(() => {
    if (width === 0 || values.length === 0) return [];
    const innerWidth = Math.max(width - pad * 2, 1);
    const innerHeight = height - pad * 2;
    return values.map((value, i) => ({
      x: pad + (values.length === 1 ? innerWidth / 2 : (innerWidth * i) / (values.length - 1)),
      y: height - pad - (value / max) * innerHeight,
    }));
  }, [values, width, max, height]);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ height }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {points.slice(1).map((point, i) => {
        const prev = points[i];
        const dx = point.x - prev.x;
        const dy = point.y - prev.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <View
            key={`seg-${i}`}
            style={[
              styles.lineSegment,
              {
                width: length,
                height: 2,
                left: (prev.x + point.x) / 2 - length / 2,
                top: (prev.y + point.y) / 2 - 1,
                backgroundColor: color,
                transform: [{ rotate: `${angle}deg` }],
              },
            ]}
          />
        );
      })}
      {points.map((point, i) => (
        <View
          key={`dot-${i}`}
          style={[
            styles.lineDot,
            { left: point.x - 3, top: point.y - 3, backgroundColor: color, borderColor: theme.colors.surface },
          ]}
        />
      ))}
    </View>
  );
}

export default function ReportsScreen() {
  const { theme } = useTheme();
  const { t, language } = useI18n();
  const { money, signed } = useFormatters();
  const categoryLabel = useCategoryLabel();
  const { transactions, categories } = useDataStore(
    useShallow((s) => ({ transactions: s.transactions, categories: s.categories })),
  );

  const thisMonth = monthKeyOf(startOfDayISO(new Date()));
  const [monthKey, setMonthKey] = useState(thisMonth);

  const localeTag = language === 'ru' ? 'ru-RU' : 'en-US';

  const byCategory = useMemo(
    () => spendingByCategory(transactions, categories, monthKey),
    [transactions, categories, monthKey],
  );
  const donutRows = useMemo(() => byCategory.slice(0, DONUT_MAX_SLICES), [byCategory]);
  const donutSlices = useMemo(
    () => donutRows.map((row) => ({ color: row.category.color, share: row.share })),
    [donutRows],
  );
  const monthly = useMemo(
    () => monthlyIncomeExpense(transactions, monthKey, WINDOW_MONTHS),
    [transactions, monthKey],
  );
  const trend = useMemo(() => spendingTrend(transactions, monthKey, WINDOW_MONTHS), [transactions, monthKey]);
  const trendValues = useMemo(() => trend.map((p) => p.total), [trend]);
  const biggest = useMemo(() => biggestTransactions(transactions, monthKey, 5), [transactions, monthKey]);

  const hasMonthData = byCategory.length > 0;
  const hasWindowData = monthly.some((m) => m.income > 0 || m.expense > 0);
  const monthExpense = byCategory.reduce((sum, row) => sum + row.amount, 0);
  const windowIncome = monthly.reduce((sum, m) => sum + m.income, 0);
  const windowExpense = monthly.reduce((sum, m) => sum + m.expense, 0);
  const trendTop = Math.max(1, ...trendValues);
  // The axis is drawn from a zero baseline, so the spoken summary reports the
  // lowest month that actually has spending rather than the empty months.
  const trendSpendMonths = trendValues.filter((value) => value > 0);
  const trendLow = trendSpendMonths.length > 0 ? Math.min(...trendSpendMonths) : 0;
  const trendHigh = trendSpendMonths.length > 0 ? Math.max(...trendSpendMonths) : 0;

  const c = theme.colors;
  const canGoNext = monthKey < thisMonth;
  const monthText = t('dates.monthYear', { month: monthLabel(monthKey, localeTag), year: monthKey.slice(0, 4) });

  const categoryById = (id: string) => categories.find((cat) => cat.id === id);

  // Screen-reader summaries: the charts are pure Views, so each one carries a
  // spoken description of what it draws and the numbers behind it.
  const topRow = donutRows[0];
  const donutSummary = topRow
    ? t('reports.a11yByCategory', {
        total: money(monthExpense),
        category: categoryLabel(topRow.category),
        percent: Math.round(topRow.share * 100),
      })
    : t('reports.a11yByCategoryEmpty');
  const incomeExpenseSummary = t('reports.a11yIncomeExpense', {
    income: money(windowIncome),
    expense: money(windowExpense),
  });
  const trendSummary = hasWindowData
    ? t('reports.a11yTrend', { min: money(trendLow), max: money(trendHigh) })
    : t('reports.a11yTrendEmpty');

  return (
    <Screen>
      <Text style={[styles.title, { color: c.text, fontSize: theme.type.title }]}>{t('reports.title')}</Text>

      <Card style={styles.monthCard}>
        <Pressable
          onPress={() => setMonthKey((key) => monthKeyOf(addMonths(`${key}-01`, -1)))}
          accessibilityRole="button"
          accessibilityLabel={t('reports.prevMonth')}
          style={({ pressed }) => [styles.monthButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={20} color={c.text} />
        </Pressable>
        <Text style={{ color: c.text, fontSize: theme.type.body, fontWeight: '700' }}>{monthText}</Text>
        <Pressable
          onPress={() => setMonthKey((key) => monthKeyOf(addMonths(`${key}-01`, 1)))}
          disabled={!canGoNext}
          accessibilityRole="button"
          accessibilityLabel={t('reports.nextMonth')}
          style={({ pressed }) => [styles.monthButton, { opacity: !canGoNext ? 0.3 : pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-forward" size={20} color={c.text} />
        </Pressable>
      </Card>

      <Card style={styles.card}>
        <SectionTitle title={t('reports.byCategory')} />
        {hasMonthData ? (
          <View style={styles.donutWrap}>
            <Donut
              slices={donutSlices}
              centerLabel={money(monthExpense)}
              centerCaption={t('reports.expenseLabel')}
              accessibilityLabel={donutSummary}
            />
            <View style={styles.donutLegend}>
              {donutRows.map((row) => (
                <View key={row.category.id} style={styles.donutLegendItem}>
                  <View style={[styles.chartLegendDot, { backgroundColor: row.category.color }]} />
                  <Text
                    numberOfLines={1}
                    style={[styles.donutLegendName, { color: c.text, fontSize: theme.type.caption }]}
                  >
                    {categoryLabel(row.category)}
                  </Text>
                  <Text style={{ color: c.textSecondary, fontSize: theme.type.caption, fontWeight: '700' }}>
                    {Math.round(row.share * 100)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <EmptyState icon="pie-chart-outline" title={t('reports.noData')} />
        )}
      </Card>

      {hasMonthData ? (
        <Card style={styles.card}>
          <SectionTitle title={t('reports.topCategories')} />
          {byCategory.slice(0, 5).map((row) => (
            <View key={row.category.id} style={styles.row}>
              <CategoryIcon icon={row.category.icon} color={row.category.color} />
              <View style={styles.flex}>
                <Text style={{ color: c.text, fontSize: theme.type.body, fontWeight: '600' }}>
                  {categoryLabel(row.category)}
                </Text>
                <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>
                  {t('reports.ofTotal', { percent: Math.round(row.share * 100) })}
                </Text>
              </View>
              <Text style={{ color: c.text, fontSize: theme.type.body, fontWeight: '700' }}>{money(row.amount)}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      <Card style={styles.card}>
        <SectionTitle title={t('reports.incomeVsExpense')} />
        <Text style={[styles.caption, { color: c.textSecondary, fontSize: theme.type.caption }]}>
          {t('reports.lastMonths')}
        </Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: c.income }]} />
            <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>{t('reports.incomeLabel')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: c.expense }]} />
            <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>{t('reports.expenseLabel')}</Text>
          </View>
        </View>
        <IncomeExpenseChart
          series={monthly}
          labels={monthly.map((m) => shortMonth(m.month, localeTag))}
          incomeColor={c.income}
          expenseColor={c.expense}
          axisColor={c.border}
          labelColor={c.textSecondary}
          accessibilityLabel={incomeExpenseSummary}
        />
      </Card>

      <Card style={styles.card}>
        <SectionTitle title={t('reports.trend')} />
        {hasWindowData ? (
          <View style={styles.trendRow}>
            <View style={[styles.trendAxis, { height: TREND_HEIGHT }]}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={[styles.trendAxisLabel, { color: c.textSecondary }]}
              >
                {money(trendTop)}
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={[styles.trendAxisLabel, { color: c.textSecondary }]}
              >
                {money(0)}
              </Text>
            </View>
            <View style={styles.flex}>
              <TrendChart
                values={trendValues}
                color={c.accent}
                height={TREND_HEIGHT}
                accessibilityLabel={trendSummary}
              />
            </View>
          </View>
        ) : (
          <EmptyState icon="trending-down-outline" title={t('reports.noData')} />
        )}
      </Card>

      {biggest.length > 0 ? (
        <Card style={styles.card}>
          <SectionTitle title={t('reports.biggest')} />
          {biggest.map((tx: Transaction) => {
            const category = categoryById(tx.categoryId);
            return (
              <View key={tx.id} style={styles.row}>
                {category ? <CategoryIcon icon={category.icon} color={category.color} /> : null}
                <View style={styles.flex}>
                  <Text numberOfLines={1} style={{ color: c.text, fontSize: theme.type.body, fontWeight: '600' }}>
                    {tx.note || (category ? categoryLabel(category) : '')}
                  </Text>
                  <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>
                    {category ? categoryLabel(category) : ''} · {tx.date}
                  </Text>
                </View>
                <Text style={{ color: c.expense, fontSize: theme.type.body, fontWeight: '700' }}>
                  {signed(-tx.amount)}
                </Text>
              </View>
            );
          })}
        </Card>
      ) : null}

    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '800', marginBottom: 12 },
  monthCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthButton: { paddingVertical: 4, paddingHorizontal: 8 },
  card: { marginBottom: 12 },
  caption: { marginTop: -4 },
  donutWrap: { alignItems: 'center', paddingVertical: 8 },
  donut: { alignItems: 'center', justifyContent: 'center' },
  donutTick: { position: 'absolute' },
  donutCenter: { position: 'absolute', width: DONUT_SIZE - DONUT_THICKNESS * 4, alignItems: 'center' },
  donutLegend: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, columnGap: 12, marginTop: 14, alignSelf: 'stretch' },
  donutLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '47%' },
  donutLegendName: { flexShrink: 1, fontWeight: '600' },
  chartLegendDot: { width: 8, height: 8, borderRadius: 4, borderCurve: 'continuous' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  flex: { flex: 1 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 6, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 , borderCurve: 'continuous'},
  barArea: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  barGroup: { flex: 1, alignItems: 'center' },
  barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 5, borderRadius: 2 , borderCurve: 'continuous'},
  axis: { height: StyleSheet.hairlineWidth, marginTop: 4 },
  axisRow: { flexDirection: 'row', marginTop: 4 },
  axisLabel: { flex: 1, textAlign: 'center', fontSize: 9 },
  trendRow: { flexDirection: 'row', alignItems: 'flex-start' },
  trendAxis: { width: 58, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 6, paddingVertical: 8 },
  trendAxisLabel: { fontSize: 9, fontWeight: '600' },
  lineSegment: { position: 'absolute' },
  lineDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, borderCurve: 'continuous', borderWidth: 1 },
});
