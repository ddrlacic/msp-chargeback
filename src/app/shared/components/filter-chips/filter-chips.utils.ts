import { FILTER_CHIPS_CONSTANTS } from './filter-chips.constants';

const MAX_LISTED_VALUES = 2;

export function formatFilterValues(values: readonly string[]): string {
  if (values.length <= MAX_LISTED_VALUES) {
    return values.join(', ');
  }
  return `${values[0]} ${FILTER_CHIPS_CONSTANTS.MORE(values.length - 1)}`;
}
