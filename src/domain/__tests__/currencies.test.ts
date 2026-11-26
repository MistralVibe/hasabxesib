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
