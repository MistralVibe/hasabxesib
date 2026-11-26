import { RecurringRule, Transaction, TransactionType } from './types';
import { advanceDate, nextDueAfter } from './dates';

function advance(iso: string, frequency: RecurringRule['frequency']): string {
  return advanceDate(iso, frequency);
}

/**
 * All due occurrences of a rule up to and including `nowISO`, excluding skipped dates.
 * Pure: does not mutate the rule.
 */
export function dueOccurrences(rule: RecurringRule, nowISO: string): string[] {
  const due: string[] = [];
  let cursor = rule.nextDueDate;
  let guard = 0;
  while (cursor <= nowISO && guard < 5000) {
    if (!rule.skippedDates.includes(cursor)) due.push(cursor);
    cursor = advance(cursor, rule.frequency);
    guard += 1;
  }
  return due;
}

/**
 * The rule's next due date after materializing everything up to `nowISO`.
 */
export function nextDueAfterMaterialize(rule: RecurringRule, nowISO: string): string {
  let cursor = rule.nextDueDate;
  let guard = 0;
  while (cursor <= nowISO && guard < 5000) {
    cursor = advance(cursor, rule.frequency);
    guard += 1;
  }
  return cursor;
}

export interface MaterializeResult {
  /** Dates that should post as real transactions now. */
  postDates: string[];
  /** The updated rule (nextDueDate advanced past nowISO). */
  updatedRule: RecurringRule;
  /** Transactions to insert, one per post date. */
  transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[];
}

/**
 * Compute the effect of auto-posting a rule on `nowISO`: which occurrences post
 * and where the rule's nextDueDate lands. Pure; the caller persists the result.
 */
export function materializeDue(rule: RecurringRule, nowISO: string): MaterializeResult {
  const postDates = dueOccurrences(rule, nowISO);
  const updatedRule: RecurringRule = { ...rule, nextDueDate: nextDueAfterMaterialize(rule, nowISO) };
  const transactions = postDates.map((date) => ({
    accountId: rule.accountId,
    categoryId: rule.categoryId,
    type: rule.type as TransactionType,
    amount: rule.amount,
    note: rule.note,
    date,
    recurringRuleId: rule.id,
  }));
  return { postDates, updatedRule, transactions };
}

/** Upcoming (not yet due) occurrences for the scheduled queue UI. */
export function upcomingOccurrences(rule: RecurringRule, fromISO: string, count: number): string[] {
  const out: string[] = [];
  let cursor = rule.nextDueDate > fromISO ? rule.nextDueDate : nextDueAfter(rule.startDate, rule.frequency, fromISO) ?? rule.nextDueDate;
  let guard = 0;
  while (out.length < count && guard < 5000) {
    if (!rule.skippedDates.includes(cursor)) out.push(cursor);
    cursor = advance(cursor, rule.frequency);
    guard += 1;
  }
  return out;
}

/** Mark one occurrence as skipped. */
export function skipOccurrence(rule: RecurringRule, dateISO: string): RecurringRule {
  if (rule.skippedDates.includes(dateISO)) return rule;
  return { ...rule, skippedDates: [...rule.skippedDates, dateISO].sort() };
}
