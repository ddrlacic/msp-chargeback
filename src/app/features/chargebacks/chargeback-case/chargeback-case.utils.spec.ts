import { createChargebackFixtures } from '../../../services/chargeback/chargeback.fixtures';
import { ChargebackCase } from '../../../services/chargeback/chargeback.types';
import { TEST_TODAY } from '../../../testing/providers';
import {
  getCaseBanner,
  getCaseDeadline,
  getCaseDetails,
  getCaseHeader,
  getDocumentRows,
  getMoneySummary,
  getOutstandingAmount,
  getTimelineRows,
} from './chargeback-case.utils';

const cases = createChargebackFixtures(TEST_TODAY);

function getCase(caseId: string): ChargebackCase {
  const chargeback = cases.find((item) => item.caseId === caseId);
  if (!chargeback) {
    throw new Error(`Missing fixture ${caseId}`);
  }
  return chargeback;
}

describe('chargeback case utils', () => {
  describe('getCaseHeader', () => {
    it('summarizes the amount, reason, card, order and location', () => {
      expect(getCaseHeader(getCase('CB-261018'))).toEqual({
        amount: '$86.40',
        reason: 'Cardholder says they did not make this payment',
        card: 'Visa •••• 4821',
        cardLabel: 'Visa ending in 4821',
        order: 'ORD-58213',
        location: 'Copper Kettle Kitchen Downtown',
      });
    });
  });

  describe('getCaseDeadline', () => {
    it('asks for a response by the reply-by date', () => {
      const chargeback = getCase('CB-261018');

      expect(getCaseDeadline(chargeback)?.title).toBe('Respond by');
      expect(getCaseDeadline(chargeback)?.date).toBe(chargeback.replyByDate);
    });

    it('asks for a decision when the issuer challenged the response', () => {
      expect(getCaseDeadline(getCase('CB-260790'))?.title).toBe('Decide by');
    });

    it('has no deadline once the case no longer needs action', () => {
      expect(getCaseDeadline(getCase('CB-260655'))).toBe(undefined);
    });
  });

  describe('getCaseBanner', () => {
    it('offers accept and challenge as option cards for a new chargeback', () => {
      const banner = getCaseBanner(getCase('CB-261018'));

      expect(banner.state).toBe('needs-action');
      expect(banner.title).toBe('Choose to accept or challenge the chargeback');
      expect(banner.deadline).toBe('Respond by Oct 25, 2026, or the chargeback stands');
      expect(banner.actions).toEqual([]);
      expect(banner.options).toEqual([
        {
          action: 'accept',
          label: 'Accept chargeback',
          primary: false,
          description: '$86.40 stays charged and the case closes. You cannot undo this.',
        },
        {
          action: 'challenge',
          label: 'Challenge chargeback',
          primary: true,
          description:
            'Send evidence that the payment was valid. Worldpay reviews it and passes it on to the cardholder’s bank.',
        },
      ]);
    });

    it('summarizes the saved draft and continues the challenge', () => {
      const banner = getCaseBanner(getCase('CB-260987'));

      expect(banner.draft).toEqual({
        saved: 'Draft saved Oct 21, 2026 at 4:24 PM',
        content: 'Challenging $213.00 with 1 document',
      });
      expect(banner.actions.map((item) => [item.label, item.primary])).toEqual([
        ['Accept chargeback', false],
        ['Continue challenge', true],
      ]);
    });

    it('shows Worldpay’s note when the response was returned', () => {
      const banner = getCaseBanner(getCase('CB-260954'));

      expect(banner.note).toBe(
        'The delivery photo is hard to read. Upload a clearer copy that shows the delivery address and time.',
      );
      expect(banner.actions.at(-1)?.label).toBe('Fix and resubmit');
    });

    it('warns about arbitration fees for the card network', () => {
      const banner = getCaseBanner(getCase('CB-260790'));

      expect(banner.deadline).toBe('Decide by Oct 31, 2026, or the chargeback stands');
      expect(banner.options.map((option) => option.description)).toEqual([
        '$312.00 stays charged and the case closes. You cannot undo this.',
        'The card network makes the final decision. If you lose, fees of $400 or more apply.',
      ]);
    });

    it('has no actions while the case is in review', () => {
      const banner = getCaseBanner(getCase('CB-260876'));

      expect(banner.state).toBe('in-review');
      expect(banner.title).toBe('Worldpay or the card network is reviewing your response');
      expect(banner.deadline).toBe(undefined);
      expect(banner.actions).toEqual([]);
      expect(banner.options).toEqual([]);
    });

    it('fills in the amount on outcomes', () => {
      expect(getCaseBanner(getCase('CB-260655')).title).toBe(
        'Resolved in your favor. $74.25 is returned to your account.',
      );
      expect(getCaseBanner(getCase('CB-260540')).title).toBe('You remain liable for $155.40');
      expect(getCaseBanner(getCase('CB-260497')).title).toBe(
        'You accepted the chargeback. $52.10 stays charged.',
      );
    });

    it('says how much came back on a partial win', () => {
      expect(getCaseBanner(getCase('CB-260611')).detail).toBe(
        '$120.00 of $198.00 is returned to your account',
      );
    });
  });

  describe('getMoneySummary', () => {
    it('shows the net so far while the case is open', () => {
      expect(getMoneySummary(getCase('CB-260790'))).toEqual({
        rows: [
          { key: 'disputed', label: 'Disputed', value: '$312.00' },
          { key: 'debited', label: 'Debited', value: '\u2212$624.00' },
          { key: 'credited', label: 'Credited back', value: '$312.00' },
          { key: 'net', label: 'Net so far', value: '\u2212$312.00' },
        ],
        hint: 'Final when the case closes',
      });
    });

    it('shows the final net once the case is closed', () => {
      const summary = getMoneySummary(getCase('CB-260655'));

      expect(summary.rows.at(-1)).toEqual({ key: 'net', label: 'Net', value: '$0.00' });
      expect(summary.hint).toBe(undefined);
    });

    it('adds the challenged amount when it is smaller than the disputed amount', () => {
      const summary = getMoneySummary({ ...getCase('CB-260921'), challengedAmount: 50 });

      expect(summary.rows[1]).toEqual({ key: 'challenged', label: 'Challenged', value: '$50.00' });
    });
  });

  it('never reports a negative outstanding amount', () => {
    expect(getOutstandingAmount(getCase('CB-260655'))).toBe(0);
    expect(getOutstandingAmount(getCase('CB-260540'))).toBe(155.4);
  });

  it('lists the case details with the reason code and merchant ID', () => {
    const details = getCaseDetails(getCase('CB-261018'));

    expect(details.map((row) => row.label)).toEqual([
      'Case ID',
      'Reason',
      'Card',
      'Transaction',
      'Order',
      'Transaction date',
      'Transaction amount',
      'Received',
      'Location',
      'Legal entity',
    ]);
    expect(details.find((row) => row.key === 'reason')?.secondary).toBe('Reason code 10.4');
    expect(details.find((row) => row.key === 'location')?.secondary).toBe('MID-880101');
  });

  it('shows the card network logo next to the last four digits', () => {
    const card = getCaseDetails(getCase('CB-260954')).find((row) => row.key === 'card');

    expect(card?.value).toBe('•••• 4417');
    expect(card?.valueLabel).toBe('Visa ending in 4417');
    expect(card?.logo).toBe('card-networks/visa.svg');
  });

  describe('documents', () => {
    it('labels documents that were sent with a response', () => {
      const [row] = getDocumentRows(getCase('CB-260954'));

      expect(row.sent).toBe(true);
      expect(row.dateLabel).toBe('Sent to Worldpay Oct 13, 2026');
      expect(row.canOpen).toBe(true);
    });

    it('labels draft documents with who uploaded them', () => {
      const [row] = getDocumentRows(getCase('CB-260987'));

      expect(row).toEqual({
        document: getCase('CB-260987').documents[0],
        typeLabel: 'Transaction receipt',
        size: '180 KB',
        dateLabel: 'Uploaded Oct 21, 2026 by Alex Morgan',
        status: undefined,
        sent: false,
        canOpen: true,
      });
    });

    it('blocks opening documents that are scanning or rejected', () => {
      const chargeback = getCase('CB-260987');
      const [scanning, rejected] = getDocumentRows({
        ...chargeback,
        documents: [
          { ...chargeback.documents[0], id: 'scan', securityStatus: 'scanning' },
          { ...chargeback.documents[0], id: 'bad', securityStatus: 'rejected' },
        ],
      });

      expect([scanning.status, scanning.canOpen]).toEqual([
        { label: 'Scanning', tone: 'scanning' },
        false,
      ]);
      expect([rejected.status, rejected.canOpen]).toEqual([
        { label: 'Blocked by the security scan', tone: 'error' },
        false,
      ]);
    });
  });

  it('lists timeline events newest first with signed amounts', () => {
    const rows = getTimelineRows(getCase('CB-260655'));

    expect(rows.map((row) => [row.title, row.worldpayTerm, row.amount])).toEqual([
      ['Resolved in your favor', 'Chargeback Reversal', undefined],
      ['Response sent to Worldpay', 'Represent', '$74.25'],
      ['Chargeback received', 'First Chargeback', '\u2212$74.25'],
    ]);
    expect(rows[0].date).toBe('Oct 12, 2026 at 8:55 AM');
  });
});
