export interface MoneyParts {
  readonly symbol: string;
  readonly value: string;
}

export function formatMoney(amount: number, currency: string): string {
  return getFormatter(currency).format(amount);
}

export function formatMoneyParts(amount: number, currency: string): MoneyParts {
  const parts = getFormatter(currency).formatToParts(amount);
  return {
    symbol: parts
      .filter((part) => part.type === 'currency')
      .map((part) => part.value)
      .join(''),
    value: parts
      .filter((part) => part.type !== 'currency' && part.type !== 'literal')
      .map((part) => part.value)
      .join(''),
  };
}

function getFormatter(currency: string): Intl.NumberFormat {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency });
}
