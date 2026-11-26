import type { SQLiteBindValue } from 'expo-sqlite';
import { getLocales } from 'expo-localization';
import { getDb } from './database';
import { PREDEFINED_CATEGORIES } from './seed';
import {
  Account, Budget, Category, RecurringRule, Settings, Transaction, Transfer,
} from '@/domain/types';

// Thin typed CRUD over expo-sqlite (ADR-0004). Row <-> domain mapping lives here.

type Row = Record<string, unknown>;

const now = () => new Date().toISOString();
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function rowToAccount(r: Row): Account {
  return {
    id: r.id as string, name: r.name as string, type: r.type as Account['type'],
    icon: r.icon as string, color: r.color as string, openingBalance: r.opening_balance as number,
    createdAt: r.created_at as string, isArchived: Boolean(r.is_archived),
  };
}
function rowToCategory(r: Row): Category {
  return {
    id: r.id as string, nameKey: (r.name_key as string | null) ?? null, name: r.name as string,
    icon: r.icon as string, color: r.color as string, type: r.type as Category['type'],
    isPredefined: Boolean(r.is_predefined), createdAt: r.created_at as string,
  };
}
function rowToTransaction(r: Row): Transaction {
  return {
    id: r.id as string, accountId: r.account_id as string, categoryId: r.category_id as string,
    type: r.type as Transaction['type'], amount: r.amount as number, note: r.note as string,
    date: r.date as string, createdAt: r.created_at as string, updatedAt: r.updated_at as string,
    recurringRuleId: (r.recurring_rule_id as string | null) ?? null,
  };
}
function rowToTransfer(r: Row): Transfer {
  return {
    id: r.id as string, fromAccountId: r.from_account_id as string, toAccountId: r.to_account_id as string,
    amount: r.amount as number, note: r.note as string, date: r.date as string, createdAt: r.created_at as string,
  };
}
function rowToBudget(r: Row): Budget {
  return {
    id: r.id as string, categoryId: r.category_id as string, amount: r.amount as number,
    createdAt: r.created_at as string, updatedAt: r.updated_at as string,
  };
}
function rowToRecurringRule(r: Row): RecurringRule {
  return {
    id: r.id as string, accountId: r.account_id as string, categoryId: r.category_id as string,
    type: r.type as RecurringRule['type'], amount: r.amount as number, note: r.note as string,
    frequency: r.frequency as RecurringRule['frequency'], startDate: r.start_date as string,
    nextDueDate: r.next_due_date as string,
    skippedDates: JSON.parse((r.skipped_dates as string) || '[]') as string[],
    isActive: Boolean(r.is_active), createdAt: r.created_at as string, updatedAt: r.updated_at as string,
  };
}

export function seedPredefinedCategoriesIfEmpty(): void {
  const db = getDb();
  const count = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM categories;')?.c ?? 0;
  if (count > 0) return;
  db.withTransactionSync(() => {
    for (const c of PREDEFINED_CATEGORIES) {
      db.runSync(
        'INSERT INTO categories (id, name_key, name, icon, color, type, is_predefined, created_at) VALUES (?,?,?,?,?,?,1,?)',
        [newId(), c.nameKey, c.name, c.icon, c.color, c.type, now()],
      );
    }
  });
}

