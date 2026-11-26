import { Account, Category, Money, Transaction, TransactionType } from './types';
import { monthKeyOf } from './dates';

/** Signed effect of a transaction on its account's balance: income +, expense −. */
export function signedAmount(tx: Pick<Transaction, 'type' | 'amount'>): Money {
  return tx.type === 'income' ? tx.amount : -tx.amount;
}

export function isInMonth(isoDate: string, monthKey: string): boolean {
  return monthKeyOf(isoDate) === monthKey;
}

export interface TransactionInput {
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: Money;
  note: string;
  date: string; // yyyy-mm-dd
}

export type TransactionValidation = { ok: true } | { ok: false; error: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateTransaction(
  input: TransactionInput,
  accounts: Account[],
  categories: Category[],
): TransactionValidation {
  if (!accounts.some((a) => a.id === input.accountId && !a.isArchived)) {
    return { ok: false, error: 'Account not found' };
  }
  const category = categories.find((c) => c.id === input.categoryId);
  if (!category) return { ok: false, error: 'Category not found' };
  if (category.type !== input.type) return { ok: false, error: 'Category type does not match transaction type' };
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    return { ok: false, error: 'Amount must be a positive integer of minor units' };
  }
  if (!ISO_DATE.test(input.date) || Number.isNaN(Date.parse(input.date))) {
    return { ok: false, error: 'Date must be yyyy-mm-dd' };
  }
  return { ok: true };
}
