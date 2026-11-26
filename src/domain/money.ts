// Money helpers. Money is integer minor units (ADR-0003); decimal conversion
// happens only here, at the UI boundary.

export const ZERO_DECIMAL_CURRENCIES = new Set([
  'JPY', 'KRW', 'VND', 'CLP', 'ISK', 'UGX', 'DJF', 'GNF', 'KMF', 'MGA', 'PYG', 'RWF', 'XAF', 'XOF', 'XPF',
]);

function exponentFor(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 0 : 2;
}

/**
 * Convert a user-entered decimal string ("12.34", "1 234,56") to minor units.
 * Rounds half-up. Returns null for unparseable input.
 */
export function toMinor(input: string, currency: string): number | null {
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const exp = exponentFor(currency);
  const [intPart, fracPart = ''] = normalized.split('.');
  if (exp === 0) {
    let minor = Number(intPart);
    if (fracPart.length > 0 && Number(fracPart[0]) >= 5) minor += 1;
    return minor;
  }
  const frac = (fracPart + '0'.repeat(exp)).slice(0, exp);
  let minor = Number(intPart) * 10 ** exp + Number(frac || '0');
  if (fracPart.length > exp && Number(fracPart[exp]) >= 5) minor += 1;
  return minor;
}

/**
 * Parse an amount input into a positive decimal number, or null when invalid.
 */
export function parseAmountInput(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return value > 0 ? value : null;
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string, locale: string): Intl.NumberFormat {
  const key = `${currency}|${locale}`;
  let fmt = formatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, { style: 'currency', currency });
    formatterCache.set(key, fmt);
  }
  return fmt;
}

/**
 * Format minor units as a localized currency string, e.g. 123456 USD en-US -> "$1,234.56".
 */
export function formatMoney(minor: number, currency: string, locale: string): string {
  const value = minor / 10 ** exponentFor(currency);
  return formatterFor(currency.toUpperCase(), locale).format(value);
}

/** Format with an explicit sign for income/expense display: +$12.00 / -$12.00 */
export function formatSignedMoney(minor: number, currency: string, locale: string): string {
  const body = formatMoney(Math.abs(minor), currency, locale);
  if (minor === 0) return body;
  return minor > 0 ? `+${body}` : `-${body}`;
}
