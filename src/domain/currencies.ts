// Full ISO 4217 currency list from ICU, with localized display names.
// Intl objects are created once at module scope (hoisted) per performance rules.

export interface CurrencyInfo {
  code: string;
  name: string;
}

const codes: string[] = typeof Intl.supportedValuesOf === 'function'
  ? Intl.supportedValuesOf('currency')
  : ['USD', 'EUR', 'RUB', 'AZN'];

const nameEn = new Intl.DisplayNames(['en'], { type: 'currency' });
const nameRu = new Intl.DisplayNames(['ru'], { type: 'currency' });

function nameFor(code: string, locale: 'en' | 'ru'): string {
  const dn = locale === 'ru' ? nameRu : nameEn;
  return dn.of(code) ?? code;
}

export function listCurrencies(locale: 'en' | 'ru' = 'en'): CurrencyInfo[] {
  return codes.map((code) => ({ code, name: nameFor(code, locale) })).sort((a, b) => a.name.localeCompare(b.name));
}

/** Localized symbol for a currency, e.g. USD in en -> "$", in ru -> "$" (or "долл. США" style fallback). */
export function currencySymbol(code: string, locale: string): string {
  const formatted = new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(0);
  // Strip digits/separators to get the symbol portion.
  return formatted.replace(/[\d\s.,\-\u00A0]/g, '') || code;
}
