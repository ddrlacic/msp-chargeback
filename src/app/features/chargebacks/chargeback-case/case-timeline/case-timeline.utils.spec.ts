import { createChargebackFixtures } from '../../../../services/chargeback/chargeback.fixtures';
import { ChargebackCase } from '../../../../services/chargeback/chargeback.types';
import { TEST_TODAY } from '../../../../testing/providers';
import { getPendingRow, getTimelineRows } from './case-timeline.utils';

const cases = createChargebackFixtures(TEST_TODAY);

function getCase(caseId: string): ChargebackCase {
  const chargeback = cases.find((item) => item.caseId === caseId);
  if (!chargeback) {
    throw new Error(`Missing fixture ${caseId}`);
  }
  return chargeback;
}

describe('case timeline utils', () => {
  describe('getPendingRow', () => {
    it('asks for the response by the due date, with the primary action', () => {
      expect(getPendingRow(getCase('CB-261018'))).toEqual({
        title: 'Your response is needed',
        detail: 'Respond by Oct 25, 2026',
        tone: 'needs-action',
        action: { action: 'challenge', label: 'Challenge chargeback' },
      });
    });

    it('asks to resubmit by the due date when Worldpay returned the response', () => {
      expect(getPendingRow(getCase('CB-260954'))).toEqual({
        title: 'Worldpay returned your response',
        detail: 'Resubmit by Oct 26, 2026',
        tone: 'needs-action',
        action: { action: 'resubmit', label: 'Fix and resubmit' },
      });
    });

    it('asks for the decision by the due date in arbitration', () => {
      const row = getPendingRow(getCase('CB-260790'));

      expect(row?.title).toBe('Your decision is needed');
      expect(row?.detail).toBe('Decide by Oct 31, 2026');
      expect(row?.action).toEqual({ action: 'request-arbitration', label: 'Request arbitration' });
    });

    it('says what the case is waiting on, with no action, while it is in review', () => {
      expect(getPendingRow(getCase('CB-260876'))).toEqual({
        title: 'Waiting for the cardholder’s bank to decide',
        detail: undefined,
        tone: 'in-review',
        action: undefined,
      });
    });

    it('has no pending row once the case is closed', () => {
      expect(getPendingRow(getCase('CB-260655'))).toBe(undefined);
      expect(getPendingRow(getCase('CB-260540'))).toBe(undefined);
      expect(getPendingRow(getCase('CB-260497'))).toBe(undefined);
      expect(getPendingRow(getCase('CB-260466'))).toBe(undefined);
    });
  });

  describe('getTimelineRows', () => {
    it('lists events oldest first with the actor, the Worldpay term and the money', () => {
      const rows = getTimelineRows(getCase('CB-260655'));

      expect(rows.map((row) => [row.title, row.meta, row.money])).toEqual([
        ['Chargeback received', 'Cardholder’s bank · First chargeback', '$74.25 debited'],
        ['Response sent to Worldpay', 'You · Represent', '$74.25 credited back'],
        ['Resolved in your favor', 'Cardholder’s bank · Chargeback reversal', undefined],
      ]);
      expect(rows[2].date).toBe('Oct 12, 2026 at 8:55 AM');
    });

    it('names the card network when it is the actor', () => {
      const rows = getTimelineRows(getCase('CB-260611'));

      expect(rows[rows.length - 1].meta).toBe('Visa · Arbitration split');
    });

    it('shows the arbitration fees on a lost ruling', () => {
      const rows = getTimelineRows(getCase('CB-260577'));

      expect(rows.map((row) => [row.title, row.meta, row.money])).toEqual([
        ['Chargeback received', 'Cardholder’s bank · First chargeback', '$167.25 debited'],
        ['Response sent to Worldpay', 'You · Represent', '$167.25 credited back'],
        [
          'The cardholder’s bank challenged your response',
          'Cardholder’s bank · Arbitration chargeback',
          '$167.25 debited',
        ],
        ['You took the case to arbitration', 'You · Request arbitration', undefined],
        [
          'Resolved in the cardholder’s favor',
          'Mastercard · Arbitration lost',
          '$400.00 arbitration fees debited',
        ],
      ]);
    });

    it('colors the last event by the case state once the case is closed', () => {
      expect(getTimelineRows(getCase('CB-260655')).map((row) => row.tone)).toEqual([
        'neutral',
        'neutral',
        'won',
      ]);
      const lost = getTimelineRows(getCase('CB-260540'));
      expect(lost[lost.length - 1].tone).toBe('lost');
    });

    it('keeps every event neutral while a pending row carries the color', () => {
      const rows = getTimelineRows(getCase('CB-260954'));

      expect(rows.every((row) => row.tone === 'neutral')).toBe(true);
    });

    it('attaches the documents sent with a response to its event', () => {
      const rows = getTimelineRows(getCase('CB-260921'));
      const last = rows[rows.length - 1];

      expect(
        last.documents.map((item) => [item.document.name, item.icon, item.label, item.canOpen]),
      ).toEqual([
        ['receipt-57890.pdf', 'file-text', 'Preview receipt-57890.pdf', true],
        ['signed-authorization.pdf', 'file-text', 'Preview signed-authorization.pdf', true],
      ]);
      expect(rows[rows.length - 2].documents).toEqual([]);
    });

    it('blocks opening a document until the security scan passes', () => {
      const chargeback = getCase('CB-260921');
      const rows = getTimelineRows({
        ...chargeback,
        documents: chargeback.documents.map((document) => ({
          ...document,
          securityStatus: 'scanning',
        })),
      });

      expect(rows[rows.length - 1].documents.map((item) => item.canOpen)).toEqual([false, false]);
    });

    it('skips documents that no longer exist on the case', () => {
      const chargeback = getCase('CB-260921');
      const rows = getTimelineRows({ ...chargeback, documents: [chargeback.documents[0]] });

      expect(rows[rows.length - 1].documents.map((item) => item.document.name)).toEqual([
        'receipt-57890.pdf',
      ]);
    });
  });
});
