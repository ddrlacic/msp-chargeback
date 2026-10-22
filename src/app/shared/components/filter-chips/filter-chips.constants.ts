export const FILTER_CHIPS_CONSTANTS = {
  LABEL: 'Applied filters',
  CLEAR_ALL: 'Clear all',
  REMOVE: (label: string) => `Remove ${label} filter`,
  MORE: (count: number) => `+${count} more`,
} as const;
