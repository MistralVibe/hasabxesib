import { addDays, addMonths, addYears, monthKeyOf, monthBounds, nextDueAfter, startOfDayISO, timeOfDayBucket } from '../dates';

describe('month helpers', () => {
  it('monthKeyOf returns yyyy-mm', () => {
    expect(monthKeyOf('2026-11-05')).toBe('2026-11');
    expect(monthKeyOf('2026-01-31')).toBe('2026-01');
  });

  it('monthBounds returns inclusive start and end of month', () => {
    expect(monthBounds('2026-11')).toEqual({ start: '2026-11-01', end: '2026-11-30' });
    expect(monthBounds('2026-02')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
    expect(monthBounds('2024-02')).toEqual({ start: '2024-02-01', end: '2024-02-29' }); // leap year
  });
});

describe('date arithmetic', () => {
  it('addDays crosses month boundary', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
  });

  it('addMonths clamps to end of month', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2026-03-31', 1)).toBe('2026-04-30');
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15');
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15');
  });

  it('addYears handles leap day', () => {
    expect(addYears('2024-02-29', 1)).toBe('2025-02-28');
    expect(addYears('2024-02-29', 4)).toBe('2028-02-29');
  });
});

describe('nextDueAfter', () => {
  it('daily advances by days', () => {
    expect(nextDueAfter('2026-11-01', 'daily', '2026-11-10')).toBe('2026-11-11');
  });

  it('weekly advances by 7 days', () => {
    expect(nextDueAfter('2026-11-01', 'weekly', '2026-11-10')).toBe('2026-11-15');
    expect(nextDueAfter('2026-11-01', 'weekly', '2026-11-08')).toBe('2026-11-15');
    expect(nextDueAfter('2026-11-01', 'weekly', '2026-11-15')).toBe('2026-11-22');
  });

  it('monthly keeps day of month', () => {
    expect(nextDueAfter('2026-01-15', 'monthly', '2026-11-10')).toBe('2026-11-15');
  });

  it('monthly clamps the 31st to shorter months and keeps the clamped day', () => {
    expect(nextDueAfter('2026-01-31', 'monthly', '2026-11-10')).toBe('2026-11-28');
    expect(nextDueAfter('2026-01-31', 'monthly', '2026-12-31')).toBe('2027-01-28');
    expect(nextDueAfter('2026-01-31', 'monthly', '2027-02-10')).toBe('2027-02-28');
  });

  it('yearly keeps month and day', () => {
    expect(nextDueAfter('2025-06-15', 'yearly', '2026-11-10')).toBe('2027-06-15');
  });

  it('returns the start date itself when it is already after the given date', () => {
    expect(nextDueAfter('2026-11-20', 'daily', '2026-11-10')).toBe('2026-11-20');
  });
});

describe('startOfDayISO', () => {
  it('returns local yyyy-mm-dd', () => {
    expect(startOfDayISO(new Date(2026, 10, 26, 15, 45))).toBe('2026-11-26');
  });
});

describe('timeOfDayBucket', () => {
  const at = (hour: number) => new Date(2026, 10, 26, hour, 30);

  it('maps the day into four greeting buckets', () => {
    expect(timeOfDayBucket(at(0))).toBe('night');
    expect(timeOfDayBucket(at(4))).toBe('night');
    expect(timeOfDayBucket(at(5))).toBe('morning');
    expect(timeOfDayBucket(at(11))).toBe('morning');
    expect(timeOfDayBucket(at(12))).toBe('afternoon');
    expect(timeOfDayBucket(at(17))).toBe('afternoon');
    expect(timeOfDayBucket(at(18))).toBe('evening');
    expect(timeOfDayBucket(at(23))).toBe('evening');
  });
});
