import {
  CHARGEBACK_COLOR_STATES,
  CHARGEBACK_STATUSES,
  ChargebackCase,
} from '../../services/chargeback/chargeback.types';
import {
  getResponseWindowDays,
  getStatusState,
  isNeedsAction,
  roundMoney,
} from '../../services/chargeback/chargeback.utils';
import { FilterChip } from '../../shared/components/filter-chips/filter-chips.component';
import { formatFilterValues } from '../../shared/components/filter-chips/filter-chips.utils';
import { addDays, toIsoDate } from '../../shared/utils/date.utils';
import {
  CARD_NETWORK_LABELS,
  CHARGEBACK_STATUS_COPY,
  CHARGEBACKS_CONSTANTS,
  COLUMN_LABELS,
  RECEIVED_PRESET_LABELS,
} from './chargebacks.constants';
import {
  ChargebackListFilters,
  ChargebackRow,
  ChargebackSort,
  ColumnKey,
  LIST_TABS,
  ListTab,
  LocationOption,
  ReceivedPreset,
  SortDirection,
  TabSummary,
} from './chargebacks.types';
import { getDueDateInfo } from './shared/chargeback-due-date/chargeback-due-date.utils';

export const DEFAULT_LIST_FILTERS: ChargebackListFilters = {
  search: '',
  received: 'any',
  merchantIds: [],
  networks: [],
};

export const DEFAULT_LIST_SORT: ChargebackSort = { key: 'dueDate', direction: 'asc' };

export interface DateRange {
  readonly start: string;
  readonly end: string;
}

export function toChargebackRow(chargeback: ChargebackCase, today: Date): ChargebackRow {
  const needsAction = isNeedsAction(chargeback.status);
  const lastEvent = chargeback.timeline.at(-1);
  return {
    caseId: chargeback.caseId,
    status: chargeback.status,
    state: getStatusState(chargeback.status),
    statusLabel: CHARGEBACK_STATUS_COPY[chargeback.status].label,
    dueDate: needsAction ? getRowDueDate(chargeback, today) : undefined,
    amount: chargeback.chargebackAmount,
    amountCredited: chargeback.amountCredited,
    currency: chargeback.currency,
    reason: chargeback.reasonDescription,
    reasonCode: chargeback.reasonCode,
    network: chargeback.network,
    networkLabel: CARD_NETWORK_LABELS[chargeback.network],
    cardLastFour: chargeback.cardLastFour,
    orderReference: chargeback.orderReference,
    transactionDate: chargeback.transactionDate,
    locationName: chargeback.locationName,
    dbaName: chargeback.dbaName,
    merchantId: chargeback.merchantId,
    receivedDate: chargeback.chargebackDate,
    lastUpdated: lastEvent ? toIsoDate(new Date(lastEvent.occurredAt)) : chargeback.chargebackDate,
    actionLabel: needsAction
      ? CHARGEBACK_STATUS_COPY[chargeback.status].cta
      : CHARGEBACKS_CONSTANTS.LIST.TABLE.VIEW_DETAILS,
    actionStyle: needsAction ? 'invisible' : 'invisible-simple',
  };
}

export function getReceivedRange(preset: ReceivedPreset, today: Date): DateRange | undefined {
  const end = toIsoDate(today);
  switch (preset) {
    case 'any':
      return undefined;
    case 'last-7-days':
      return { start: toIsoDate(addDays(today, -6)), end };
    case 'last-30-days':
      return { start: toIsoDate(addDays(today, -29)), end };
    case 'last-90-days':
      return { start: toIsoDate(addDays(today, -89)), end };
    case 'this-month':
      return { start: toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)), end };
    case 'last-month':
      return {
        start: toIsoDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        end: toIsoDate(new Date(today.getFullYear(), today.getMonth(), 0)),
      };
  }
}

