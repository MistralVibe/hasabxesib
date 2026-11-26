import { computeBalance, totalBalance, validateTransfer } from '../accounts';
import { Account, Transaction, Transfer } from '../types';

const cash: Account = {
  id: 'a-cash', name: 'Cash', type: 'cash', icon: 'cash', color: '#4ADE80',
  openingBalance: 10000, createdAt: '2026-01-01T00:00:00Z', isArchived: false,
};
const card: Account = {
  id: 'a-card', name: 'Card', type: 'card', icon: 'card', color: '#818CF8',
  openingBalance: 50000, createdAt: '2026-01-01T00:00:00Z', isArchived: false,
};

const tx = (partial: Partial<Transaction>): Transaction => ({
  id: partial.id ?? Math.random().toString(36).slice(2),
  accountId: 'a-cash',
  categoryId: 'c-food',
  type: 'expense',
  amount: 1000,
  note: '',
  date: '2026-11-05',
  createdAt: '2026-11-05T00:00:00Z',
  updatedAt: '2026-11-05T00:00:00Z',
  recurringRuleId: null,
  ...partial,
});

const tr = (partial: Partial<Transfer>): Transfer => ({
  id: 't1', fromAccountId: 'a-cash', toAccountId: 'a-card', amount: 5000,
  note: '', date: '2026-11-06', createdAt: '2026-11-06T00:00:00Z', ...partial,
});

describe('computeBalance', () => {
  it('is opening balance plus signed transactions plus transfers', () => {
    const transactions = [
      tx({ type: 'income', amount: 20000 }),
      tx({ type: 'expense', amount: 3000 }),
      tx({ accountId: 'a-card', type: 'expense', amount: 7000 }),
    ];
    const transfers = [tr({ amount: 5000 })];
    expect(computeBalance(cash, transactions, transfers)).toBe(10000 + 20000 - 3000 - 5000);
    expect(computeBalance(card, transactions, transfers)).toBe(50000 - 7000 + 5000);
  });

  it('totalBalance sums accounts', () => {
    expect(totalBalance([cash, card], [], [])).toBe(60000);
  });
});

describe('validateTransfer', () => {
  it('rejects same account and non-positive amounts', () => {
    expect(validateTransfer(cash, cash, 100)).toEqual({ ok: false, error: 'Accounts must differ' });
    expect(validateTransfer(cash, card, 0)).toEqual({ ok: false, error: 'Amount must be a positive integer of minor units' });
    expect(validateTransfer(cash, card, 10.5)).toEqual({ ok: false, error: 'Amount must be a positive integer of minor units' });
    expect(validateTransfer(undefined, card, 100)).toEqual({ ok: false, error: 'Both accounts must exist' });
  });

  it('accepts a valid transfer', () => {
    expect(validateTransfer(cash, card, 2500)).toEqual({ ok: true });
  });
});
