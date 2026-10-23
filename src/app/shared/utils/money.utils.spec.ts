import { formatMoney, formatMoneyParts, formatSignedMoney } from './money.utils';

describe('money utils', () => {
  it('formats an amount with its currency', () => {
    expect(formatMoney(1234.5, 'USD')).toBe('$1,234.50');
  });

  it('splits the currency symbol from the digits', () => {
    expect(formatMoneyParts(1234.5, 'USD')).toEqual({ symbol: '$', value: '1,234.50' });
  });

  it('puts a true minus sign before negative amounts', () => {
    expect(formatSignedMoney(-86.4, 'USD')).toBe('\u2212$86.40');
    expect(formatSignedMoney(0, 'USD')).toBe('$0.00');
  });

  it('keeps the minus sign with the digits', () => {
    expect(formatMoneyParts(-86.4, 'USD')).toEqual({ symbol: '$', value: '-86.40' });
  });
});
