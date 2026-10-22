import { createChargebackFixtures } from '../../services/chargeback/chargeback.fixtures';
import { TEST_TODAY } from '../../testing/providers';
import { clampColumnWidth } from './chargeback-table/chargeback-table.constants';
import { ChargebackListFilters, ChargebackRow } from './chargebacks.types';
import {
  countByTab,
  DEFAULT_LIST_FILTERS,
  DEFAULT_LIST_SORT,
  getListSummary,
  getLocationOptions,
  getNextSort,
  getReceivedRange,
  hasActiveFilters,
  matchesFilters,
  sortRows,
  toChargebackRow,
  toCsv,
} from './chargebacks.utils';

describe('chargebacks list utils', () => {
  const rows = createChargebackFixtures(TEST_TODAY).map((chargeback) =>
    toChargebackRow(chargeback, TEST_TODAY),
  );

  function rowById(caseId: string): ChargebackRow {
    const row = rows.find((item) => item.caseId === caseId);
    if (!row) {
      throw new Error(`Missing fixture ${caseId}`);
    }
    return row;
  }

  function filterIds(change: Partial<ChargebackListFilters>): string[] {
    const filters = { ...DEFAULT_LIST_FILTERS, ...change };
    return rows.filter((row) => matchesFilters(row, filters, TEST_TODAY)).map((row) => row.caseId);
  }

  describe('rows', () => {
    it('gives cases that need action a due date and their status action', () => {
      const row = rowById('CB-261031');

      expect(row.state).toBe('needs-action');
      expect(row.dueDate).toEqual({
        date: '2026-10-23',
        windowDays: 7,
        daysLeft: 1,
        tone: 'soon',
      });
      expect(row.actionLabel).toBe('Review and respond');
      expect(row.actionStyle).toBe('invisible');
    });

    it('gives other cases no due date and a "View details" action', () => {
      const row = rowById('CB-260921');

      expect(row.dueDate).toBe(undefined);
      expect(row.actionLabel).toBe('View details');
      expect(row.actionStyle).toBe('invisible-simple');
    });

    it('uses the latest timeline event as the last update', () => {
      expect(rowById('CB-260921').lastUpdated).toBe('2026-10-20');
    });
  });

  describe('filters', () => {
    it('keeps every case without filters', () => {
      expect(filterIds({}).length).toBe(17);
      expect(hasActiveFilters(DEFAULT_LIST_FILTERS)).toBe(false);
    });

    it('searches case ID, order, merchant ID and card digits, ignoring case', () => {
      expect(filterIds({ search: 'cb-26102' })).toEqual(['CB-261022']);
      expect(filterIds({ search: 'ORD-58213' })).toEqual(['CB-261018']);
      expect(filterIds({ search: '5530' })).toEqual(['CB-261022']);
      expect(filterIds({ search: ' MID-880103 ' }).length).toBe(4);
    });

    it('filters by location and card network', () => {
      expect(filterIds({ merchantIds: ['MID-880103'] }).length).toBe(4);
      expect(filterIds({ networks: ['visa'] }).length).toBe(6);
      expect(filterIds({ networks: ['amex'], merchantIds: ['MID-880102'] })).toEqual(['CB-260588']);
    });

    it('filters by the date the chargeback was received', () => {
      expect(filterIds({ received: 'last-7-days' })).toEqual(['CB-261022', 'CB-261031']);
      expect(filterIds({ received: 'last-30-days' }).length).toBe(8);
      expect(filterIds({ received: 'this-month' }).length).toBe(7);
      expect(filterIds({ received: 'last-month' }).length).toBe(6);
    });

    it('builds date ranges from today', () => {
      expect(getReceivedRange('any', TEST_TODAY)).toBe(undefined);
      expect(getReceivedRange('last-7-days', TEST_TODAY)).toEqual({
        start: '2026-10-16',
        end: '2026-10-22',
      });
      expect(getReceivedRange('last-month', TEST_TODAY)).toEqual({
        start: '2026-09-01',
        end: '2026-09-30',
      });
    });

    it('treats search and every filter as active', () => {
      expect(hasActiveFilters({ ...DEFAULT_LIST_FILTERS, search: ' ' })).toBe(false);
      expect(hasActiveFilters({ ...DEFAULT_LIST_FILTERS, search: 'cb' })).toBe(true);
      expect(hasActiveFilters({ ...DEFAULT_LIST_FILTERS, received: 'this-month' })).toBe(true);
      expect(hasActiveFilters({ ...DEFAULT_LIST_FILTERS, networks: ['visa'] })).toBe(true);
    });
  });

  describe('tabs and summary', () => {
    it('counts cases per state', () => {
      expect(countByTab(rows)).toEqual([
        { tab: 'all', count: 17 },
        { tab: 'needs-action', count: 7 },
        { tab: 'in-review', count: 4 },
        { tab: 'won', count: 3 },
        { tab: 'lost', count: 3 },
      ]);
    });

    it('sums what needs action, what is due soon, what is in review and what was won', () => {
      expect(getListSummary(rows)).toEqual({
        needsAction: { count: 7, amount: 1053.75 },
        dueSoon: { count: 4, nextDueDate: '2026-10-23' },
        inReview: { count: 4, amount: 522.89 },
        won: { count: 3, amount: 234.05 },
        currency: 'USD',
      });
    });

    it('lists each location once, by name', () => {
      expect(getLocationOptions(rows).map((option) => option.locationName)).toEqual([
        'Airport',
        'Downtown',
        'Midtown',
        'Riverside',
      ]);
    });
  });

  describe('sorting', () => {
    it('puts the soonest due date first and cases without one last', () => {
      const ids = sortRows(rows, DEFAULT_LIST_SORT).map((row) => row.caseId);

      expect(ids.slice(0, 7)).toEqual([
        'CB-261031',
        'CB-261018',
        'CB-260954',
        'CB-260790',
        'CB-260987',
        'CB-260815',
        'CB-261022',
      ]);
      expect(ids[7]).toBe('CB-260921');
    });

    it('keeps cases without a due date last when sorting latest first', () => {
      const ids = sortRows(rows, { key: 'dueDate', direction: 'desc' }).map((row) => row.caseId);

      expect(ids[0]).toBe('CB-261022');
      expect(ids[6]).toBe('CB-261031');
    });

    it('sorts by amount and by status', () => {
      expect(sortRows(rows, { key: 'amount', direction: 'desc' })[0].caseId).toBe('CB-260790');
      expect(sortRows(rows, { key: 'status', direction: 'asc' })[0].status).toBe('action-required');
      expect(sortRows(rows, { key: 'status', direction: 'desc' })[0].status).toBe(
        'deadline-missed',
      );
    });

    it('flips the direction on the same column and picks a default on a new one', () => {
      expect(getNextSort(DEFAULT_LIST_SORT, 'dueDate')).toEqual({
        key: 'dueDate',
        direction: 'desc',
      });
      expect(getNextSort(DEFAULT_LIST_SORT, 'amount')).toEqual({
        key: 'amount',
        direction: 'desc',
      });
      expect(getNextSort(DEFAULT_LIST_SORT, 'caseId')).toEqual({
        key: 'caseId',
        direction: 'asc',
      });
    });
  });

  describe('columns', () => {
    it('keeps a resized column within its limits', () => {
      expect(clampColumnWidth('reason', 100)).toBe(200);
      expect(clampColumnWidth('reason', 900)).toBe(560);
      expect(clampColumnWidth('reason', 333.6)).toBe(334);
    });
  });

  describe('export', () => {
    it('writes a header and one line per case', () => {
      const lines = toCsv([rowById('CB-261018')]).split('\r\n');

      expect(lines[0]).toBe(
        'Case ID,Status,Due date,Amount,Currency,Reason,Reason code,Card,Card last four,Transaction,Transaction date,Location,Merchant ID,Received,Last updated',
      );
      expect(lines[1]).toBe(
        'CB-261018,Action required,2026-10-25,86.40,USD,Cardholder says they did not make this payment,10.4,Visa,4821,ORD-58213,2026-09-20,Copper Kettle Kitchen Downtown,MID-880101,2026-10-05,2026-10-05',
      );
    });

    it('quotes cells with commas and defuses formulas', () => {
      const row = { ...rowById('CB-261018'), reason: 'Late, cold', orderReference: '=1+1' };
      const cells = toCsv([row]).split('\r\n')[1];

      expect(cells).toContain(',"Late, cold",');
      expect(cells).toContain(",'=1+1,");
    });
  });
});
