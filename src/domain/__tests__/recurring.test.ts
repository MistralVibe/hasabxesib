import { dueOccurrences, materializeDue, nextDueAfterMaterialize, skipOccurrence, upcomingOccurrences } from '../recurring';
import { RecurringRule } from '../types';

const rule = (partial: Partial<RecurringRule>): RecurringRule => ({
  id: 'r1', accountId: 'a1', categoryId: 'c-sub', type: 'expense', amount: 999,
  note: 'Gym', frequency: 'monthly', startDate: '2026-01-31', nextDueDate: '2026-01-31',
  skippedDates: [], isActive: true, createdAt: '', updatedAt: '', ...partial,
});

describe('dueOccurrences', () => {
  it('returns all unskipped occurrences up to and including now', () => {
    const r = rule({ nextDueDate: '2026-11-30' });
    expect(dueOccurrences(r, '2026-12-05')).toEqual(['2026-11-30']);
    expect(dueOccurrences(r, '2026-12-31')).toEqual(['2026-11-30', '2026-12-31']);
  });

  it('excludes skipped dates', () => {
    const r = rule({ nextDueDate: '2026-11-30', skippedDates: ['2026-11-30'] });
    expect(dueOccurrences(r, '2026-12-05')).toEqual([]);
    expect(dueOccurrences(r, '2026-12-31')).toEqual(['2026-12-31']);
  });

  it('returns empty when nothing is due', () => {
    const r = rule({ nextDueDate: '2027-01-31' });
    expect(dueOccurrences(r, '2026-12-05')).toEqual([]);
  });
});

describe('materializeDue', () => {
  it('posts each due occurrence once and advances nextDueDate past now', () => {
    const r = rule({ frequency: 'weekly', startDate: '2026-11-01', nextDueDate: '2026-11-01' });
    const result = materializeDue(r, '2026-11-20', () => 'id');
    expect(result.postDates).toEqual(['2026-11-01', '2026-11-08', '2026-11-15']);
    expect(result.updatedRule.nextDueDate).toBe('2026-11-22');
    expect(result.transactions).toHaveLength(3);
    expect(result.transactions[0]).toMatchObject({
      accountId: 'a1', categoryId: 'c-sub', type: 'expense', amount: 999, date: '2026-11-01', recurringRuleId: 'r1',
    });
    // original rule untouched (pure)
    expect(r.nextDueDate).toBe('2026-11-01');
  });

  it('monthly clamps Jan 31 across months', () => {
    const r = rule({ frequency: 'monthly', startDate: '2026-01-31', nextDueDate: '2026-01-31' });
    const result = materializeDue(r, '2026-04-05', () => 'id');
    expect(result.postDates).toEqual(['2026-01-31', '2026-02-28', '2026-03-28']);
    expect(nextDueAfterMaterialize(r, '2026-04-05')).toBe('2026-04-28');
  });
});

describe('skipOccurrence / upcomingOccurrences', () => {
  it('skip marks a date and is idempotent', () => {
    const r = rule({ nextDueDate: '2026-11-30' });
    const skipped = skipOccurrence(r, '2026-11-30');
    expect(skipped.skippedDates).toEqual(['2026-11-30']);
    expect(skipOccurrence(skipped, '2026-11-30').skippedDates).toEqual(['2026-11-30']);
  });

  it('upcomingOccurrences lists future dates excluding skipped', () => {
    const r = rule({ frequency: 'monthly', startDate: '2026-09-30', nextDueDate: '2026-11-30', skippedDates: ['2026-12-31'] });
    expect(upcomingOccurrences(r, '2026-11-26', 3)).toEqual(['2026-11-30', '2027-01-31', '2027-02-28']);
  });
});
