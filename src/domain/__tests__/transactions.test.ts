import { signedAmount, validateTransaction } from '../transactions';
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
