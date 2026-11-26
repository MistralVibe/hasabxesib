// Canonical domain types for HasabXesib. See GLOSSARY.md.
// Money is always integer minor units (ADR-0003): 1234 = 12.34 in the base currency.

/** Amount in minor units of the base currency. Always an integer. */
export type Money = number;

export type Id = string;

export type TransactionType = 'income' | 'expense';

export interface Account {
  id: Id;
  name: string;
  type: 'cash' | 'card' | 'bank';
  icon: string; // Ionicons name
  color: string;
  /** Opening balance in minor units, set when the account is created. */
  openingBalance: Money;
  createdAt: string; // ISO timestamp
  /** false when soft-deleted */
  isArchived: boolean;
}

export interface Category {
  id: Id;
  nameKey: string | null; // i18n key for predefined categories, null for custom
  name: string; // display name (localized for predefined, literal for custom)
  icon: string; // Ionicons name
  color: string;
  type: TransactionType;
  isPredefined: boolean;
  createdAt: string;
}

export interface Transaction {
  id: Id;
  accountId: Id;
  categoryId: Id;
  type: TransactionType;
  /** Positive minor units. */
  amount: Money;
  note: string;
  /** ISO date (yyyy-mm-dd) */
  date: string;
  createdAt: string;
  updatedAt: string;
  /** Set when posted by a recurring rule */
  recurringRuleId: Id | null;
}

export interface Transfer {
  id: Id;
  fromAccountId: Id;
  toAccountId: Id;
  /** Positive minor units. */
  amount: Money;
  note: string;
  date: string;
  createdAt: string;
}

export interface Budget {
  id: Id;
  categoryId: Id;
  /** Monthly cap in minor units. */
  amount: Money;
  createdAt: string;
  updatedAt: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringRule {
  id: Id;
  accountId: Id;
  categoryId: Id;
  type: TransactionType;
  amount: Money;
  note: string;
  frequency: RecurringFrequency;
  /** ISO date (yyyy-mm-dd) of the first occurrence */
  startDate: string;
  /** ISO date (yyyy-mm-dd) of the next occurrence that has not yet posted */
  nextDueDate: string;
  /** ISO dates (yyyy-mm-dd) of occurrences the user skipped */
  skippedDates: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ThemeSetting = 'system' | 'light' | 'dark';

export interface Settings {
  onboarded: boolean;
  currency: string; // ISO 4217 code, e.g. "USD"
  theme: ThemeSetting;
  language: 'en' | 'ru';
  lockEnabled: boolean;
  reminderEnabled: boolean;
  /** "HH:MM" 24h local time */
  reminderTime: string;
}
