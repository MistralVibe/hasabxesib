import { Account, Money, Transaction, Transfer } from './types';
import { signedAmount } from './transactions';

/**
 * Balance of an account = opening balance + signed sum of its transactions
 * + transfers in − transfers out. Derived, never stored (GLOSSARY: Balance).
 */
export function computeBalance(
  account: Account,
  transactions: Transaction[],
  transfers: Transfer[],
): Money {
  let balance = account.openingBalance;
  for (const tx of transactions) {
    if (tx.accountId === account.id) balance += signedAmount(tx);
  }
  for (const tr of transfers) {
    if (tr.toAccountId === account.id) balance += tr.amount;
    if (tr.fromAccountId === account.id) balance -= tr.amount;
  }
  return balance;
}

export function totalBalance(accounts: Account[], transactions: Transaction[], transfers: Transfer[]): Money {
  return accounts.reduce((sum, a) => sum + computeBalance(a, transactions, transfers), 0);
}

export type TransferValidation = { ok: true } | { ok: false; error: string };

export function validateTransfer(
  from: Account | undefined,
  to: Account | undefined,
  amount: Money,
): TransferValidation {
  if (!from || !to) return { ok: false, error: 'Both accounts must exist' };
  if (from.id === to.id) return { ok: false, error: 'Accounts must differ' };
  if (!Number.isInteger(amount) || amount <= 0) return { ok: false, error: 'Amount must be a positive integer of minor units' };
  return { ok: true };
}
