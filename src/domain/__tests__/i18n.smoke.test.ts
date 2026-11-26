import { en } from '@/i18n/en';
import { ru } from '@/i18n/ru';

describe('i18n dictionaries', () => {
  it('ru has the same keys as en', () => {
    expect(Object.keys(ru.tabs).sort()).toEqual(Object.keys(en.tabs).sort());
    expect(Object.keys(ru.common).sort()).toEqual(Object.keys(en.common).sort());
  });

  it('en has non-empty strings', () => {
    expect(en.tabs.home.length).toBeGreaterThan(0);
  });
});
