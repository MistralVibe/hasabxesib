import React, { createContext, useContext, useMemo } from 'react';
import { getLocales } from 'expo-localization';
import { en } from './en';
import { ru } from './ru';
import { useSettingsStore } from '@/stores/useSettingsStore';

export type Language = 'en' | 'ru';

const dictionaries = { en, ru } as const;

type NestedKeyOf<T> = T extends object
  ? { [K in keyof T & string]: T[K] extends object ? `${K}.${NestedKeyOf<T[K]>}` : K }[keyof T & string]
  : never;

export type TranslationPath = NestedKeyOf<typeof en>;

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: TranslationPath, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolve(path: string, dict: unknown): string | undefined {
  let node: unknown = dict;
  for (const part of path.split('.')) {
    if (node && typeof node === 'object' && part in node) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === 'string' ? node : undefined;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const stored = useSettingsStore((s) => s.settings.language);
  const deviceLang = getLocales()[0]?.languageCode ?? 'en';
  const language: Language = stored === 'en' || stored === 'ru' ? stored : deviceLang === 'ru' ? 'ru' : 'en';

  const value = useMemo<I18nContextValue>(() => {
    const t = (path: TranslationPath, params?: Record<string, string | number>): string => {
      const raw = resolve(path, dictionaries[language]) ?? resolve(path, en) ?? path;
      return raw.replace(/\{(\w+)\}/g, (m, key) =>
        params && key in params ? String(params[key]) : m,
      );
    };
    const setLanguage = (lang: Language) => useSettingsStore.getState().update('language', lang);
    return { language, setLanguage, t };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
