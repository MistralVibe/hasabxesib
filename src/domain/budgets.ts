import { Budget, Money, Transaction } from './types';
import { isInMonth } from './transactions';

export const WARNING_RATIO = 0.8;

export type BudgetStatus = 'ok' | 'warning' | 'exceeded';

/** Sum of expense transactions in a category for a month, in minor units. */
export function spentForCategory(transactions: Transaction[], categoryId: string, monthKey: string): Money {
  return transactions
    .filter((t) => t.type === 'expense' && t.categoryId === categoryId && isInMonth(t.date, monthKey))
    .reduce((sum, t) => sum + t.amount, 0);
}

/** Sum of ALL expense transactions in a month, in minor units (any category). */
export function spentInMonth(transactions: Transaction[], monthKey: string): Money {
  return transactions
    .filter((t) => t.type === 'expense' && isInMonth(t.date, monthKey))
    .reduce((sum, t) => sum + t.amount, 0);
}

export interface BudgetProgress {
  budget: Budget;
  spent: Money;
  cap: Money;
  ratio: number;
  status: BudgetStatus;
}

export function budgetProgress(budget: Budget, spent: Money): BudgetProgress {
  const ratio = budget.amount > 0 ? spent / budget.amount : spent > 0 ? Infinity : 0;
  const status: BudgetStatus = ratio >= 1 ? 'exceeded' : ratio >= WARNING_RATIO ? 'warning' : 'ok';
  return { budget, spent, cap: budget.amount, ratio, status };
}

export function allBudgetsProgress(
  budgets: Budget[],
  transactions: Transaction[],
  monthKey: string,
): BudgetProgress[] {
  return budgets.map((b) => budgetProgress(b, spentForCategory(transactions, b.categoryId, monthKey)));
}

export interface MonthBudgetSummary {
  totalBudget: Money;
  totalSpent: Money;
  ratio: number;
  status: BudgetStatus;
}

export function monthBudgetSummary(budgets: Budget[], transactions: Transaction[], monthKey: string): MonthBudgetSummary {
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  // Total spent this month counts ALL expenses (budgeted or not) — the home card
  // must not show "0 spent" while the user spent money in unbudgeted categories.
  const totalSpent = spentInMonth(transactions, monthKey);
  const ratio = totalBudget > 0 ? totalSpent / totalBudget : totalSpent > 0 ? Infinity : 0;
  const status: BudgetStatus = ratio >= 1 ? 'exceeded' : ratio >= WARNING_RATIO ? 'warning' : 'ok';
  return { totalBudget, totalSpent, ratio, status };
}

/** Categories that crossed a threshold since the last check: for notification scheduling. */
export function crossedThresholds(
  budgets: Budget[],
  transactions: Transaction[],
  monthKey: string,
  alreadyNotified: string[], // `${budgetId}:${status}` already alerted this month
): { budgetId: string; categoryId: string; status: BudgetStatus }[] {
  return allBudgetsProgress(budgets, transactions, monthKey)
    .filter((p) => p.status !== 'ok' && !alreadyNotified.includes(`${p.budget.id}:${p.status}`))
    .map((p) => ({ budgetId: p.budget.id, categoryId: p.budget.categoryId, status: p.status }));
}
