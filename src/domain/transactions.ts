import { Account, Category, Money, Transaction, TransactionType } from './types';
import { monthKeyOf } from './dates';

/** Signed effect of a transaction on its account's balance: income +, expense −. */
export function signedAmount(tx: Pick<Transaction, 'type' | 'amount'>): Money {
  return tx.type === 'income' ? tx.amount : -tx.amount;
}

export function isInMonth(isoDate: string, monthKey: string): boolean {
  return monthKeyOf(isoDate) === monthKey;
}

/**
 * Net movement of a month in minor units: income minus expenses. Positive means
 * the month earned more than it spent; negative means it spent more.
 */
export function netInMonth(transactions: Transaction[], monthKey: string): Money {
  let net = 0;
  for (const t of transactions) {
    if (!isInMonth(t.date, monthKey)) continue;
    net += signedAmount(t);
  }
  return net;
}

export interface TransactionInput {
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: Money;
  note: string;
  date: string; // yyyy-mm-dd
}

// Validation errors are i18n KEYS under errors.*, mapped to text at the UI layer.
export type ValidationErrorKey =
  | 'accountNotFound'
  | 'categoryNotFound'
  | 'categoryTypeMismatch'
  | 'amountPositive'
  | 'dateInvalid'
  | 'accountsDiffer'
  | 'bothAccountsExist'
  | 'accountHasActivity';

export type TransactionValidation = { ok: true } | { ok: false; error: ValidationErrorKey };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateTransaction(
  input: TransactionInput,
  accounts: Account[],
  categories: Category[],
): TransactionValidation {
  if (!accounts.some((a) => a.id === input.accountId && !a.isArchived)) {
    return { ok: false, error: 'accountNotFound' };
  }
  const category = categories.find((c) => c.id === input.categoryId);
  if (!category) return { ok: false, error: 'categoryNotFound' };
  if (category.type !== input.type) return { ok: false, error: 'categoryTypeMismatch' };
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    return { ok: false, error: 'amountPositive' };
  }
  if (!ISO_DATE.test(input.date) || Number.isNaN(Date.parse(input.date))) {
    return { ok: false, error: 'dateInvalid' };
  }
  return { ok: true };
}
