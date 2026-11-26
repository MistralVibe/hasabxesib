import { biggestTransactions, monthlyIncomeExpense, spendingByCategory, spendingTrend } from '../reports';
import { Category, Transaction } from '../types';

const categories: Category[] = [
  { id: 'c-food', nameKey: null, name: 'Food', icon: 'fast-food', color: '#F59E0B', type: 'expense', isPredefined: true, createdAt: '' },
  { id: 'c-transport', nameKey: null, name: 'Transport', icon: 'car', color: '#3B82F6', type: 'expense', isPredefined: true, createdAt: '' },
  { id: 'c-salary', nameKey: null, name: 'Salary', icon: 'briefcase', color: '#15803D', type: 'income', isPredefined: true, createdAt: '' },
];

const tx = (amount: number, categoryId: string, date: string, type: 'expense' | 'income' = 'expense'): Transaction => ({
  id: Math.random().toString(36).slice(2), accountId: 'a1', categoryId, type, amount,
  note: '', date, createdAt: '', updatedAt: '', recurringRuleId: null,
});

describe('spendingByCategory', () => {
  it('groups expense by category for the month with shares, sorted desc, transfers/income excluded', () => {
    const txs = [
      tx(6000, 'c-food', '2026-11-05'),
      tx(3000, 'c-food', '2026-11-20'),
      tx(1000, 'c-transport', '2026-11-11'),
      tx(99999, 'c-food', '2026-10-31'), // other month
      tx(50000, 'c-salary', '2026-11-01', 'income'), // income excluded
    ];
    const result = spendingByCategory(txs, categories, '2026-11');
    expect(result.map((r) => [r.category.id, r.amount])).toEqual([['c-food', 9000], ['c-transport', 1000]]);
    expect(result[0].share).toBeCloseTo(0.9);
    expect(result[1].share).toBeCloseTo(0.1);
  });
});

describe('monthlyIncomeExpense / spendingTrend', () => {
  it('returns last 12 months ending at endMonth with correct totals', () => {
    const txs = [
      tx(100000, 'c-salary', '2026-11-01', 'income'),
      tx(4000, 'c-food', '2026-11-15'),
      tx(2000, 'c-food', '2026-10-15'),
      tx(99999, 'c-food', '2025-11-15'), // outside window
    ];
    const months = monthlyIncomeExpense(txs, '2026-11', 12);
    expect(months).toHaveLength(12);
    expect(months[0].month).toBe('2025-12');
    expect(months[11].month).toBe('2026-11');
    expect(months[11]).toEqual({ month: '2026-11', income: 100000, expense: 4000 });
    expect(months[10]).toEqual({ month: '2026-10', income: 0, expense: 2000 });
    const trend = spendingTrend(txs, '2026-11', 12);
    expect(trend[11]).toEqual({ month: '2026-11', total: 4000 });
  });
});

describe('biggestTransactions', () => {
  it('returns top expense transactions of the month by amount', () => {
    const txs = [
      tx(500, 'c-food', '2026-11-01'),
      tx(9000, 'c-transport', '2026-11-02'),
      tx(3000, 'c-food', '2026-11-03'),
      tx(7777, 'c-food', '2026-10-03'),
    ];
    const top = biggestTransactions(txs, '2026-11', 2);
    expect(top.map((t) => t.amount)).toEqual([9000, 3000]);
  });
});
