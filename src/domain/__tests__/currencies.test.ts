import { currencySymbol, listCurrencies } from '../currencies';

describe('listCurrencies', () => {
  it('includes major currencies with names', () => {
    const list = listCurrencies('en');
    const codes = list.map((c) => c.code);
    expect(codes).toContain('USD');
    expect(codes).toContain('EUR');
    expect(codes).toContain('RUB');
    expect(codes).toContain('AZN');
    expect(codes.length).toBeGreaterThan(100);
    const usd = list.find((c) => c.code === 'USD');
    expect(usd?.name).toBe('US Dollar');
  });

  it('localizes names in Russian', () => {
    const list = listCurrencies('ru');
    const usd = list.find((c) => c.code === 'USD');
    expect(usd?.name).toBe('доллар США');
  });
});

describe('currencySymbol', () => {
  it('extracts the symbol', () => {
    expect(currencySymbol('USD', 'en-US')).toBe('$');
    expect(currencySymbol('EUR', 'de-DE')).toBe('€');
  });
});

describe('Hermes compatibility (on-device runtime)', () => {
  const savedDisplayNames = (Intl as unknown as Record<string, unknown>).DisplayNames;
  const savedSupportedValuesOf = (Intl as unknown as Record<string, unknown>).supportedValuesOf;

  beforeEach(() => {
    // Hermes has Intl.NumberFormat/DateTimeFormat but NOT these two.
    delete (Intl as unknown as Record<string, unknown>).DisplayNames;
    delete (Intl as unknown as Record<string, unknown>).supportedValuesOf;
    jest.resetModules();
  });

  afterEach(() => {
    (Intl as unknown as Record<string, unknown>).DisplayNames = savedDisplayNames;
    (Intl as unknown as Record<string, unknown>).supportedValuesOf = savedSupportedValuesOf;
    jest.resetModules();
  });

  it('listCurrencies works without Intl.DisplayNames/supportedValuesOf', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { listCurrencies: list } = require('../currencies') as typeof import('../currencies');
    const en = list('en');
    expect(en.length).toBeGreaterThan(100);
    expect(en.find((c) => c.code === 'USD')?.name).toBe('US Dollar');
    const ru = list('ru');
    expect(ru.find((c) => c.code === 'USD')?.name).toBe('доллар США');
  });
});
