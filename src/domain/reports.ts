import { Category, Money, Transaction } from './types';
import { addMonths, monthKeyOf } from './dates';
import { isInMonth } from './transactions';


export interface CategorySpend {
  category: Category;
  amount: Money;
  share: number; // 0..1 of total expense in the month
}

/** Donut data: expense grouped by category for a month, sorted desc. */
export function spendingByCategory(
  transactions: Transaction[],
  categories: Category[],
  monthKey: string,
): CategorySpend[] {
  const totals = new Map<string, Money>();
  let total = 0;
  for (const t of transactions) {
    if (t.type !== 'expense' || !isInMonth(t.date, monthKey)) continue;
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
    total += t.amount;
  }
  return categories
    .filter((c) => totals.has(c.id))
    .map((c) => ({ category: c, amount: totals.get(c.id)!, share: total > 0 ? totals.get(c.id)! / total : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

export interface MonthlyTotals {
  month: string; // yyyy-mm
  income: Money;
  expense: Money;
}

/** Income vs expense per month for the last `monthsBack` months ending at `endMonthKey`. */
export function monthlyIncomeExpense(transactions: Transaction[], endMonthKey: string, monthsBack = 12): MonthlyTotals[] {
  const end = endMonthKey;
  const months: string[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) months.push(addMonths(`${end}-01`, -i).slice(0, 7));
  const map = new Map<string, MonthlyTotals>();
  for (const m of months) map.set(m, { month: m, income: 0, expense: 0 });
  for (const t of transactions) {
    const key = monthKeyOf(t.date);
    const slot = map.get(key);
    if (!slot) continue;
    if (t.type === 'income') slot.income += t.amount;
    else slot.expense += t.amount;
  }
  return months.map((m) => map.get(m)!);
}

/** Total expense per month — the trend line. */
export function spendingTrend(transactions: Transaction[], endMonthKey: string, monthsBack = 12): { month: string; total: Money }[] {
  return monthlyIncomeExpense(transactions, endMonthKey, monthsBack).map((m) => ({ month: m.month, total: m.expense }));
}

/** Biggest expense transactions of a month. */
export function biggestTransactions(transactions: Transaction[], monthKey: string, limit = 5): Transaction[] {
  return transactions
    .filter((t) => t.type === 'expense' && isInMonth(t.date, monthKey))
    .sort((a, b) => b.amount - a.amount || b.date.localeCompare(a.date))
    .slice(0, limit);
}