export function matchesFilters(
  row: ChargebackRow,
  filters: ChargebackListFilters,
  today: Date,
): boolean {
  const range = getReceivedRange(filters.received, today);
  return (
    matchesSearch(row, filters.search) &&
    (!range || (row.receivedDate >= range.start && row.receivedDate <= range.end)) &&
    (!filters.merchantIds.length || filters.merchantIds.includes(row.merchantId)) &&
    (!filters.networks.length || filters.networks.includes(row.network))
  );
}

export function hasActiveFilters(filters: ChargebackListFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.received !== 'any' ||
    filters.merchantIds.length > 0 ||
    filters.networks.length > 0
  );
}

export function getFilterChips(
  filters: ChargebackListFilters,
  locations: readonly LocationOption[],
): readonly FilterChip[] {
  const copy = CHARGEBACKS_CONSTANTS.LIST.FILTERS;
  const chips: FilterChip[] = [];
  if (filters.received !== 'any') {
    chips.push({
      key: 'received',
      label: copy.RECEIVED,
      value: RECEIVED_PRESET_LABELS[filters.received],
    });
  }
  if (filters.merchantIds.length) {
    const names = filters.merchantIds.flatMap((merchantId) => {
      const location = locations.find((item) => item.merchantId === merchantId);
      return location ? [location.locationName] : [];
    });
    chips.push({ key: 'merchantIds', label: copy.LOCATION, value: formatFilterValues(names) });
  }
  if (filters.networks.length) {
    chips.push({
      key: 'networks',
      label: copy.NETWORK,
      value: formatFilterValues(filters.networks.map((network) => CARD_NETWORK_LABELS[network])),
    });
  }
  return chips;
}

export function removeListFilter(
  filters: ChargebackListFilters,
  key: string,
): ChargebackListFilters {
  switch (key) {
    case 'received':
      return { ...filters, received: DEFAULT_LIST_FILTERS.received };
    case 'merchantIds':
      return { ...filters, merchantIds: DEFAULT_LIST_FILTERS.merchantIds };
    case 'networks':
      return { ...filters, networks: DEFAULT_LIST_FILTERS.networks };
    default:
      return filters;
  }
}

export function clearListFilters(filters: ChargebackListFilters): ChargebackListFilters {
  return { ...DEFAULT_LIST_FILTERS, search: filters.search };
}

export function matchesTab(row: ChargebackRow, tab: ListTab): boolean {
  return tab === 'all' || row.state === tab;
}

export function summarizeTabs(rows: readonly ChargebackRow[]): readonly TabSummary[] {
  return LIST_TABS.map((tab) => {
    const tabRows = rows.filter((row) => matchesTab(row, tab));
    return {
      tab,
      count: tabRows.length,
      amount:
        tab === 'won'
          ? roundMoney(tabRows.reduce((total, row) => total + row.amountCredited, 0))
          : sumAmounts(tabRows),
    };
  });
}

export function countDueSoon(rows: readonly ChargebackRow[]): number {
  return rows.filter(
    (row) => row.state === 'needs-action' && row.dueDate && row.dueDate.tone !== 'default',
  ).length;
}

export function sortRows(
  rows: readonly ChargebackRow[],
  sort: ChargebackSort,
): readonly ChargebackRow[] {
  const sign = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (sort.key === 'dueDate' && Boolean(a.dueDate) !== Boolean(b.dueDate)) {
      return a.dueDate ? -1 : 1;
    }
    const result = compareBy(sort.key, a, b);
    if (result !== 0) {
      return result * sign;
    }
    return compareText(b.lastUpdated, a.lastUpdated) || compareText(a.caseId, b.caseId);
  });
}

export function getNextSort(current: ChargebackSort, key: ColumnKey): ChargebackSort {
  if (current.key !== key) {
    return { key, direction: getDefaultDirection(key) };
  }
  return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
}

