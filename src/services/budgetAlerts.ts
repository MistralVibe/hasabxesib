import { crossedThresholds, allBudgetsProgress } from '@/domain/budgets';
import { monthKeyOf, startOfDayISO } from '@/domain/dates';
import { scheduleNotification, cancelNotification, ensurePermissions } from './notifications';
import { listBudgets, listTransactions, listCategories } from '@/db/repositories';
import type { TranslationPath } from '@/i18n';

// Budget alert scheduling (ticket 15). Pure status logic lives in
// src/domain/budgets.ts (crossedThresholds); this module only schedules.

// Track which alerts fired this month so we don't re-notify on every change.
const notifiedThisMonth = new Map<string, string>(); // key: `${monthKey}:${budgetId}:${status}`

export function resetNotifiedCache(): void {
  notifiedThisMonth.clear();
}

function alertId(monthKey: string, budgetId: string, status: string): string {
  return `budget-${monthKey}-${budgetId}-${status}`;
}

/** Re-evaluate budget thresholds for the current month and notify on new crossings. */
export async function refreshBudgetAlerts(t: (path: TranslationPath, params?: Record<string, string | number>) => string): Promise<void> {
  const monthKey = monthKeyOf(startOfDayISO(new Date()));
  const budgets = listBudgets();
  const transactions = listTransactions();
  const categories = listCategories();
  const already = [...notifiedThisMonth.keys()].filter((k) => k.startsWith(`${monthKey}:`));
  const crossed = crossedThresholds(budgets, transactions, monthKey, already.map((k) => k.slice(monthKey.length + 1)));

  if (crossed.length === 0) return;
  const granted = await ensurePermissions();
  for (const c of crossed) {
    const category = categories.find((x) => x.id === c.categoryId);
    const name = category?.name ?? '';
    const key = `${monthKey}:${c.budgetId}:${c.status}`;
    if (notifiedThisMonth.has(key)) continue;
    notifiedThisMonth.set(key, monthKey);
    const progress = allBudgetsProgress(budgets, transactions, monthKey).find((p) => p.budget.id === c.budgetId);
    const pct = progress ? Math.round(progress.ratio * 100) : 100;
    if (granted) {
      if (c.status === 'warning') {
        await scheduleNotification({
          id: alertId(monthKey, c.budgetId, 'warning'),
          title: t('notifications.budgetWarningTitle'),
          body: t('notifications.budgetWarningBody', { category: name, percent: pct }),
          trigger: new Date(Date.now() + 1000),
        });
      } else {
        await scheduleNotification({
          id: alertId(monthKey, c.budgetId, 'exceeded'),
          title: t('notifications.budgetExceededTitle'),
          body: t('notifications.budgetExceededBody', { category: name, percent: pct }),
          trigger: new Date(Date.now() + 1000),
        });
      }
    }
  }
}

/** Cancel all budget alert notifications (e.g. when a budget is deleted). */
export async function cancelBudgetAlert(budgetId: string): Promise<void> {
  const monthKey = monthKeyOf(startOfDayISO(new Date()));
  await cancelNotification(alertId(monthKey, budgetId, 'warning'));
  await cancelNotification(alertId(monthKey, budgetId, 'exceeded'));
}
