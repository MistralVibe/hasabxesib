import { useCallback, useMemo } from 'react';
import { formatMoney, formatSignedMoney } from '@/domain/money';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useI18n } from '@/i18n';

const LOCALE_FOR: Record<string, string> = { en: 'en-US', ru: 'ru-RU' };

/** Currency/locale-aware formatters bound to the current settings + language. */
export function useFormatters() {
  const currency = useSettingsStore((s) => s.settings.currency);
  const language = useI18n().language;
  const locale = LOCALE_FOR[language] ?? 'en-US';

  const money = useCallback((minor: number) => formatMoney(minor, currency, locale), [currency, locale]);
  const signed = useCallback((minor: number) => formatSignedMoney(minor, currency, locale), [currency, locale]);

  return useMemo(() => ({ money, signed, currency, locale }), [money, signed, currency, locale]);
}
