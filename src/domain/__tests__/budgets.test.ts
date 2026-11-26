import { allBudgetsProgress, budgetProgress, crossedThresholds, monthBudgetSummary, spentForCategory, WARNING_RATIO } from '../budgets';
import { Budget, Transaction } from '../types';

const budget: Budget = { id: 'b1', categoryId: 'c-food', amount: 10000, createdAt: '', updatedAt: '' };

const tx = (amount: number, categoryId = 'c-food', date = '2026-11-10', type: 'expense' | 'income' = 'expense'): Transaction => ({
  id: Math.random().toString(36).slice(2), accountId: 'a1', categoryId, type, amount,
  note: '', date, createdAt: '', updatedAt: '', recurringRuleId: null,
});

describe('spentForCategory', () => {
  it('sums only expense transactions of the category in the month', () => {
    const txs = [
      tx(3000), tx(2500), tx(1000, 'c-food', '2026-10-31'), // other month
      tx(9999, 'c-other'), tx(5000, 'c-food', '2026-11-01', 'income'), // income excluded
    ];
    expect(spentForCategory(txs, 'c-food', '2026-11')).toBe(5500);
  });
});

describe('budgetProgress', () => {
  it('status thresholds: <80% ok, >=80% warning, >=100% exceeded', () => {
    expect(budgetProgress(budget, 7999).status).toBe('ok');
    expect(budgetProgress(budget, 8000).status).toBe('warning'); // exactly 80%
    expect(budgetProgress(budget, 9999).status).toBe('warning');
    expect(budgetProgress(budget, 10000).status).toBe('exceeded'); // exactly 100%
    expect(budgetProgress(budget, 12000).status).toBe('exceeded');
    expect(WARNING_RATIO).toBe(0.8);
  });

  it('ratio is spent/cap', () => {
    expect(budgetProgress(budget, 2500).ratio).toBeCloseTo(0.25);
  });
});

describe('monthBudgetSummary', () => {
  it('aggregates across budgets for the month', () => {
    const budgets = [budget, { ...budget, id: 'b2', categoryId: 'c-transport', amount: 5000 }];
    const txs = [tx(7000, 'c-food'), tx(5000, 'c-transport')];
    const summary = monthBudgetSummary(budgets, txs, '2026-11');
    expect(summary.totalBudget).toBe(15000);
    expect(summary.totalSpent).toBe(12000);
    expect(summary.status).toBe('warning'); // 12000/15000 = 0.8 exactly
  });
});

describe('allBudgetsProgress + crossedThresholds', () => {
  it('reports progress per budget and only new threshold crossings', () => {
    const budgets = [budget];
    const txs = [tx(8500, 'c-food')];
    const progress = allBudgetsProgress(budgets, txs, '2026-11');
    expect(progress[0].status).toBe('warning');
    const crossed = crossedThresholds(budgets, txs, '2026-11', []);
    expect(crossed).toEqual([{ budgetId: 'b1', categoryId: 'c-food', status: 'warning' }]);
    const crossedAgain = crossedThresholds(budgets, txs, '2026-11', ['b1:warning']);
    expect(crossedAgain).toEqual([]);
  });
});
