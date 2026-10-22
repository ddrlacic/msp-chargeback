import {
  CardNetwork,
  ChargebackColorState,
  ChargebackStatus,
} from '../../services/chargeback/chargeback.types';
import { DueDateTone } from './shared/chargeback-due-date/chargeback-due-date.utils';

export const LIST_TABS = ['all', 'needs-action', 'in-review', 'won', 'lost'] as const;

export type ListTab = (typeof LIST_TABS)[number];

export const RECEIVED_PRESETS = [
  'any',
  'last-7-days',
  'last-30-days',
  'last-90-days',
  'this-month',
  'last-month',
] as const;

export type ReceivedPreset = (typeof RECEIVED_PRESETS)[number];

export interface ChargebackListFilters {
  readonly search: string;
  readonly received: ReceivedPreset;
  readonly merchantIds: readonly string[];
  readonly networks: readonly CardNetwork[];
}

export const COLUMN_KEYS = [
  'caseId',
  'status',
  'dueDate',
  'amount',
  'reason',
  'card',
  'transaction',
  'transactionDate',
  'location',
  'received',
  'lastUpdated',
] as const;

export type ColumnKey = (typeof COLUMN_KEYS)[number];

export type SortDirection = 'asc' | 'desc';

export interface ChargebackSort {
  readonly key: ColumnKey;
  readonly direction: SortDirection;
}

export type RowActionStyle = 'invisible' | 'invisible-simple';

export interface ChargebackRowDueDate {
  readonly date: string;
  readonly windowDays?: number;
  readonly daysLeft: number;
  readonly tone: DueDateTone;
}

export interface ChargebackRow {
  readonly caseId: string;
  readonly status: ChargebackStatus;
  readonly state: ChargebackColorState;
  readonly statusLabel: string;
  readonly dueDate?: ChargebackRowDueDate;
  readonly amount: number;
  readonly amountCredited: number;
  readonly currency: string;
  readonly reason: string;
  readonly reasonCode: string;
  readonly network: CardNetwork;
  readonly networkLabel: string;
  readonly cardLastFour: string;
  readonly orderReference: string;
  readonly transactionDate: string;
  readonly locationName: string;
  readonly dbaName: string;
  readonly merchantId: string;
  readonly receivedDate: string;
  readonly lastUpdated: string;
  readonly actionLabel: string;
  readonly actionStyle: RowActionStyle;
}

export interface LocationOption {
  readonly merchantId: string;
  readonly locationName: string;
}

export interface TabSummary {
  readonly tab: ListTab;
  readonly count: number;
  readonly amount: number;
}
