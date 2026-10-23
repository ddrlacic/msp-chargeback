import { TestBed } from '@angular/core/testing';

import { getTestProviders } from '../../testing/providers';
import { ChargebackStore, DOCUMENT_SCAN_MS } from './chargeback.store';

describe('ChargebackStore', () => {
  let store: ChargebackStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: getTestProviders() });
    store = TestBed.inject(ChargebackStore);
  });

  it('lists the fake cases', () => {
    expect(store.count()).toBe(20);
  });

  it('gets a case by ID', () => {
    expect(store.getById('CB-261022')?.network).toBe('mastercard');
    expect(store.getById('CB-000000')).toBe(undefined);
  });

  it('accepts a chargeback', () => {
    store.acceptChargeback('CB-261018');
    const chargeback = store.getById('CB-261018');

    expect(chargeback?.status).toBe('accepted');
    expect(chargeback?.allowedActions).toEqual([]);
    expect(chargeback?.replyByDate).toBe(undefined);
    expect(chargeback?.timeline.at(-1)?.title).toBe('You accepted the chargeback');
  });

  it('saves a draft and marks the case as evidence required', () => {
    store.saveDraft('CB-261022', { challengedAmount: 100, documentIds: [] });
    const chargeback = store.getById('CB-261022');

    expect(chargeback?.status).toBe('evidence-required');
    expect(chargeback?.draft).toEqual({
      challengedAmount: 100,
      documentIds: [],
      savedAt: new Date(2026, 9, 22, 12).toISOString(),
    });
  });

  it('credits the challenged amount when a non-Visa response is submitted', () => {
    store.submitResponse('CB-261022', {
      reason: 'invalid-dispute',
      challengedAmount: 100,
      documentIds: ['doc-1'],
      note: 'The cardholder filed this twice',
    });
    const chargeback = store.getById('CB-261022');

    expect(chargeback?.status).toBe('response-submitted');
    expect(chargeback?.challengedAmount).toBe(100);
    expect(chargeback?.amountCredited).toBe(100);
    expect(chargeback?.timeline.at(-1)?.amountChange).toBe(100);
  });

  it('keeps the reason and note with the submitted response', () => {
    store.submitResponse('CB-261022', {
      reason: 'invalid-dispute',
      challengedAmount: 100,
      documentIds: ['doc-1'],
      note: 'The cardholder filed this twice',
    });
    const chargeback = store.getById('CB-261022');

    expect(chargeback?.challengeReason).toBe('invalid-dispute');
    expect(chargeback?.challengeNote).toBe('The cardholder filed this twice');
    expect(chargeback?.timeline.at(-1)?.description).toBe('The cardholder filed this twice');
    expect(chargeback?.timeline.at(-1)?.documentIds).toEqual(['doc-1']);
  });

  it('records a resubmitted response and clears Worldpay’s note', () => {
    store.submitResponse('CB-260954', {
      reason: 'proof-of-purchase',
      challengedAmount: 64.9,
      documentIds: ['CB-260954-doc-1'],
    });
    const chargeback = store.getById('CB-260954');

    expect(chargeback?.status).toBe('response-submitted');
    expect(chargeback?.worldpayNote).toBe(undefined);
    expect(chargeback?.timeline.at(-1)?.title).toBe('Updated response sent to Worldpay');
  });

  it('does not credit a non-Visa resubmission twice', () => {
    store.submitResponse('CB-261022', {
      reason: 'invalid-dispute',
      challengedAmount: 100,
      documentIds: [],
    });
    store.setStatus('CB-261022', 'returned-by-worldpay');
    store.submitResponse('CB-261022', {
      reason: 'invalid-dispute',
      challengedAmount: 120,
      documentIds: [],
    });

    expect(store.getById('CB-261022')?.amountCredited).toBe(120);
    expect(store.getById('CB-261022')?.timeline.at(-1)?.amountChange).toBe(20);
  });

  it('does not credit anything when a Visa response is submitted', () => {
    store.submitResponse('CB-261018', {
      reason: 'proof-of-purchase',
      challengedAmount: 86.4,
      documentIds: [],
    });
    const chargeback = store.getById('CB-261018');

    expect(chargeback?.status).toBe('response-submitted');
    expect(chargeback?.amountCredited).toBe(0);
    expect(chargeback?.timeline.at(-1)?.amountChange).toBe(undefined);
  });

  it('keeps a pre-arbitration open when its draft is saved', () => {
    store.saveDraft('CB-260815', { documentIds: [] });

    expect(store.getById('CB-260815')?.status).toBe('pre-arbitration-response-required');
    expect(store.getById('CB-260815')?.draft?.documentIds).toEqual([]);
  });

  it('sends a pre-arbitration response for review without moving money', () => {
    store.setStatus('CB-260843', 'pre-arbitration-response-required');
    store.submitResponse('CB-260843', {
      reason: 'proof-of-purchase',
      challengedAmount: 129.99,
      documentIds: ['new-doc'],
    });
    const chargeback = store.getById('CB-260843');

    expect(chargeback?.status).toBe('under-review');
    expect(chargeback?.cycle).toBe('pre-arbitration');
    expect(chargeback?.amountCredited).toBe(129.99);
    expect(chargeback?.timeline.at(-1)).toEqual({
      id: 'CB-260843-event-4',
      occurredAt: new Date(2026, 9, 22, 12).toISOString(),
      cycle: 'pre-arbitration',
      actor: 'merchant',
      title: 'Pre-arbitration response sent to Worldpay',
      worldpayTerm: 'Represent',
      description: undefined,
      amountChange: undefined,
      documentIds: ['new-doc'],
    });
  });

  it('takes a case to arbitration', () => {
    store.requestArbitration('CB-260790');
    const chargeback = store.getById('CB-260790');

    expect(chargeback?.status).toBe('arbitration');
    expect(chargeback?.cycle).toBe('arbitration');
    expect(chargeback?.allowedActions).toEqual([]);
    expect(chargeback?.replyByDate).toBe(undefined);
    expect(chargeback?.timeline.at(-1)?.title).toBe('You took the case to arbitration');
    expect(chargeback?.timeline.at(-1)?.worldpayTerm).toBe('Request arbitration');
  });

  describe('arbitration rulings', () => {
    beforeEach(() => store.requestArbitration('CB-260790'));

    it('returns the amount at stake when the merchant wins', () => {
      store.recordArbitrationRuling('CB-260790', 'won');
      const chargeback = store.getById('CB-260790');

      expect(chargeback?.status).toBe('won');
      expect(chargeback?.amountCredited).toBe(624);
      expect(chargeback?.timeline.at(-1)?.worldpayTerm).toBe('Arbitration won');
      expect(chargeback?.timeline.at(-1)?.amountChange).toBe(312);
    });

    it('returns part of it on a split, never more than is at stake', () => {
      store.recordArbitrationRuling('CB-260790', 'partially-won', 120);

      expect(store.getById('CB-260790')?.status).toBe('partially-won');
      expect(store.getById('CB-260790')?.amountCredited).toBe(432);

      store.reset();
      store.recordArbitrationRuling('CB-260790', 'partially-won', 900);

      expect(store.getById('CB-260790')?.amountCredited).toBe(624);
    });

    it('charges the network’s fees when the merchant loses', () => {
      store.recordArbitrationRuling('CB-260790', 'lost');
      const chargeback = store.getById('CB-260790');

      expect(chargeback?.status).toBe('lost');
      expect(chargeback?.amountCredited).toBe(312);
      expect(chargeback?.arbitrationFees).toBe(400);
      expect(chargeback?.timeline.at(-1)?.title).toBe('Resolved in the cardholder’s favor');
      expect(chargeback?.timeline.at(-1)?.arbitrationFees).toBe(400);
      expect(chargeback?.timeline.at(-1)?.amountChange).toBe(undefined);
    });

    it('charges no fee when the network’s fees are unknown', () => {
      store.recordArbitrationRuling('CB-260540', 'lost');

      expect(store.getById('CB-260540')?.arbitrationFees).toBe(undefined);
    });
  });

  it('sets any status and updates the allowed actions', () => {
    store.setStatus('CB-260876', 'decision-needed');

    expect(store.getById('CB-260876')?.allowedActions).toEqual(['request-arbitration', 'accept']);
  });

  it('uploads documents that are scanned before they can be used', () => {
    vi.useFakeTimers();
    const ids = store.uploadDocuments('CB-261018', 'invoice', [
      { name: 'invoice.pdf', sizeBytes: 2048 },
      { name: 'photo.png', sizeBytes: 4096 },
    ]);
    const statuses = () =>
      store.getById('CB-261018')?.documents.map((document) => document.securityStatus);

    expect(ids).toEqual(['CB-261018-upload-1', 'CB-261018-upload-2']);
    expect(store.getById('CB-261018')?.documents[0]).toEqual({
      id: 'CB-261018-upload-1',
      name: 'invoice.pdf',
      type: 'invoice',
      sizeBytes: 2048,
      securityStatus: 'scanning',
      uploadedBy: 'Alex Morgan',
      createdDateTime: new Date(2026, 9, 22, 12).toISOString(),
    });
    expect(statuses()).toEqual(['scanning', 'scanning']);

    vi.advanceTimersByTime(DOCUMENT_SCAN_MS);

    expect(statuses()).toEqual(['clean', 'clean']);
    vi.useRealTimers();
  });

  it('deletes a document and removes it from the draft', () => {
    store.deleteDocument('CB-260987', 'CB-260987-doc-1');
    const chargeback = store.getById('CB-260987');

    expect(chargeback?.documents).toEqual([]);
    expect(chargeback?.draft?.documentIds).toEqual([]);
  });

  it('resets to the original data', () => {
    store.acceptChargeback('CB-261018');
    store.reset();

    expect(store.getById('CB-261018')?.status).toBe('action-required');
  });
});
