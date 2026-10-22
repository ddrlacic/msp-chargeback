import { formatFilterValues } from './filter-chips.utils';

describe('formatFilterValues', () => {
  it('lists up to two values', () => {
    expect(formatFilterValues(['Visa'])).toBe('Visa');
    expect(formatFilterValues(['Visa', 'Discover'])).toBe('Visa, Discover');
  });

  it('shows the first value and how many more from three values', () => {
    expect(formatFilterValues(['Visa', 'Discover', 'Mastercard'])).toBe('Visa +2 more');
  });
});
