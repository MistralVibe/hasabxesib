import { crossedThresholds, allBudgetsProgress } from '@/domain/budgets';
import { monthKeyOf, startOfDayISO } from '@/domain/dates';
import { formatMoney } from '@/domain/money';
import { getLocales } from 'expo-localization';
import { scheduleNotification, cancelNotification, ensurePermissions } from './notifications';
import { listBudgets, listTransactions, listCategories, getSettings, setSetting } from '@/db/repositories';
import type { TranslationPath } from '@/i18n';
import { Category } from '@/domain/types';

// Budget alert scheduling (ticket 15). Pure status logic lives in
// src/domain/budgets.ts (crossedThresholds); this module only schedules.
// Fired-alert keys persist in settings so restarts don't re-notify.

function alertId(monthKey: string, budgetId: string, status: string): string {
  return `budget-${monthKey}-${budgetId}-${status}`;
}

function loadNotified(): Map<string, string> {
  try {
    return new Map(Object.entries(JSON.parse(getSettings().notifiedAlerts || '{}')));
  } catch {
    return new Map();
  }
}

function saveNotified(map: Map<string, string>): void {
  setSetting('notifiedAlerts', JSON.stringify(Object.fromEntries(map)));
}

function categoryName(category: Category | undefined, t: (p: TranslationPath, params?: Record<string, string | number>) => string): string {
  if (!category) return '';
  return category.nameKey ? t(`categories.${category.nameKey.split('.')[1]}` as never) : category.name;
}

/** Re-evaluate budget thresholds for the current month and notify on new crossings. */
export async function refreshBudgetAlerts(t: (path: TranslationPath, params?: Record<string, string | number>) => string): Promise<void> {
  const monthKey = monthKeyOf(startOfDayISO(new Date()));
  const budgets = listBudgets();
  const transactions = listTransactions();
  const categories = listCategories();
  const notified = loadNotified();
  const already = [...notified.keys()].filter((k) => k.startsWith(`${monthKey}:`)).map((k) => k.slice(monthKey.length + 1));
  const crossed = crossedThresholds(budgets, transactions, monthKey, already);

  if (crossed.length === 0) return;
  const granted = await ensurePermissions();
  const progress = allBudgetsProgress(budgets, transactions, monthKey);
  const currency = getSettings().currency;
  const locale = getLocales()[0]?.languageTag ?? 'en-US';
  for (const c of crossed) {
    const category = categories.find((x) => x.id === c.categoryId);
    const name = categoryName(category, t);
    const key = `${monthKey}:${c.budgetId}:${c.status}`;
    if (notified.has(key)) continue;
    notified.set(key, monthKey);
    const p = progress.find((x) => x.budget.id === c.budgetId);
    const pct = p ? Math.round(p.ratio * 100) : 100;
    if (granted) {
      if (c.status === 'warning') {
        await scheduleNotification({
          id: alertId(monthKey, c.budgetId, 'warning'),
          title: t('notifications.budgetWarningTitle'),
          body: t('notifications.budgetWarningBody', { category: name, percent: pct, amount: formatMoney(p?.cap ?? 0, currency, locale) }),
          trigger: new Date(Date.now() + 1000),
        });
      } else {
        await scheduleNotification({
          id: alertId(monthKey, c.budgetId, 'exceeded'),
          title: t('notifications.budgetExceededTitle'),
          body: t('notifications.budgetExceededBody', { category: name, percent: pct, amount: formatMoney(Math.max(0, (p?.spent ?? 0) - (p?.cap ?? 0)), currency, locale) }),
          trigger: new Date(Date.now() + 1000),
        });
      }
    }
  }
  saveNotified(notified);
}

/** Cancel all budget alert notifications for a budget (e.g. when it is deleted). */
export async function cancelBudgetAlert(budgetId: string): Promise<void> {
  const monthKey = monthKeyOf(startOfDayISO(new Date()));
  await cancelNotification(alertId(monthKey, budgetId, 'warning'));
  await cancelNotification(alertId(monthKey, budgetId, 'exceeded'));
}
