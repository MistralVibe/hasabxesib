import { BackupError, buildTransactionsCsv, parseBackup, serializeBackup } from '../export';
import { Account, Category, Transaction } from '../types';

const account: Account = { id: 'a1', name: 'Cash, main', type: 'cash', icon: 'cash', color: '#000', openingBalance: 0, createdAt: '2026-01-01T00:00:00Z', isArchived: false };
const category: Category = { id: 'c1', nameKey: null, name: 'Food', icon: 'fast-food', color: '#F59E0B', type: 'expense', isPredefined: true, createdAt: '' };
const tx = (partial: Partial<Transaction>): Transaction => ({
  id: 't1', accountId: 'a1', categoryId: 'c1', type: 'expense', amount: 1234, note: 'Lunch, "tasty"', date: '2026-11-26',
  createdAt: '', updatedAt: '', recurringRuleId: null, ...partial,
});

describe('buildTransactionsCsv', () => {
  it('emits header and escaped rows sorted by date', () => {
    const csv = buildTransactionsCsv(
      [tx({ id: 't2', date: '2026-11-27', note: 'plain' }), tx({})],
      [account], [category], 'USD',
    );
    const lines = csv.split('\n');
    expect(lines[0]).toBe('date,type,amount,currency,category,account,note');
    expect(lines[1]).toBe('2026-11-26,expense,12.34,USD,Food,"Cash, main","Lunch, ""tasty"""');
    expect(lines[2]).toBe('2026-11-27,expense,12.34,USD,Food,"Cash, main",plain');
  });
});

describe('backup round-trip', () => {
  it('serialize -> parse returns the same data', () => {
    const data = {
      accounts: [account],
      categories: [category],
      transactions: [tx({})],
      transfers: [],
      budgets: [],
      recurringRules: [],
    };
    const parsed = parseBackup(serializeBackup(data, '2026-11-26T12:00:00Z'));
    expect(parsed).toEqual(data);
  });

  it('rejects malformed JSON, wrong version, and bad references', () => {
    expect(() => parseBackup('not json')).toThrow(BackupError);
    expect(() => parseBackup('{"version":2}')).toThrow(/unsupported version/);
    expect(() => parseBackup(JSON.stringify({ version: 1, accounts: [], categories: [], transactions: [{ id: 'x', accountId: 'nope', categoryId: 'c1', type: 'expense', amount: 100, date: '2026-11-01' }], transfers: [], budgets: [], recurringRules: [] }))).toThrow(/unknown account/);
    expect(() => parseBackup(JSON.stringify({ version: 1, accounts: [], categories: [], transactions: [{ id: 'x', accountId: 'a1', categoryId: 'c1', type: 'expense', amount: -5, date: '2026-11-01' }], transfers: [], budgets: [], recurringRules: [] }))).toThrow(/amount/);
  });
});