// ---- accounts ----
export function listAccounts(): Account[] {
  return getDb().getAllSync<Row>('SELECT * FROM accounts ORDER BY created_at ASC;').map(rowToAccount);
}
export function insertAccount(a: Omit<Account, 'id' | 'createdAt'>): Account {
  const db = getDb();
  const row: Account = { ...a, id: newId(), createdAt: now() };
  db.runSync(
    'INSERT INTO accounts (id, name, type, icon, color, opening_balance, created_at, is_archived) VALUES (?,?,?,?,?,?,?,?)',
    [row.id, row.name, row.type, row.icon, row.color, row.openingBalance, row.createdAt, row.isArchived ? 1 : 0],
  );
  return row;
}
export function updateAccount(id: string, patch: Partial<Omit<Account, 'id' | 'createdAt'>>): void {
  const db = getDb();
  const sets: string[] = [];
  const vals: SQLiteBindValue[] = [];
  const map: [keyof typeof patch, string][] = [
    ['name', 'name'], ['type', 'type'], ['icon', 'icon'], ['color', 'color'],
    ['openingBalance', 'opening_balance'], ['isArchived', 'is_archived'],
  ];
  for (const [k, col] of map) {
    if (patch[k] !== undefined) {
      sets.push(`${col} = ?`);
      vals.push((k === 'isArchived' ? (patch[k] ? 1 : 0) : patch[k]) as SQLiteBindValue);
    }
  }
  if (sets.length) db.runSync(`UPDATE accounts SET ${sets.join(', ')} WHERE id = ?`, [...vals, id]);
}
export function deleteAccountIfEmpty(id: string): { ok: true } | { ok: false; error: 'accountHasActivity' } {
  const db = getDb();
  const txCount = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM transactions WHERE account_id = ?', [id])?.c ?? 0;
  const trCount = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM transfers WHERE from_account_id = ? OR to_account_id = ?', [id, id])?.c ?? 0;
  const ruleCount = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM recurring_rules WHERE account_id = ?', [id])?.c ?? 0;
  if (txCount + trCount + ruleCount > 0) return { ok: false, error: 'accountHasActivity' };
  db.runSync('DELETE FROM accounts WHERE id = ?', [id]);
  return { ok: true };
}

/** Move all activity of an account to another account, then delete it. */
export function reassignAndDeleteAccount(fromId: string, toId: string): void {
  const db = getDb();
  db.withTransactionSync(() => {
    db.runSync('UPDATE transactions SET account_id = ? WHERE account_id = ?', [toId, fromId]);
    db.runSync('UPDATE transfers SET from_account_id = ? WHERE from_account_id = ?', [toId, fromId]);
    db.runSync('UPDATE transfers SET to_account_id = ? WHERE to_account_id = ?', [toId, fromId]);
    db.runSync('UPDATE recurring_rules SET account_id = ? WHERE account_id = ?', [toId, fromId]);
    db.runSync('DELETE FROM accounts WHERE id = ?', [fromId]);
  });
}

// ---- categories ----
export function listCategories(): Category[] {
  return getDb().getAllSync<Row>('SELECT * FROM categories ORDER BY is_predefined DESC, name ASC;').map(rowToCategory);
}
export function insertCategory(c: Omit<Category, 'id' | 'createdAt' | 'isPredefined'>): Category {
  const db = getDb();
  const row: Category = { ...c, id: newId(), isPredefined: false, createdAt: now() };
  db.runSync(
    'INSERT INTO categories (id, name_key, name, icon, color, type, is_predefined, created_at) VALUES (?,?,?,?,?,?,0,?)',
    [row.id, row.nameKey, row.name, row.icon, row.color, row.type, row.createdAt],
  );
  return row;
}

