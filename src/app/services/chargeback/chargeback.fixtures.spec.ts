import { TEST_TODAY } from '../../testing/providers';
import { createChargebackFixtures } from './chargeback.fixtures';
import { CARD_NETWORKS, CHARGEBACK_STATUSES } from './chargeback.types';
import { getAllowedActions, isNeedsAction } from './chargeback.utils';

describe('chargeback fixtures', () => {
  const cases = createChargebackFixtures(TEST_TODAY);

  it('covers every status in scope', () => {
    const statuses = new Set(cases.map((c) => c.status));

    expect([...CHARGEBACK_STATUSES].filter((status) => !statuses.has(status))).toEqual([]);
  });

  it('covers all four card networks', () => {
    const networks = new Set(cases.map((c) => c.network));

    expect([...CARD_NETWORKS].filter((network) => !networks.has(network))).toEqual([]);
  });

  it('has unique case IDs', () => {
    expect(new Set(cases.map((c) => c.caseId)).size).toBe(cases.length);
  });

  it('gives a future due date to every case that needs action, and none to the rest', () => {
    for (const chargeback of cases) {
      const hasFutureDueDate = !!chargeback.replyByDate && chargeback.replyByDate > '2026-10-22';
      expect(hasFutureDueDate).toBe(isNeedsAction(chargeback.status));
    }
  });

  it('derives allowed actions from the status', () => {
    for (const chargeback of cases) {
      expect(chargeback.allowedActions).toEqual(getAllowedActions(chargeback.status));
    }
  });

  it('starts every timeline with the chargeback being received', () => {
    for (const chargeback of cases) {
      expect(chargeback.timeline[0].title).toBe('Chargeback received');
    }
  });

  it('balances money movements with the timeline', () => {
    for (const chargeback of cases) {
      const net = chargeback.timeline.reduce((sum, event) => sum + (event.amountChange ?? 0), 0);
      expect(Math.round(net * 100) / 100).toBe(
        Math.round((chargeback.amountCredited - chargeback.amountDebited) * 100) / 100,
      );
    }
  });

  it('dates the cases relative to today', () => {
    const first = cases.find((c) => c.caseId === 'CB-261018');

    expect(first?.replyByDate).toBe('2026-10-25');
  });
});
