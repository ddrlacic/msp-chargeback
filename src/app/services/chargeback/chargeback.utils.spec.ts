import { createChargebackFixtures } from './chargeback.fixtures';
import { CHARGEBACK_STATUSES, ChargebackCase } from './chargeback.types';
import {
  getAllowedActions,
  getAmountAtStake,
  getArbitrationFeeSchedule,
  getArbitrationFeeTotal,
  getMoneySummary,
  getNetAmount,
  getOutstandingAmount,
  getResponseWindowDays,
  getStatusState,
  isNeedsAction,
} from './chargeback.utils';
import { TEST_TODAY } from '../../testing/providers';

describe('chargeback utils', () => {
  it('maps each status to its color state', () => {
    const states = Object.fromEntries(
      CHARGEBACK_STATUSES.map((status) => [status, getStatusState(status)]),
    );

    expect(states).toEqual({
      'action-required': 'needs-action',
      'evidence-required': 'needs-action',
      'returned-by-worldpay': 'needs-action',
      'response-submitted': 'in-review',
      'under-review': 'in-review',
      'pre-arbitration': 'in-review',
      'pre-arbitration-response-required': 'needs-action',
      'decision-needed': 'needs-action',
      arbitration: 'in-review',
      won: 'won',
      'partially-won': 'won',
      'dispute-withdrawn': 'won',
      lost: 'lost',
      accepted: 'lost',
      'deadline-missed': 'lost',
    });
  });

  it('allows actions only for statuses that need action', () => {
    for (const status of CHARGEBACK_STATUSES) {
      expect(getAllowedActions(status).length > 0).toBe(isNeedsAction(status));
    }
  });

  it('offers accept and challenge on a new chargeback', () => {
    expect(getAllowedActions('action-required')).toEqual(['challenge', 'accept']);
  });

  it('uses the network window for a first chargeback', () => {
    expect(
      getResponseWindowDays({
        status: 'action-required',
        cycle: 'first-chargeback',
        network: 'visa',
      }),
    ).toBe(20);
    expect(
      getResponseWindowDays({
        status: 'action-required',
        cycle: 'first-chargeback',
        network: 'mastercard',
      }),
    ).toBe(30);
    expect(
      getResponseWindowDays({
        status: 'action-required',
        cycle: 'first-chargeback',
        network: 'discover',
      }),
    ).toBe(35);
    expect(
      getResponseWindowDays({
        status: 'action-required',
        cycle: 'first-chargeback',
        network: 'amex',
      }),
    ).toBe(7);
  });

  it('uses the pre-arbitration and arbitration request windows', () => {
    expect(
      getResponseWindowDays({
        status: 'pre-arbitration-response-required',
        cycle: 'pre-arbitration',
        network: 'discover',
      }),
    ).toBe(10);
    expect(
      getResponseWindowDays({
        status: 'decision-needed',
        cycle: 'pre-arbitration',
        network: 'mastercard',
      }),
    ).toBe(35);
  });

  it('has no window when the case does not need action', () => {
    expect(
      getResponseWindowDays({ status: 'under-review', cycle: 'first-chargeback', network: 'visa' }),
    ).toBe(undefined);
  });

  describe('money', () => {
    const cases = createChargebackFixtures(TEST_TODAY);
    const find = (caseId: string): ChargebackCase => {
      const found = cases.find((chargeback) => chargeback.caseId === caseId);
      if (!found) {
        throw new Error(`Missing fixture ${caseId}`);
      }
      return found;
    };

    it('summarizes money with a net amount', () => {
      expect(getMoneySummary(find('CB-260790'))).toEqual({
        currency: 'USD',
        chargebackAmount: 312,
        challengedAmount: 312,
        amountDebited: 624,
        amountCredited: 312,
        arbitrationFees: 0,
        netAmount: -312,
      });
    });

    it('takes arbitration fees off the net', () => {
      expect(getNetAmount(find('CB-260577'))).toBe(-567.25);
    });

    it('never reports a negative outstanding amount', () => {
      expect(getOutstandingAmount(find('CB-260655'))).toBe(0);
      expect(getOutstandingAmount(find('CB-260540'))).toBe(155.4);
    });

    it('stakes what is still debited, up to the challenged amount', () => {
      const chargeback = find('CB-260790');

      expect(getAmountAtStake(chargeback)).toBe(312);
      expect(getAmountAtStake({ ...chargeback, challengedAmount: 200 })).toBe(200);
    });
  });

  it('knows the arbitration fees of Visa and Mastercard only', () => {
    const visa = getArbitrationFeeSchedule('visa');
    const mastercard = getArbitrationFeeSchedule('mastercard');

    expect(visa).toEqual({ filing: 250, review: 250, upTo: true });
    expect(visa && getArbitrationFeeTotal(visa)).toBe(500);
    expect(mastercard && getArbitrationFeeTotal(mastercard)).toBe(400);
    expect(mastercard?.perTechnicalError).toBe(100);
    expect(getArbitrationFeeSchedule('discover')).toBe(undefined);
    expect(getArbitrationFeeSchedule('amex')).toBe(undefined);
  });
});
