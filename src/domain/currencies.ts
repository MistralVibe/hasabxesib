// ISO 4217 currency list with localized display names.
// Names come from the STATIC currencyData.ts table (generated from ICU), because
// Hermes has Intl.NumberFormat/DateTimeFormat but NOT Intl.DisplayNames or
// Intl.supportedValuesOf — using those at runtime crashes the app on device.

import { CURRENCY_NAMES } from './currencyData';

export interface CurrencyInfo {
  code: string;
  name: string;
}

export function listCurrencies(locale: 'en' | 'ru' = 'en'): CurrencyInfo[] {
  return Object.entries(CURRENCY_NAMES)
    .map(([code, names]) => ({ code, name: names[locale] ?? names.en ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Localized symbol for a currency, e.g. USD in en-US -> "$". Falls back to the code. */
export function currencySymbol(code: string, locale: string): string {
  try {
    const formatted = new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(0);
    // Strip digits/separators to get the symbol portion.
    return formatted.replace(/[\d\s.,\-\u00A0]/g, '') || code;
  } catch {
    return code;
  }
}
