import { Account, Budget, Category, RecurringRule, Transaction, Transfer } from './types';
import { currencyExponent, fromMinor } from './money';

export interface BackupData {
  version: 1;
  exportedAt: string;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  transfers: Transfer[];
  budgets: Budget[];
  recurringRules: RecurringRule[];
}

export class BackupError extends Error {}

// ---- CSV ----

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** Transactions as CSV for spreadsheets: date,type,amount(decimal),currency-less,category,account,note */
export function buildTransactionsCsv(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  currency: string,
): string {
  const accountName = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const header = 'date,type,amount,currency,category,account,note';
  const lines = transactions
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => {
      const decimal = fromMinor(t.amount, currency).toFixed(currencyExponent(currency));
      return [
        t.date, t.type, decimal, currency,
        csvEscape(categoryName.get(t.categoryId) ?? t.categoryId),
        csvEscape(accountName.get(t.accountId) ?? t.accountId),
        csvEscape(t.note),
      ].join(',');
    });
  return [header, ...lines].join('\n');
}

// ---- JSON backup ----

export function serializeBackup(data: Omit<BackupData, 'version' | 'exportedAt'>, exportedAt: string): string {
  const backup: BackupData = { version: 1, exportedAt, ...data };
  return JSON.stringify(backup, null, 2);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function requireString(v: unknown, field: string): string {
  if (typeof v !== 'string' || v.length === 0) throw new BackupError(`Invalid backup: ${field} must be a non-empty string`);
  return v;
}

function requireMoney(v: unknown, field: string): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v <= 0) throw new BackupError(`Invalid backup: ${field} must be a positive integer (minor units)`);
  return v;
}

function parseAccount(r: unknown): Account {
  if (!isRecord(r)) throw new BackupError('Invalid backup: account entry');
  return {
    id: requireString(r.id, 'account.id'),
    name: requireString(r.name, 'account.name'),
    type: r.type === 'cash' || r.type === 'card' || r.type === 'bank' ? r.type : (() => { throw new BackupError('Invalid backup: account.type'); })(),
    icon: typeof r.icon === 'string' ? r.icon : 'cash',
    color: typeof r.color === 'string' ? r.color : '#888888',
    openingBalance: typeof r.openingBalance === 'number' && Number.isInteger(r.openingBalance) ? r.openingBalance : 0,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
    isArchived: Boolean(r.isArchived),
  };
}

function parseCategory(r: unknown): Category {
  if (!isRecord(r)) throw new BackupError('Invalid backup: category entry');
  const type = r.type === 'income' || r.type === 'expense' ? r.type : (() => { throw new BackupError('Invalid backup: category.type'); })();
  return {
    id: requireString(r.id, 'category.id'),
    nameKey: typeof r.nameKey === 'string' ? r.nameKey : null,
    name: requireString(r.name, 'category.name'),
    icon: typeof r.icon === 'string' ? r.icon : 'ellipse',
    color: typeof r.color === 'string' ? r.color : '#888888',
    type,
    isPredefined: Boolean(r.isPredefined),
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
  };
}

function parseTransaction(r: unknown): Transaction {
  if (!isRecord(r)) throw new BackupError('Invalid backup: transaction entry');
  const type = r.type === 'income' || r.type === 'expense' ? r.type : (() => { throw new BackupError('Invalid backup: transaction.type'); })();
  const date = requireString(r.date, 'transaction.date');
  if (!ISO_DATE.test(date)) throw new BackupError('Invalid backup: transaction.date must be yyyy-mm-dd');
  return {
    id: requireString(r.id, 'transaction.id'),
    accountId: requireString(r.accountId, 'transaction.accountId'),
    categoryId: requireString(r.categoryId, 'transaction.categoryId'),
    type,
    amount: requireMoney(r.amount, 'transaction.amount'),
    note: typeof r.note === 'string' ? r.note : '',
    date,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date().toISOString(),
    recurringRuleId: typeof r.recurringRuleId === 'string' ? r.recurringRuleId : null,
  };
}

