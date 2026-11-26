import { formatMoney, parseAmountInput, toMinor, ZERO_DECIMAL_CURRENCIES } from '../money';

describe('toMinor', () => {
  it('converts decimal string to minor units for 2-decimal currencies', () => {
    expect(toMinor('12.34', 'USD')).toBe(1234);
    expect(toMinor('0.99', 'EUR')).toBe(99);
    expect(toMinor('1000', 'USD')).toBe(100000);
  });

  it('handles comma decimal separator and spaces', () => {
    expect(toMinor('1 234,56', 'EUR')).toBe(123456);
    expect(toMinor('12,5', 'USD')).toBe(1250);
  });

  it('rounds half-up on extra precision', () => {
    expect(toMinor('10.005', 'USD')).toBe(1001);
    expect(toMinor('10.004', 'USD')).toBe(1000);
  });

  it('uses 0 decimals for zero-decimal currencies', () => {
    expect(ZERO_DECIMAL_CURRENCIES.has('JPY')).toBe(true);
    expect(toMinor('1500', 'JPY')).toBe(1500);
    expect(toMinor('1500.5', 'JPY')).toBe(1501);
  });
});

describe('parseAmountInput', () => {
  it('parses plain and formatted input to a positive number or null', () => {
    expect(parseAmountInput('12.34')).toBeCloseTo(12.34);
    expect(parseAmountInput('1,234.56')).toBeCloseTo(1234.56);
    expect(parseAmountInput(' 42 ')).toBeCloseTo(42);
    expect(parseAmountInput('')).toBeNull();
    expect(parseAmountInput('abc')).toBeNull();
    expect(parseAmountInput('-5')).toBeNull();
    expect(parseAmountInput('0')).toBeNull();
  });
});

describe('formatMoney', () => {
  it('formats minor units with currency symbol and code-independent grouping', () => {
    expect(formatMoney(123456, 'USD', 'en-US')).toBe('$1,234.56');
    expect(formatMoney(-500, 'USD', 'en-US')).toBe('-$5.00');
    expect(formatMoney(0, 'EUR', 'en-US')).toBe('€0.00');
  });

  it('formats zero-decimal currency without fraction digits', () => {
    expect(formatMoney(1500, 'JPY', 'en-US')).toBe('¥1,500');
  });
});
