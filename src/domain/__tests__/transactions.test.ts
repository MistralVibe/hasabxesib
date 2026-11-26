import { netInMonth, signedAmount, validateTransaction } from '../transactions';
import { Account, Category } from '../types';

const accounts: Account[] = [
  { id: 'a1', name: 'Cash', type: 'cash', icon: 'cash', color: '#000', openingBalance: 0, createdAt: '', isArchived: false },
];
const categories: Category[] = [
  { id: 'c-exp', nameKey: null, name: 'Food', icon: 'fast-food', color: '#F59E0B', type: 'expense', isPredefined: true, createdAt: '' },
  { id: 'c-inc', nameKey: null, name: 'Salary', icon: 'briefcase', color: '#15803D', type: 'income', isPredefined: true, createdAt: '' },
];

const base = { accountId: 'a1', categoryId: 'c-exp', type: 'expense' as const, amount: 500, note: '', date: '2026-11-26' };

describe('signedAmount', () => {
  it('income is positive, expense negative', () => {
    expect(signedAmount({ type: 'income', amount: 700 })).toBe(700);
    expect(signedAmount({ type: 'expense', amount: 700 })).toBe(-700);
  });
});

describe('validateTransaction', () => {
  it('accepts a valid expense', () => {
    expect(validateTransaction(base, accounts, categories)).toEqual({ ok: true });
  });

  it('rejects unknown account, unknown category, type mismatch, bad amount, bad date', () => {
    expect(validateTransaction({ ...base, accountId: 'nope' }, accounts, categories).ok).toBe(false);
    expect(validateTransaction({ ...base, categoryId: 'nope' }, accounts, categories).ok).toBe(false);
    expect(validateTransaction({ ...base, categoryId: 'c-inc' }, accounts, categories).ok).toBe(false);
    expect(validateTransaction({ ...base, amount: 0 }, accounts, categories).ok).toBe(false);
    expect(validateTransaction({ ...base, amount: -5 }, accounts, categories).ok).toBe(false);
    expect(validateTransaction({ ...base, date: '26.11.2026' }, accounts, categories).ok).toBe(false);
  });
});

describe('netInMonth', () => {
  const tx = (type: 'income' | 'expense', amount: number, date: string) => ({
    id: `${type}-${amount}-${date}`,
    accountId: 'a1',
    categoryId: type === 'income' ? 'c-inc' : 'c-exp',
    type,
    amount,
    note: '',
    date,
    createdAt: '',
    updatedAt: '',
    recurringRuleId: null,
  });

  it('is income minus expenses for the month', () => {
    const txs = [tx('income', 300000, '2026-11-01'), tx('expense', 8500, '2026-11-02'), tx('expense', 3000, '2026-11-30')];
    expect(netInMonth(txs, '2026-11')).toBe(300000 - 11500);
  });

  it('is negative when the month spent more than it earned', () => {
    const txs = [tx('income', 1000, '2026-11-05'), tx('expense', 4000, '2026-11-06')];
    expect(netInMonth(txs, '2026-11')).toBe(-3000);
  });

  it('ignores other months and returns 0 for an empty month', () => {
    const txs = [tx('income', 500000, '2026-10-31'), tx('expense', 700, '2026-12-01')];
    expect(netInMonth(txs, '2026-11')).toBe(0);
    expect(netInMonth([], '2026-11')).toBe(0);
  });
});