function parseTransfer(r: unknown): Transfer {
  if (!isRecord(r)) throw new BackupError('Invalid backup: transfer entry');
  const date = requireString(r.date, 'transfer.date');
  if (!ISO_DATE.test(date)) throw new BackupError('Invalid backup: transfer.date must be yyyy-mm-dd');
  return {
    id: requireString(r.id, 'transfer.id'),
    fromAccountId: requireString(r.fromAccountId, 'transfer.fromAccountId'),
    toAccountId: requireString(r.toAccountId, 'transfer.toAccountId'),
    amount: requireMoney(r.amount, 'transfer.amount'),
    note: typeof r.note === 'string' ? r.note : '',
    date,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
  };
}

function parseBudget(r: unknown): Budget {
  if (!isRecord(r)) throw new BackupError('Invalid backup: budget entry');
  return {
    id: requireString(r.id, 'budget.id'),
    categoryId: requireString(r.categoryId, 'budget.categoryId'),
    amount: requireMoney(r.amount, 'budget.amount'),
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date().toISOString(),
  };
}

function parseRecurringRule(r: unknown): RecurringRule {
  if (!isRecord(r)) throw new BackupError('Invalid backup: recurring rule entry');
  const freq = ['daily', 'weekly', 'monthly', 'yearly'].includes(r.frequency as string) ? r.frequency as RecurringRule['frequency'] : (() => { throw new BackupError('Invalid backup: recurring.frequency'); })();
  const type = r.type === 'income' || r.type === 'expense' ? r.type : (() => { throw new BackupError('Invalid backup: recurring.type'); })();
  for (const f of ['startDate', 'nextDueDate'] as const) {
    if (typeof r[f] !== 'string' || !ISO_DATE.test(r[f] as string)) throw new BackupError(`Invalid backup: recurring.${f}`);
  }
  return {
    id: requireString(r.id, 'recurring.id'),
    accountId: requireString(r.accountId, 'recurring.accountId'),
    categoryId: requireString(r.categoryId, 'recurring.categoryId'),
    type,
    amount: requireMoney(r.amount, 'recurring.amount'),
    note: typeof r.note === 'string' ? r.note : '',
    frequency: freq,
    startDate: r.startDate as string,
    nextDueDate: r.nextDueDate as string,
    skippedDates: Array.isArray(r.skippedDates) && r.skippedDates.every((d) => typeof d === 'string') ? (r.skippedDates as string[]) : [],
    isActive: Boolean(r.isActive),
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date().toISOString(),
  };
}

function requireArray(v: unknown, field: string): unknown[] {
  if (!Array.isArray(v)) throw new BackupError(`Invalid backup: ${field} must be an array`);
  return v;
}

/** Parse and validate a JSON backup string. Throws BackupError on malformed input. */
export function parseBackup(json: string): Omit<BackupData, 'version' | 'exportedAt'> {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new BackupError('Invalid backup: not valid JSON');
  }
  if (!isRecord(raw)) throw new BackupError('Invalid backup: root must be an object');
  if (raw.version !== 1) throw new BackupError(`Invalid backup: unsupported version ${String(raw.version)}`);
  const accounts = requireArray(raw.accounts, 'accounts').map(parseAccount);
  const categories = requireArray(raw.categories, 'categories').map(parseCategory);
  const transactions = requireArray(raw.transactions, 'transactions').map(parseTransaction);
  const transfers = requireArray(raw.transfers, 'transfers').map(parseTransfer);
  const budgets = requireArray(raw.budgets, 'budgets').map(parseBudget);
  const recurringRules = requireArray(raw.recurringRules, 'recurringRules').map(parseRecurringRule);
  // Referential integrity: every transaction must reference known account/category.
  const accountIds = new Set(accounts.map((a) => a.id));
  const categoryIds = new Set(categories.map((c) => c.id));
  for (const t of transactions) {
    if (!accountIds.has(t.accountId)) throw new BackupError(`Invalid backup: transaction ${t.id} references unknown account`);
    if (!categoryIds.has(t.categoryId)) throw new BackupError(`Invalid backup: transaction ${t.id} references unknown category`);
  }
  for (const t of transfers) {
    if (!accountIds.has(t.fromAccountId) || !accountIds.has(t.toAccountId)) throw new BackupError(`Invalid backup: transfer ${t.id} references unknown account`);
  }
  return { accounts, categories, transactions, transfers, budgets, recurringRules };
}
