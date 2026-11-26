import { useCallback } from 'react';
import { Category } from '@/domain/types';
import { useI18n } from '@/i18n';

/** Localized label for a category: translated for predefined (nameKey), literal for custom. */
export function useCategoryLabel(): (cat: Category) => string {
  const { t } = useI18n();
  return useCallback(
    (cat: Category) => (cat.nameKey ? t(`categories.${cat.nameKey.split('.')[1]}` as never) : cat.name),
    [t],
  );
}
