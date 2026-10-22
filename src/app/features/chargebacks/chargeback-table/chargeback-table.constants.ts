import { ColumnKey } from '../chargebacks.types';

export interface ColumnConfig {
  readonly key: ColumnKey;
  readonly icon: string;
  readonly width: number;
  readonly minWidth: number;
  readonly maxWidth: number;
  readonly align: 'start' | 'end';
}

export const SELECT_COLUMN_WIDTH = 40;
export const ACTION_COLUMN_WIDTH = 248;
export const ACTION_CELL_INSET = 25;
export const RESIZE_STEP = 16;

export const TABLE_COLUMNS: readonly ColumnConfig[] = [
  { key: 'caseId', icon: 'hash', width: 120, minWidth: 112, maxWidth: 200, align: 'start' },
  { key: 'status', icon: 'circle-dot', width: 264, minWidth: 160, maxWidth: 360, align: 'start' },
  {
    key: 'dueDate',
    icon: 'calendar-clock',
    width: 216,
    minWidth: 176,
    maxWidth: 288,
    align: 'start',
  },
  { key: 'amount', icon: 'banknote', width: 120, minWidth: 104, maxWidth: 200, align: 'end' },
  {
    key: 'reason',
    icon: 'message-square-text',
    width: 320,
    minWidth: 200,
    maxWidth: 560,
    align: 'start',
  },
  { key: 'card', icon: 'credit-card', width: 216, minWidth: 144, maxWidth: 288, align: 'start' },
  { key: 'transaction', icon: 'receipt', width: 136, minWidth: 120, maxWidth: 220, align: 'start' },
  {
    key: 'transactionDate',
    icon: 'calendar',
    width: 160,
    minWidth: 152,
    maxWidth: 220,
    align: 'start',
  },
  { key: 'location', icon: 'map-pin', width: 136, minWidth: 112, maxWidth: 240, align: 'start' },
  { key: 'received', icon: 'inbox', width: 136, minWidth: 128, maxWidth: 200, align: 'start' },
  {
    key: 'lastUpdated',
    icon: 'history',
    width: 144,
    minWidth: 136,
    maxWidth: 200,
    align: 'start',
  },
];

export const DEFAULT_COLUMN_WIDTHS = Object.fromEntries(
  TABLE_COLUMNS.map((column) => [column.key, column.width]),
) as Record<ColumnKey, number>;

export function clampColumnWidth(key: ColumnKey, width: number): number {
  const column = TABLE_COLUMNS.find((item) => item.key === key);
  if (!column) {
    return width;
  }
  return Math.round(Math.min(column.maxWidth, Math.max(column.minWidth, width)));
}
