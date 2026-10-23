import { TestBed } from '@angular/core/testing';

import { ChargebackStore, DOCUMENT_SCAN_MS } from '../../../services/chargeback/chargeback.store';
import { getTestProviders } from '../../../testing/providers';
import { ChargebackRespondFlow } from './chargeback-respond.flow';

describe('ChargebackRespondFlow', () => {
  let store: ChargebackStore;
  let flow: ChargebackRespondFlow;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [...getTestProviders(), ChargebackRespondFlow] });
    store = TestBed.inject(ChargebackStore);
    flow = TestBed.inject(ChargebackRespondFlow);
  });

  const file = (name: string, size = 1024) => new File([new Uint8Array(size)], name);

  function fillIn(): void {
    flow.reason.set('proof-of-purchase');
    flow.upload({ type: 'transaction-receipt', files: [file('receipt.pdf')] });
    vi.advanceTimersByTime(DOCUMENT_SCAN_MS);
  }

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  describe('init', () => {
    it('starts a new challenge at the review step with nothing filled in', () => {
      flow.init('CB-261018');

      expect(flow.mode()).toBe('challenge');
      expect(flow.step()).toBe('review');
      expect(flow.reason()).toBe(undefined);
      expect(flow.documents()).toEqual([]);
      expect(flow.fullAmount()).toBe(86.4);
      expect(flow.challengedAmount()).toBe(86.4);
    });

    it('resumes a saved draft at the submit step', () => {
      flow.init('CB-260987');

      expect(flow.mode()).toBe('challenge');
      expect(flow.step()).toBe('submit');
      expect(flow.reason()).toBe('proof-of-purchase');
      expect(flow.documents().map((document) => document.name)).toEqual(['receipt-57961.pdf']);
    });

    it('opens a returned response at the evidence step with the old answers', () => {
      flow.init('CB-260954');

      expect(flow.mode()).toBe('resubmit');
      expect(flow.step()).toBe('evidence');
      expect(flow.reason()).toBe('proof-of-purchase');
      expect(flow.documents().length).toBe(1);
    });
  });

  describe('moving between steps', () => {
    beforeEach(() => flow.init('CB-261018'));

    it('moves forward from the review step', () => {
      expect(flow.next()).toBe(true);
      expect(flow.step()).toBe('reason');
    });

    it('stays on a step that is not complete and asks to show what is missing', () => {
      flow.goTo('reason');

      expect(flow.next()).toBe(false);
      expect(flow.step()).toBe('reason');
      expect(flow.attempted()).toBe(true);
    });

    it('clears the missing-field state once the step changes', () => {
      flow.goTo('reason');
      flow.next();
      flow.back();

      expect(flow.step()).toBe('review');
      expect(flow.attempted()).toBe(false);
    });

    it('only opens a step when every earlier step is complete', () => {
      expect(flow.canOpen('reason')).toBe(true);
      expect(flow.canOpen('evidence')).toBe(false);
      expect(flow.goTo('submit')).toBe(false);

      flow.reason.set('invalid-dispute');

      expect(flow.canOpen('evidence')).toBe(true);
      expect(flow.canOpen('submit')).toBe(false);
    });

    it('blocks the reason step for a smaller amount that is too high', () => {
      flow.reason.set('invalid-dispute');
      flow.amountChoice.set('partial');
      flow.amountText.set('90');

      expect(flow.valid().reason).toBe(false);

      flow.amountText.set('40');

      expect(flow.valid().reason).toBe(true);
      expect(flow.challengedAmount()).toBe(40);
    });

    it('does not go back from the first step or forward from the last', () => {
      expect(flow.back()).toBe(false);

      flow.init('CB-260987');

      expect(flow.isLast()).toBe(true);
      expect(flow.next()).toBe(false);
    });
  });

  describe('documents', () => {
    beforeEach(() => flow.init('CB-261018'));

    it('adds an upload to the case and waits for the security scan', () => {
      flow.reason.set('proof-of-purchase');
      flow.upload({ type: 'transaction-receipt', files: [file('receipt.pdf', 2048)] });

      expect(flow.documents().map((document) => [document.name, document.securityStatus])).toEqual([
        ['receipt.pdf', 'scanning'],
      ]);
      expect(flow.scanning()).toBe(true);
      expect(flow.valid().submit).toBe(false);

      vi.advanceTimersByTime(DOCUMENT_SCAN_MS);

      expect(flow.scanning()).toBe(false);
      expect(flow.valid().submit).toBe(true);
    });

    it('groups an upload under its checklist item', () => {
      flow.reason.set('proof-of-purchase');
      flow.upload({ type: 'delivery-proof', files: [file('photo.png')] });

      const row = flow.evidenceRows().find((item) => item.key === 'delivery-proof');

      expect(row?.documents.map((document) => document.name)).toEqual(['photo.png']);
    });

    it('deletes a document that was never sent when it is removed', () => {
      fillIn();
      const [document] = flow.documents();

      flow.removeDocument(document.id);

      expect(flow.documents()).toEqual([]);
      expect(store.getById('CB-261018')?.documents).toEqual([]);
    });

    it('keeps a document that was sent earlier on the case when it is removed', () => {
      flow.init('CB-260954');

      flow.removeDocument('CB-260954-doc-1');

      expect(flow.documents()).toEqual([]);
      expect(store.getById('CB-260954')?.documents.length).toBe(1);
    });

    it('needs at least one document', () => {
      flow.reason.set('proof-of-purchase');

      expect(flow.noDocuments()).toBe(true);
      expect(flow.valid().evidence).toBe(false);
    });
  });

  describe('saving a draft', () => {
    beforeEach(() => flow.init('CB-261018'));

    it('saves the progress and sets the status to evidence required', () => {
      flow.reason.set('invalid-dispute');
      flow.amountChoice.set('partial');
      flow.amountText.set('40');
      flow.note.set('  Filed twice  ');

      flow.saveAndExit();
      const chargeback = store.getById('CB-261018');

      expect(chargeback?.status).toBe('evidence-required');
      expect(chargeback?.draft).toEqual({
        savedAt: new Date(2026, 9, 22, 12).toISOString(),
        reason: 'invalid-dispute',
        challengedAmount: 40,
        documentIds: [],
        note: 'Filed twice',
      });
    });

    it('saves the draft when the merchant leaves the flow', () => {
      flow.reason.set('invalid-dispute');

      TestBed.resetTestingModule();

      expect(store.getById('CB-261018')?.status).toBe('evidence-required');
      expect(store.getById('CB-261018')?.draft?.reason).toBe('invalid-dispute');
    });

    it('leaves the case alone when nothing was filled in', () => {
      flow.saveAndExit();

      expect(store.getById('CB-261018')?.status).toBe('action-required');
      expect(store.getById('CB-261018')?.draft).toBe(undefined);
    });

    it('does not save a draft for a returned response', () => {
      flow.init('CB-260954');
      flow.note.set('A clearer photo');

      flow.discard();
      TestBed.resetTestingModule();

      expect(store.getById('CB-260954')?.status).toBe('returned-by-worldpay');
    });

    it('does not save a draft after the response is submitted', () => {
      fillIn();
      flow.submit();

      TestBed.resetTestingModule();

      expect(store.getById('CB-261018')?.draft).toBe(undefined);
    });
  });

  describe('submitting', () => {
    beforeEach(() => flow.init('CB-261018'));

    it('does not submit until everything is complete', () => {
      flow.reason.set('proof-of-purchase');

      expect(flow.submit()).toBe(false);
      expect(store.getById('CB-261018')?.status).toBe('action-required');
    });

    it('sends the response and changes the status', () => {
      fillIn();
      flow.note.set('Order delivered');

      expect(flow.submit()).toBe(true);
      const chargeback = store.getById('CB-261018');

      expect(chargeback?.status).toBe('response-submitted');
      expect(chargeback?.challengeReason).toBe('proof-of-purchase');
      expect(chargeback?.challengedAmount).toBe(86.4);
      expect(chargeback?.timeline.at(-1)?.documentIds).toEqual(['CB-261018-upload-1']);
      expect(chargeback?.timeline.at(-1)?.description).toBe('Order delivered');
    });

    it('resubmits a returned response', () => {
      flow.init('CB-260954');

      expect(flow.submit()).toBe(true);
      expect(store.getById('CB-260954')?.status).toBe('response-submitted');
    });
  });
});
