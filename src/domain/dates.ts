import { RecurringFrequency } from './types';

// All dates are local calendar dates in ISO "yyyy-mm-dd" form. No timezones.

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfDayISO(d: Date): string {
  return toISODate(d);
}

export function parseISODate(iso: string): Date {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day);
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

function daysInMonth(year: number, month1: number): number {
  return new Date(year, month1, 0).getDate();
}

export function addMonths(iso: string, months: number): string {
  const d = parseISODate(iso);
  const targetMonthIndex = d.getMonth() + months;
  const year = d.getFullYear() + Math.floor(targetMonthIndex / 12);
  const month = ((targetMonthIndex % 12) + 12) % 12;
  const day = Math.min(d.getDate(), daysInMonth(year, month + 1));
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function addYears(iso: string, years: number): string {
  return addMonths(iso, years * 12);
}

export function monthKeyOf(iso: string): string {
  return iso.slice(0, 7);
}

export function monthBounds(key: string): { start: string; end: string } {
  const [y, m] = key.split('-').map(Number);
  return { start: `${key}-01`, end: `${key}-${pad(daysInMonth(y, m))}` };
}

/** Advance a date by one step of the frequency (shared by recurring rules). */
export function advanceDate(iso: string, frequency: RecurringFrequency): string {
  switch (frequency) {
    case 'daily':
      return addDays(iso, 1);
    case 'weekly':
      return addDays(iso, 7);
    case 'monthly':
      return addMonths(iso, 1);
    case 'yearly':
      return addYears(iso, 1);
  }
}

/**
 * The first occurrence strictly after `fromISO` for a rule that started at `startISO`.
 * Returns null when the next occurrence is not after `fromISO`.
 */
export function nextDueAfter(startISO: string, frequency: RecurringFrequency, fromISO: string): string | null {
  let candidate = startISO;
  // Advance in bounded steps until we pass fromISO (max 5000 iterations guards runaway loops).
  for (let i = 0; i < 5000; i++) {
    if (candidate > fromISO) return candidate;
    candidate = advanceDate(candidate, frequency);
  }
  return null;
}