export function getLocationOptions(rows: readonly ChargebackRow[]): readonly LocationOption[] {
  const byMerchant = new Map<string, LocationOption>();
  for (const row of rows) {
    byMerchant.set(row.merchantId, {
      merchantId: row.merchantId,
      locationName: row.locationName,
    });
  }
  return [...byMerchant.values()].sort((a, b) => compareText(a.locationName, b.locationName));
}

export function sumAmounts(rows: readonly Pick<ChargebackRow, 'amount'>[]): number {
  return roundMoney(rows.reduce((total, row) => total + row.amount, 0));
}

export function toCsv(rows: readonly ChargebackRow[]): string {
  const exportCopy = CHARGEBACKS_CONSTANTS.LIST.EXPORT;
  const header = [
    COLUMN_LABELS.caseId,
    COLUMN_LABELS.status,
    COLUMN_LABELS.dueDate,
    COLUMN_LABELS.amount,
    exportCopy.CURRENCY,
    COLUMN_LABELS.reason,
    exportCopy.REASON_CODE,
    COLUMN_LABELS.card,
    exportCopy.CARD_LAST_FOUR,
    COLUMN_LABELS.transaction,
    COLUMN_LABELS.transactionDate,
    COLUMN_LABELS.location,
    exportCopy.MERCHANT_ID,
    COLUMN_LABELS.received,
    COLUMN_LABELS.lastUpdated,
  ];
  const lines = rows.map((row) => [
    row.caseId,
    row.statusLabel,
    row.dueDate?.date ?? '',
    row.amount.toFixed(2),
    row.currency,
    row.reason,
    row.reasonCode,
    row.networkLabel,
    row.cardLastFour,
    row.orderReference,
    row.transactionDate,
    row.dbaName,
    row.merchantId,
    row.receivedDate,
    row.lastUpdated,
  ]);
  return [header, ...lines].map((line) => line.map(toCsvCell).join(',')).join('\r\n');
}

function getRowDueDate(chargeback: ChargebackCase, today: Date): ChargebackRow['dueDate'] {
  if (!chargeback.replyByDate) {
    return undefined;
  }
  const windowDays = getResponseWindowDays(chargeback);
  const info = getDueDateInfo(chargeback.replyByDate, today, windowDays);
  return { date: chargeback.replyByDate, windowDays, daysLeft: info.daysLeft, tone: info.tone };
}

function matchesSearch(row: ChargebackRow, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) {
    return true;
  }
  return [row.caseId, row.orderReference, row.merchantId, row.cardLastFour].some((value) =>
    value.toLowerCase().includes(query),
  );
}

function compareBy(key: ColumnKey, a: ChargebackRow, b: ChargebackRow): number {
  switch (key) {
    case 'caseId':
      return compareText(a.caseId, b.caseId);
    case 'status':
      return getStatusRank(a) - getStatusRank(b);
    case 'dueDate':
      return compareText(a.dueDate?.date ?? '', b.dueDate?.date ?? '');
    case 'amount':
      return a.amount - b.amount;
    case 'reason':
      return compareText(a.reason, b.reason);
    case 'card':
      return compareText(a.networkLabel, b.networkLabel);
    case 'transaction':
      return compareText(a.orderReference, b.orderReference);
    case 'transactionDate':
      return compareText(a.transactionDate, b.transactionDate);
    case 'location':
      return compareText(a.locationName, b.locationName);
    case 'received':
      return compareText(a.receivedDate, b.receivedDate);
    case 'lastUpdated':
      return compareText(a.lastUpdated, b.lastUpdated);
  }
}

function getDefaultDirection(key: ColumnKey): SortDirection {
  return key === 'amount' || key === 'received' || key === 'lastUpdated' ? 'desc' : 'asc';
}

function getStatusRank(row: ChargebackRow): number {
  return (
    CHARGEBACK_COLOR_STATES.indexOf(row.state) * CHARGEBACK_STATUSES.length +
    CHARGEBACK_STATUSES.indexOf(row.status)
  );
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, 'en-US', { numeric: true });
}

function toCsvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
