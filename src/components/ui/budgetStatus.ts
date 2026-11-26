import { BudgetStatus } from '@/domain/budgets';
import { TranslationPath } from '@/i18n';

type StatusColors = { ok: string; warning: string; danger: string };

export function budgetStatusColor(status: BudgetStatus, c: StatusColors): string {
  return status === 'exceeded' ? c.danger : status === 'warning' ? c.warning : c.ok;
}

export function budgetStatusLabel(status: BudgetStatus, t: (p: TranslationPath) => string): string {
  return status === 'exceeded'
    ? t('budgets.statusExceeded')
    : status === 'warning'
      ? t('budgets.statusWarning')
      : t('budgets.statusOk');
}
