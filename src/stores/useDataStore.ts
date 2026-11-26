import { create } from 'zustand';
import {
  Account, Budget, Category, RecurringRule, Transaction, Transfer,
} from '@/domain/types';
import * as repo from '@/db/repositories';
import { computeBalance, totalBalance, validateTransfer } from '@/domain/accounts';
import { validateTransaction, TransactionInput } from '@/domain/transactions';
import { materializeDue, skipOccurrence as skipOccurrenceDomain } from '@/domain/recurring';
import { startOfDayISO } from '@/domain/dates';

interface DataState {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  transfers: Transfer[];
  budgets: Budget[];
  recurringRules: RecurringRule[];
  loaded: boolean;

  load: () => void;
  reload: () => void;

  balanceOf: (accountId: string) => number;
  totalBalance: () => number;

  addTransaction: (input: TransactionInput) => { ok: true; transaction: Transaction } | { ok: false; error: string };
  updateTransaction: (id: string, input: TransactionInput) => { ok: true } | { ok: false; error: string };
  removeTransaction: (id: string) => void;

  addAccount: (a: Omit<Account, 'id' | 'createdAt'>) => Account;
  updateAccount: (id: string, patch: Partial<Account>) => void;
  removeAccount: (id: string) => { ok: true } | { ok: false; error: string };

  addTransfer: (t: { fromAccountId: string; toAccountId: string; amount: number; note: string; date: string }) => { ok: true } | { ok: false; error: string };

  addCategory: (c: Omit<Category, 'id' | 'createdAt' | 'isPredefined'>) => Category;

  upsertBudget: (b: { id?: string; categoryId: string; amount: number }) => void;
  removeBudget: (id: string) => void;

  addRecurringRule: (r: Omit<RecurringRule, 'id' | 'createdAt' | 'updatedAt'>) => RecurringRule;
  updateRecurringRule: (id: string, patch: Partial<RecurringRule>) => void;
  removeRecurringRule: (id: string) => void;
  skipRecurringOccurrence: (ruleId: string, dateISO: string) => void;

  /** Auto-post overdue recurring rules; call on app start. Returns number posted. */
  materializeRecurring: () => number;
}

export const useDataStore = create<DataState>((set, get) => ({
  accounts: [],
  categories: [],
  transactions: [],
  transfers: [],
  budgets: [],
  recurringRules: [],
  loaded: false,

  load: () => {
    repo.seedPredefinedCategoriesIfEmpty();
    get().reload();
  },
  reload: () => {
    set({
      accounts: repo.listAccounts(),
      categories: repo.listCategories(),
      transactions: repo.listTransactions(),
      transfers: repo.listTransfers(),
      budgets: repo.listBudgets(),
      recurringRules: repo.listRecurringRules(),
      loaded: true,
    });
  },

  balanceOf: (accountId) => {
    const { accounts, transactions, transfers } = get();
    const account = accounts.find((a) => a.id === accountId);
    return account ? computeBalance(account, transactions, transfers) : 0;
  },
  totalBalance: () => {
    const { accounts, transactions, transfers } = get();
    return totalBalance(accounts, transactions, transfers);
  },

  addTransaction: (input) => {
    const { accounts, categories } = get();
    const validation = validateTransaction(input, accounts, categories);
    if (!validation.ok) return validation;
    const transaction = repo.insertTransaction({ ...input, recurringRuleId: null });
    set((s) => ({ transactions: [transaction, ...s.transactions] }));
    return { ok: true, transaction };
  },
  updateTransaction: (id, input) => {
    const { accounts, categories } = get();
    const validation = validateTransaction(input, accounts, categories);
    if (!validation.ok) return validation;
    repo.updateTransaction(id, input);
    get().reload();
    return { ok: true };
  },
  removeTransaction: (id) => {
    repo.deleteTransaction(id);
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
  },

  addAccount: (a) => {
    const account = repo.insertAccount(a);
    set((s) => ({ accounts: [...s.accounts, account] }));
    return account;
  },
  updateAccount: (id, patch) => {
    repo.updateAccount(id, patch);
    set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  },
  removeAccount: (id) => {
    const result = repo.deleteAccountIfEmpty(id);
    if (result.ok) set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) }));
    return result;
  },

  addTransfer: (t) => {
    const { accounts } = get();
    const validation = validateTransfer(
      accounts.find((a) => a.id === t.fromAccountId),
      accounts.find((a) => a.id === t.toAccountId),
      t.amount,
    );
    if (!validation.ok) return validation;
    const transfer = repo.insertTransfer(t);
    set((s) => ({ transfers: [transfer, ...s.transfers] }));
    return { ok: true };
  },

  addCategory: (c) => {
    const category = repo.insertCategory(c);
    set((s) => ({ categories: [...s.categories, category] }));
    return category;
  },

  upsertBudget: (b) => {
    repo.upsertBudget(b);
    get().reload();
  },
  removeBudget: (id) => {
    repo.deleteBudget(id);
    set((s) => ({ budgets: s.budgets.filter((x) => x.id !== id) }));
  },

  addRecurringRule: (r) => {
    const rule = repo.insertRecurringRule(r);
    set((s) => ({ recurringRules: [...s.recurringRules, rule] }));
    return rule;
  },
  updateRecurringRule: (id, patch) => {
    repo.updateRecurringRule(id, patch);
    set((s) => ({ recurringRules: s.recurringRules.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  },
  removeRecurringRule: (id) => {
    repo.deleteRecurringRule(id);
    set((s) => ({ recurringRules: s.recurringRules.filter((r) => r.id !== id) }));
  },
  skipRecurringOccurrence: (ruleId, dateISO) => {
    const { recurringRules } = get();
    const rule = recurringRules.find((r) => r.id === ruleId);
    if (!rule) return;
    const updated = skipOccurrenceDomain(rule, dateISO);
    get().updateRecurringRule(ruleId, { skippedDates: updated.skippedDates });
  },

  materializeRecurring: () => {
    const { recurringRules, transactions } = get();
    const today = startOfDayISO(new Date());
    let posted = 0;
    for (const rule of recurringRules) {
      if (!rule.isActive) continue;
      const result = materializeDue(rule, today, () => '');
      if (result.postDates.length === 0) continue;
      for (const t of result.transactions) {
        repo.insertTransaction(t);
        posted += 1;
      }
      repo.updateRecurringRule(rule.id, { nextDueDate: result.updatedRule.nextDueDate });
    }
    if (posted > 0) {
      set({ transactions: [...repo.listTransactions()], recurringRules: repo.listRecurringRules() });
      void transactions;
    } else {
      const rules = repo.listRecurringRules();
      set({ recurringRules: rules });
    }
    return posted;
  },
}));
