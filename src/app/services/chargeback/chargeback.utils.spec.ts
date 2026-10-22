import { createChargebackFixtures } from './chargeback.fixtures';
import { CHARGEBACK_STATUSES } from './chargeback.types';
import {
  getAllowedActions,
  getMoneySummary,
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

  it('summarizes money with a net amount', () => {
    const decisionNeeded = createChargebackFixtures(TEST_TODAY).find(
      (c) => c.status === 'decision-needed',
    );

    expect(decisionNeeded && getMoneySummary(decisionNeeded)).toEqual({
      currency: 'USD',
      chargebackAmount: 312,
      challengedAmount: 312,
      amountDebited: 624,
      amountCredited: 312,
      netAmount: -312,
    });
  });
});
