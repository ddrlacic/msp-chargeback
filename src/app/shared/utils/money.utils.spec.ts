import { formatMoney, formatMoneyParts } from './money.utils';

describe('money utils', () => {
  it('formats an amount with its currency', () => {
    expect(formatMoney(1234.5, 'USD')).toBe('$1,234.50');
  });

  it('splits the currency symbol from the digits', () => {
    expect(formatMoneyParts(1234.5, 'USD')).toEqual({ symbol: '$', value: '1,234.50' });
  });

  it('keeps the minus sign with the digits', () => {
    expect(formatMoneyParts(-86.4, 'USD')).toEqual({ symbol: '$', value: '-86.40' });
  });
});
