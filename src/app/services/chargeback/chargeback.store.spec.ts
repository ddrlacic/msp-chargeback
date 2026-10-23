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
    expect(store.count()).toBe(17);
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
    store.submitResponse('CB-261022', { challengedAmount: 100, documentIds: ['doc-1'] });
    const chargeback = store.getById('CB-261022');

    expect(chargeback?.status).toBe('response-submitted');
    expect(chargeback?.challengedAmount).toBe(100);
    expect(chargeback?.amountCredited).toBe(100);
    expect(chargeback?.timeline.at(-1)?.amountChange).toBe(100);
  });

  it('does not credit anything when a Visa response is submitted', () => {
    store.submitResponse('CB-261018', { challengedAmount: 86.4, documentIds: [] });
    const chargeback = store.getById('CB-261018');

    expect(chargeback?.status).toBe('response-submitted');
    expect(chargeback?.amountCredited).toBe(0);
    expect(chargeback?.timeline.at(-1)?.amountChange).toBe(undefined);
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
