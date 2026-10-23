import { createChargebackFixtures } from '../../../services/chargeback/chargeback.fixtures';
import { ChargebackCase } from '../../../services/chargeback/chargeback.types';
import { TEST_TODAY } from '../../../testing/providers';
import {
  getArbitrationDialog,
  getCaseBanner,
  getCaseDeadline,
  getCaseDetails,
  getCaseHeader,
  getMoneySummary,
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

      expect(banner.note).toEqual({
        title: 'Note from Worldpay',
        text: 'The delivery photo is hard to read. Upload a clearer copy that shows the delivery address and time.',
      });
      expect(banner.actions.at(-1)?.label).toBe('Fix and resubmit');
    });

    it('shows the bank’s note when the merchant must answer it or decide on arbitration', () => {
      expect(getCaseBanner(getCase('CB-260815')).note).toEqual({
        title: 'Note from the cardholder’s bank',
        text: 'The cardholder says the food arrived cold and two items were missing. The invoice shows what was ordered, not what was delivered.',
      });
      expect(getCaseBanner(getCase('CB-260748')).note?.text).toBe(
        'The tracking shows the order was delivered to a different address from the one on the order.',
      );
      expect(getCaseBanner(getCase('CB-260790')).note?.title).toBe(
        'Note from the cardholder’s bank',
      );
    });

    it('drops the bank’s note once the merchant has acted on it', () => {
      expect(
        getCaseBanner({ ...getCase('CB-260815'), status: 'under-review' }).note,
      ).toBe(undefined);
      expect(getCaseBanner({ ...getCase('CB-260790'), status: 'arbitration' }).note).toBe(
        undefined,
      );
    });

    it('warns about arbitration fees for the card network', () => {
      const banner = getCaseBanner(getCase('CB-260790'));

      expect(banner.deadline).toBe('Decide by Oct 31, 2026, or the chargeback stands');
      expect(banner.options.map((option) => option.description)).toEqual([
        '$312.00 stays charged and the case closes. You cannot undo this.',
        'Mastercard makes the final decision. If you lose, fees of $400 or more apply.',
      ]);
      expect(getCaseBanner(getCase('CB-260748')).options[1].description).toBe(
        'Visa makes the final decision. If you lose, fees of up to $500 apply.',
      );
    });

    it('offers accept and respond as option cards for a pre-arbitration', () => {
      const banner = getCaseBanner(getCase('CB-260815'));

      expect(banner.title).toBe(
        'The cardholder’s bank challenged your previous response. Review the case and respond.',
      );
      expect(banner.deadline).toBe('Respond by Nov 6, 2026, or the chargeback stands');
      expect(banner.actions).toEqual([]);
      expect(banner.options.map((option) => [option.action, option.primary])).toEqual([
        ['accept', false],
        ['respond-pre-arbitration', true],
      ]);
      expect(banner.options[1].description).toBe(
        'Send new evidence for the cardholder’s bank to review. If they still disagree, you can take the case to arbitration.',
      );
    });

    it('shows a saved pre-arbitration draft with buttons instead of option cards', () => {
      const chargeback = getCase('CB-260815');
      const banner = getCaseBanner({
        ...chargeback,
        draft: { savedAt: '2026-10-21T14:24:00.000Z', documentIds: ['a', 'b'] },
      });

      expect(banner.options).toEqual([]);
      expect(banner.actions.map((item) => item.action)).toEqual([
        'accept',
        'respond-pre-arbitration',
      ]);
      expect(banner.draft?.content).toBe('Challenging $176.50 with 2 documents');
    });

    it('reminds the merchant of the fees while the card network decides', () => {
      const banner = getCaseBanner(getCase('CB-260702'));

      expect(banner.title).toBe('The card network is making a final decision');
      expect(banner.detail).toBe('If you lose, fees of up to $500 apply');
      expect(banner.options).toEqual([]);
    });

    it('adds the arbitration fees to a lost arbitration', () => {
      const banner = getCaseBanner(getCase('CB-260577'));

      expect(banner.title).toBe('You remain liable for $167.25');
      expect(banner.detail).toBe('You also pay $400.00 in arbitration fees');
      expect(getCaseBanner(getCase('CB-260540')).detail).toBe(undefined);
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

    it('counts only what the ruling returned when earlier credits were debited again', () => {
      const banner = getCaseBanner({
        ...getCase('CB-260577'),
        status: 'partially-won',
        amountCredited: 267.25,
        arbitrationFees: undefined,
      });

      expect(banner.detail).toBe('$100.00 of $167.25 is returned to your account');
    });

    it('says the whole amount came back after winning arbitration', () => {
      expect(getCaseBanner(getCase('CB-260634')).title).toBe(
        'Resolved in your favor. $132.80 is returned to your account.',
      );
    });
  });

  describe('getArbitrationDialog', () => {
    it('spells out the Mastercard fees and what is at stake', () => {
      expect(getArbitrationDialog(getCase('CB-260790'))).toEqual({
        description: 'Mastercard reviews both sides and makes a final decision',
        outcomes: [
          { key: 'win', label: 'If you win', value: '$312.00 is returned to your account' },
          {
            key: 'lose',
            label: 'If you lose',
            value: '$312.00 stays charged and you pay $400 in fees',
            detail: '$150 filing fee and $250 review fee, plus $100 for each technical error',
          },
        ],
      });
    });

    it('caps the Visa fees', () => {
      const lose = getArbitrationDialog(getCase('CB-260748')).outcomes[1];

      expect(lose.value).toBe('$94.50 stays charged and you pay up to $500 in fees');
      expect(lose.detail).toBe('$250 filing fee and $250 review fee');
    });

    it('stakes only the challenged part of a partial challenge', () => {
      const dialog = getArbitrationDialog({
        ...getCase('CB-260790'),
        challengedAmount: 200,
      });

      expect(dialog.outcomes[0].value).toBe('$200.00 is returned to your account');
    });

    it('names no amount when the network’s fees are unknown', () => {
      const lose = getArbitrationDialog({ ...getCase('CB-260790'), network: 'discover' }).outcomes[1];

      expect(lose.value).toBe('$312.00 stays charged and you pay the arbitration fees');
      expect(lose.detail).toBe(undefined);
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

    it('lists the arbitration fees and takes them off the net', () => {
      expect(getMoneySummary(getCase('CB-260577')).rows).toEqual([
        { key: 'disputed', label: 'Disputed', value: '$167.25' },
        { key: 'debited', label: 'Debited', value: '\u2212$334.50' },
        { key: 'credited', label: 'Credited back', value: '$167.25' },
        { key: 'fees', label: 'Arbitration fees', value: '\u2212$400.00' },
        { key: 'net', label: 'Net', value: '\u2212$567.25' },
      ]);
    });
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

});