// ---- transactions ----
export function listTransactions(): Transaction[] {
  return getDb().getAllSync<Row>('SELECT * FROM transactions ORDER BY date DESC, created_at DESC;').map(rowToTransaction);
}
export function insertTransaction(t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction {
  const db = getDb();
  const row: Transaction = { ...t, id: newId(), createdAt: now(), updatedAt: now() };
  db.runSync(
    `INSERT INTO transactions (id, account_id, category_id, type, amount, note, date, created_at, updated_at, recurring_rule_id)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [row.id, row.accountId, row.categoryId, row.type, row.amount, row.note, row.date, row.createdAt, row.updatedAt, row.recurringRuleId],
  );
  return row;
}
export function updateTransaction(id: string, patch: Partial<Omit<Transaction, 'id' | 'createdAt'>>): void {
  const db = getDb();
  const sets: string[] = [];
  const vals: SQLiteBindValue[] = [];
  const map: [keyof typeof patch, string][] = [
    ['accountId', 'account_id'], ['categoryId', 'category_id'], ['type', 'type'],
    ['amount', 'amount'], ['note', 'note'], ['date', 'date'], ['recurringRuleId', 'recurring_rule_id'],
  ];
  for (const [k, col] of map) {
    if (patch[k] !== undefined) { sets.push(`${col} = ?`); vals.push(patch[k] as SQLiteBindValue); }
  }
  if (sets.length) {
    sets.push('updated_at = ?'); vals.push(now());
    db.runSync(`UPDATE transactions SET ${sets.join(', ')} WHERE id = ?`, [...vals, id]);
  }
}
export function deleteTransaction(id: string): void {
  getDb().runSync('DELETE FROM transactions WHERE id = ?', [id]);
}

// ---- transfers ----
export function listTransfers(): Transfer[] {
  return getDb().getAllSync<Row>('SELECT * FROM transfers ORDER BY date DESC, created_at DESC;').map(rowToTransfer);
}
export function insertTransfer(t: Omit<Transfer, 'id' | 'createdAt'>): Transfer {
  const db = getDb();
  const row: Transfer = { ...t, id: newId(), createdAt: now() };
  db.runSync(
    'INSERT INTO transfers (id, from_account_id, to_account_id, amount, note, date, created_at) VALUES (?,?,?,?,?,?,?)',
    [row.id, row.fromAccountId, row.toAccountId, row.amount, row.note, row.date, row.createdAt],
  );
  return row;
}

// ---- budgets ----
export function listBudgets(): Budget[] {
  return getDb().getAllSync<Row>('SELECT * FROM budgets ORDER BY created_at ASC;').map(rowToBudget);
}
export function upsertBudget(b: { id?: string; categoryId: string; amount: number }): Budget {
  const db = getDb();
  const existing = b.id ? db.getFirstSync<Row>('SELECT * FROM budgets WHERE id = ?', [b.id]) : db.getFirstSync<Row>('SELECT * FROM budgets WHERE category_id = ?', [b.categoryId]);
  const ts = now();
  if (existing) {
    db.runSync('UPDATE budgets SET amount = ?, updated_at = ? WHERE id = ?', [b.amount, ts, existing.id as string]);
    return { id: existing.id as string, categoryId: existing.category_id as string, amount: b.amount, createdAt: existing.created_at as string, updatedAt: ts };
  }
  const row: Budget = { id: newId(), categoryId: b.categoryId, amount: b.amount, createdAt: ts, updatedAt: ts };
  db.runSync('INSERT INTO budgets (id, category_id, amount, created_at, updated_at) VALUES (?,?,?,?,?)',
    [row.id, row.categoryId, row.amount, row.createdAt, row.updatedAt]);
  return row;
}
export function deleteBudget(id: string): void {
  getDb().runSync('DELETE FROM budgets WHERE id = ?', [id]);
}

// ---- recurring rules ----
export function listRecurringRules(): RecurringRule[] {
  return getDb().getAllSync<Row>('SELECT * FROM recurring_rules ORDER BY next_due_date ASC;').map(rowToRecurringRule);
}
export function insertRecurringRule(r: Omit<RecurringRule, 'id' | 'createdAt' | 'updatedAt'>): RecurringRule {
  const db = getDb();
  const row: RecurringRule = { ...r, id: newId(), createdAt: now(), updatedAt: now() };
  db.runSync(
    `INSERT INTO recurring_rules (id, account_id, category_id, type, amount, note, frequency, start_date, next_due_date, skipped_dates, is_active, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [row.id, row.accountId, row.categoryId, row.type, row.amount, row.note, row.frequency, row.startDate, row.nextDueDate, JSON.stringify(row.skippedDates), row.isActive ? 1 : 0, row.createdAt, row.updatedAt],
  );
  return row;
}
export function updateRecurringRule(id: string, patch: Partial<Omit<RecurringRule, 'id' | 'createdAt'>>): void {
  const db = getDb();
  const sets: string[] = [];
  const vals: SQLiteBindValue[] = [];
  const map: [keyof typeof patch, string, boolean][] = [
    ['accountId', 'account_id', false], ['categoryId', 'category_id', false], ['type', 'type', false],
    ['amount', 'amount', false], ['note', 'note', false], ['frequency', 'frequency', false],
    ['startDate', 'start_date', false], ['nextDueDate', 'next_due_date', false],
    ['skippedDates', 'skipped_dates', true], ['isActive', 'is_active', false],
  ];
  for (const [k, col, isJson] of map) {
    if (patch[k] !== undefined) {
      sets.push(`${col} = ?`);
      let v: SQLiteBindValue = patch[k] as SQLiteBindValue;
      if (isJson) v = JSON.stringify(v);
      if (k === 'isActive') v = v ? 1 : 0;
      vals.push(v);
    }
  }
  if (sets.length) {
    sets.push('updated_at = ?'); vals.push(now());
    db.runSync(`UPDATE recurring_rules SET ${sets.join(', ')} WHERE id = ?`, [...vals, id]);
  }
}
export function deleteRecurringRule(id: string): void {
  getDb().runSync('DELETE FROM recurring_rules WHERE id = ?', [id]);
}

// ---- settings ----
export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  currency: 'USD',
  theme: 'system',
  language: 'en',
  lockEnabled: false,
  reminderEnabled: false,
  reminderTime: '20:00',
  notifiedAlerts: '{}',
};

export function getSettings(): Settings {
  const db = getDb();
  const rows = db.getAllSync<{ key: string; value: string }>('SELECT key, value FROM settings;');
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    onboarded: map.get('onboarded') === 'true',
    currency: map.get('currency') ?? DEFAULT_SETTINGS.currency,
    theme: (map.get('theme') as Settings['theme']) ?? DEFAULT_SETTINGS.theme,
    language: (map.get('language') as Settings['language']) ?? (getLocales()[0]?.languageCode === 'ru' ? 'ru' : 'en'),
    lockEnabled: map.get('lockEnabled') === 'true',
    reminderEnabled: map.get('reminderEnabled') === 'true',
    reminderTime: map.get('reminderTime') ?? DEFAULT_SETTINGS.reminderTime,
    notifiedAlerts: map.get('notifiedAlerts') ?? DEFAULT_SETTINGS.notifiedAlerts,
  };
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  const db = getDb();
  const stored = typeof value === 'boolean' ? String(value) : String(value);
  db.runSync('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, stored]);
}

// ---- backup / restore ----
export function replaceAllData(data: {
  accounts: Account[]; categories: Category[]; transactions: Transaction[];
  transfers: Transfer[]; budgets: Budget[]; recurringRules: RecurringRule[];
}): void {
  const db = getDb();
  db.withTransactionSync(() => {
    for (const t of ['transactions', 'transfers', 'budgets', 'recurring_rules', 'accounts', 'categories']) {
      db.runSync(`DELETE FROM ${t};`);
    }
    for (const a of data.accounts) {
      db.runSync('INSERT INTO accounts (id, name, type, icon, color, opening_balance, created_at, is_archived) VALUES (?,?,?,?,?,?,?,?)',
        [a.id, a.name, a.type, a.icon, a.color, a.openingBalance, a.createdAt, a.isArchived ? 1 : 0]);
    }
    for (const c of data.categories) {
      db.runSync('INSERT INTO categories (id, name_key, name, icon, color, type, is_predefined, created_at) VALUES (?,?,?,?,?,?,?,?)',
        [c.id, c.nameKey, c.name, c.icon, c.color, c.type, c.isPredefined ? 1 : 0, c.createdAt]);
    }
    for (const t of data.transactions) {
      db.runSync('INSERT INTO transactions (id, account_id, category_id, type, amount, note, date, created_at, updated_at, recurring_rule_id) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [t.id, t.accountId, t.categoryId, t.type, t.amount, t.note, t.date, t.createdAt, t.updatedAt, t.recurringRuleId]);
    }
    for (const t of data.transfers) {
      db.runSync('INSERT INTO transfers (id, from_account_id, to_account_id, amount, note, date, created_at) VALUES (?,?,?,?,?,?,?)',
        [t.id, t.fromAccountId, t.toAccountId, t.amount, t.note, t.date, t.createdAt]);
    }
    for (const b of data.budgets) {
      db.runSync('INSERT INTO budgets (id, category_id, amount, created_at, updated_at) VALUES (?,?,?,?,?)',
        [b.id, b.categoryId, b.amount, b.createdAt, b.updatedAt]);
    }
    for (const r of data.recurringRules) {
      db.runSync('INSERT INTO recurring_rules (id, account_id, category_id, type, amount, note, frequency, start_date, next_due_date, skipped_dates, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [r.id, r.accountId, r.categoryId, r.type, r.amount, r.note, r.frequency, r.startDate, r.nextDueDate, JSON.stringify(r.skippedDates), r.isActive ? 1 : 0, r.createdAt, r.updatedAt]);
    }
  });
}
