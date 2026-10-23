import { TestBed } from '@angular/core/testing';

import { TEST_TODAY, getTestProviders } from '../../testing/providers';
import { getScenarioEvents, SCENARIO_EVENT_RESULTS } from './chargeback-scenario.utils';
import { ChargebackStore } from './chargeback.store';
import { CHARGEBACK_STATUSES, ChargebackCase, ChargebackStatus } from './chargeback.types';
import { getAllowedActions, isNeedsAction, roundMoney } from './chargeback.utils';

const CASE_BY_NETWORK = {
  visa: 'CB-261018',
  mastercard: 'CB-261022',
  amex: 'CB-261031',
  discover: 'CB-260987',
} as const;

const TODAY = '2026-10-22';

describe('ChargebackStore scenarios', () => {
  let store: ChargebackStore;

  function get(caseId: string): ChargebackCase {
    const chargeback = store.getById(caseId);
    if (!chargeback) {
      throw new Error(`Missing case ${caseId}`);
    }
    return chargeback;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: getTestProviders() });
    store = TestBed.inject(ChargebackStore);
  });

  describe('jumping to a status', () => {
    for (const [network, caseId] of Object.entries(CASE_BY_NETWORK)) {
      for (const status of CHARGEBACK_STATUSES) {
        describe(`${network} case to ${status}`, () => {
          let chargeback: ChargebackCase;

          beforeEach(() => {
            store.jumpToStatus(caseId, status);
            chargeback = get(caseId);
          });

          it('sets the status and its allowed actions', () => {
            expect(chargeback.status).toBe(status);
            expect(chargeback.allowedActions).toEqual(getAllowedActions(status));
          });

          it('gives a future due date only to statuses that need action', () => {
            expect(!!chargeback.replyByDate && chargeback.replyByDate > TODAY).toBe(
              isNeedsAction(status),
            );
          });

          it('keeps money in step with the timeline', () => {
            const net = chargeback.timeline.reduce(
              (sum, event) => sum + (event.amountChange ?? 0),
              0,
            );
            const fees = chargeback.timeline.reduce(
              (sum, event) => sum + (event.arbitrationFees ?? 0),
              0,
            );

            expect(roundMoney(net)).toBe(
              roundMoney(chargeback.amountCredited - chargeback.amountDebited),
            );
            expect(fees).toBe(chargeback.arbitrationFees ?? 0);
          });

          it('lists events in order, starting with the chargeback being received', () => {
            const times = chargeback.timeline.map((event) => event.occurredAt);

            expect(chargeback.timeline[0].title).toBe('Chargeback received');
            expect(times).toEqual([...times].sort());
            expect(times.every((time) => time < TEST_TODAY.toISOString())).toBe(true);
          });

          it('only sends documents that exist', () => {
            const ids = new Set(chargeback.documents.map((document) => document.id));
            const sent = chargeback.timeline.flatMap((event) => event.documentIds ?? []);

            expect(sent.every((id) => ids.has(id))).toBe(true);
          });

          it('offers events that lead to the status they promise', () => {
            for (const event of getScenarioEvents(chargeback)) {
              store.jumpToStatus(caseId, status);
              store.simulateEvent(caseId, event);

              expect(get(caseId).status).toBe(SCENARIO_EVENT_RESULTS[event]);
            }
          });
        });
      }
    }

    it('leaves the other cases alone', () => {
      store.jumpToStatus('CB-261018', 'won');

      expect(get('CB-261022').status).toBe('action-required');
    });

    it('ignores a case that does not exist', () => {
      store.jumpToStatus('CB-000000', 'won');

      expect(store.count()).toBe(20);
    });

    it('keeps who and what the case is about', () => {
      const before = get('CB-260843');
      store.jumpToStatus('CB-260843', 'accepted');
      const after = get('CB-260843');

      expect([after.network, after.chargebackAmount, after.orderReference]).toEqual([
        before.network,
        before.chargebackAmount,
        before.orderReference,
      ]);
    });

    it('replaces an earlier jump instead of stacking on it', () => {
      store.jumpToStatus('CB-261018', 'arbitration');
      store.jumpToStatus('CB-261018', 'response-submitted');

      expect(get('CB-261018').timeline.map((event) => event.title)).toEqual([
        'Chargeback received',
        'Response sent to Worldpay',
      ]);
    });

    it('saves a draft that the respond flow can pick up', () => {
      store.jumpToStatus('CB-261018', 'draft-not-submitted');
      const chargeback = get('CB-261018');

      expect(chargeback.draft?.reason).toBe('proof-of-purchase');
      expect(chargeback.draft?.documentIds).toEqual(['CB-261018-doc-1']);
      expect(chargeback.documents.map((document) => document.name)).toEqual(['receipt-58213.pdf']);
    });

    it('charges the network’s fees on a lost arbitration', () => {
      store.jumpToStatus('CB-261022', 'lost');
      store.jumpToStatus('CB-261031', 'lost');
      store.jumpToStatus('CB-261018', 'lost');

      expect(get('CB-261022').arbitrationFees).toBe(400);
      expect(get('CB-261031').arbitrationFees).toBe(undefined);
      expect(get('CB-261018').arbitrationFees).toBe(500);
    });

    it('debits a Mastercard again when the bank takes it to arbitration', () => {
      store.jumpToStatus('CB-261022', 'arbitration-decision-needed');
      const chargeback = get('CB-261022');

      expect(chargeback.amountDebited).toBe(285.5);
      expect(chargeback.amountCredited).toBe(142.75);
      expect(chargeback.timeline.at(-1)?.worldpayTerm).toBe('Arbitration chargeback');
    });

    it('keeps a Visa case open without moving money before arbitration', () => {
      store.jumpToStatus('CB-261018', 'arbitration-decision-needed');
      const chargeback = get('CB-261018');

      expect(chargeback.amountDebited).toBe(86.4);
      expect(chargeback.amountCredited).toBe(0);
      expect(chargeback.timeline.at(-1)?.worldpayTerm).toBe('Issuer declined pre-arbitration');
    });
  });

  describe('simulating the next event', () => {
    it('sends a response on to the cardholder’s bank', () => {
      store.jumpToStatus('CB-261018', 'response-submitted');
      store.simulateEvent('CB-261018', 'worldpay-forwards-response');
      const chargeback = get('CB-261018');

      expect(chargeback.status).toBe('under-review');
      expect(chargeback.timeline.at(-1)).toEqual({
        id: 'CB-261018-event-3',
        occurredAt: TEST_TODAY.toISOString(),
        cycle: 'first-chargeback',
        actor: 'worldpay',
        title: 'Worldpay sent your response to the cardholder’s bank',
        worldpayTerm: 'Representment',
      });
    });

    it('returns a response with a note and a new due date', () => {
      store.jumpToStatus('CB-261018', 'response-submitted');
      store.simulateEvent('CB-261018', 'worldpay-returns-response');
      const chargeback = get('CB-261018');

      expect(chargeback.status).toBe('returned-by-worldpay');
      expect(chargeback.replyByDate).toBe('2026-11-01');
      expect(chargeback.worldpayNote).toBe(chargeback.timeline.at(-1)?.description);
    });

    it('returns the amount at stake when the bank accepts the response', () => {
      store.jumpToStatus('CB-261018', 'under-review');
      store.simulateEvent('CB-261018', 'issuer-accepts');
      const chargeback = get('CB-261018');

      expect(chargeback.status).toBe('won');
      expect(chargeback.amountCredited).toBe(86.4);
      expect(chargeback.timeline.at(-1)?.amountChange).toBe(86.4);
      expect(chargeback.timeline.at(-1)?.worldpayTerm).toBe('Chargeback reversal');
    });

    it('does not credit a response twice when the bank accepts it', () => {
      store.jumpToStatus('CB-261022', 'under-review');
      store.simulateEvent('CB-261022', 'issuer-accepts');

      expect(get('CB-261022').amountCredited).toBe(142.75);
      expect(get('CB-261022').timeline.at(-1)?.amountChange).toBe(undefined);
    });

    it('moves to pre-arbitration and asks for a response', () => {
      store.jumpToStatus('CB-261018', 'under-review');
      store.simulateEvent('CB-261018', 'pre-arbitration-filed');
      const chargeback = get('CB-261018');

      expect(chargeback.status).toBe('pre-arbitration-response-required');
      expect(chargeback.cycle).toBe('pre-arbitration');
      expect(chargeback.issuerNote).toBe(chargeback.timeline.at(-1)?.description);
      expect(chargeback.timeline.at(-1)?.cycle).toBe('pre-arbitration');
    });

    it('lets Worldpay handle a pre-arbitration without a due date', () => {
      store.jumpToStatus('CB-261018', 'under-review');
      store.simulateEvent('CB-261018', 'pre-arbitration-handled');
      const chargeback = get('CB-261018');

      expect(chargeback.status).toBe('pre-arbitration');
      expect(chargeback.replyByDate).toBe(undefined);
    });

    it('debits again when the bank wins pre-arbitration', () => {
      store.jumpToStatus('CB-261022', 'pre-arbitration');
      store.simulateEvent('CB-261022', 'issuer-wins-pre-arbitration');
      const chargeback = get('CB-261022');

      expect(chargeback.status).toBe('lost');
      expect(chargeback.amountDebited).toBe(285.5);
      expect(chargeback.timeline.at(-1)?.amountChange).toBe(-142.75);
    });

    it('sets the arbitration outcome from the network’s ruling', () => {
      store.jumpToStatus('CB-261018', 'arbitration');
      store.simulateEvent('CB-261018', 'arbitration-won');

      expect(get('CB-261018').status).toBe('won');
      expect(get('CB-261018').amountCredited).toBe(86.4);

      store.jumpToStatus('CB-261018', 'arbitration');
      store.simulateEvent('CB-261018', 'arbitration-split');

      expect(get('CB-261018').status).toBe('partially-won');
      expect(get('CB-261018').amountCredited).toBe(43.2);
    });

    it('closes the case when the due date passes', () => {
      store.jumpToStatus('CB-260987', 'draft-not-submitted');
      store.simulateEvent('CB-260987', 'deadline-passes');
      const chargeback = get('CB-260987');

      expect(chargeback.status).toBe('deadline-missed');
      expect(chargeback.replyByDate).toBe(undefined);
      expect(chargeback.draft).toBe(undefined);
      expect(chargeback.timeline.at(-1)?.title).toBe('No response was sent by the due date');
    });

    it('offers nothing once a case is closed', () => {
      const closed: readonly ChargebackStatus[] = [
        'won',
        'partially-won',
        'dispute-withdrawn',
        'lost',
        'accepted',
        'deadline-missed',
      ];

      for (const status of closed) {
        expect(getScenarioEvents({ status, cycle: 'arbitration' })).toEqual([]);
      }
    });
  });

  it('goes back to the original cases on reset', () => {
    store.jumpToStatus('CB-261018', 'lost');
    store.reset();

    expect(get('CB-261018').status).toBe('action-required');
    expect(get('CB-261018').timeline.length).toBe(1);
  });
});
