import { ChargebackCase } from '../../../services/chargeback/chargeback.types';
import { createChargebackFixtures } from '../../../services/chargeback/chargeback.fixtures';
import { TEST_TODAY } from '../../../testing/providers';
import {
  createInitialState,
  getAmountError,
  getChallengedAmount,
  getEvidenceRows,
  getInitialStep,
  getRespondMode,
  getRespondTitle,
  getReviewRows,
  hasBlockedDocuments,
  hasScanningDocuments,
  isValidChallengeAmount,
  parseAmount,
  wasDocumentSent,
} from './chargeback-respond.utils';

describe('chargeback respond utils', () => {
  const cases = createChargebackFixtures(TEST_TODAY);
  const find = (caseId: string): ChargebackCase => {
    const found = cases.find((chargeback) => chargeback.caseId === caseId);
    if (!found) {
      throw new Error(`Missing fixture ${caseId}`);
    }
    return found;
  };

  describe('getRespondMode', () => {
    it('challenges a new chargeback and a saved draft', () => {
      expect(getRespondMode(find('CB-261018'))).toBe('challenge');
      expect(getRespondMode(find('CB-260987'))).toBe('challenge');
    });

    it('resubmits a response Worldpay returned', () => {
      expect(getRespondMode(find('CB-260954'))).toBe('resubmit');
    });

    it('has no flow for a case that is not open for a challenge', () => {
      expect(getRespondMode(find('CB-260921'))).toBe(undefined);
      expect(getRespondMode(find('CB-260815'))).toBe(undefined);
    });
  });

  it('titles the page by mode', () => {
    expect(getRespondTitle(find('CB-261018'))).toBe('Challenge chargeback');
    expect(getRespondTitle(find('CB-260954'))).toBe('Fix and resubmit');
    expect(getRespondTitle(undefined)).toBe('Challenge chargeback');
  });

  describe('parseAmount', () => {
    it('reads plain, dollar and comma amounts', () => {
      expect(parseAmount('25')).toBe(25);
      expect(parseAmount(' 25.5 ')).toBe(25.5);
      expect(parseAmount('$1,234.56')).toBe(1234.56);
    });

    it('rejects anything else', () => {
      expect(parseAmount('')).toBe(undefined);
      expect(parseAmount('abc')).toBe(undefined);
      expect(parseAmount('-5')).toBe(undefined);
      expect(parseAmount('1.234')).toBe(undefined);
      expect(parseAmount('1..5')).toBe(undefined);
    });
  });

  describe('amount rules', () => {
    it('accepts one cent up to the disputed amount', () => {
      expect(isValidChallengeAmount(0.01, 86.4)).toBe(true);
      expect(isValidChallengeAmount(86.4, 86.4)).toBe(true);
    });

    it('rejects zero, more than the disputed amount and nothing', () => {
      expect(isValidChallengeAmount(0, 86.4)).toBe(false);
      expect(isValidChallengeAmount(86.41, 86.4)).toBe(false);
      expect(isValidChallengeAmount(undefined, 86.4)).toBe(false);
    });

    it('uses the full amount unless a smaller one is chosen', () => {
      expect(getChallengedAmount('full', 'junk', 86.4)).toBe(86.4);
      expect(getChallengedAmount('partial', '40', 86.4)).toBe(40);
      expect(getChallengedAmount('partial', '', 86.4)).toBe(undefined);
      expect(getChallengedAmount('partial', '100', 86.4)).toBe(undefined);
    });

    it('explains the allowed range', () => {
      expect(getAmountError(86.4, 'USD')).toBe('Enter an amount from $0.01 to $86.40');
    });
  });

  describe('createInitialState', () => {
    it('starts empty for a new chargeback', () => {
      expect(createInitialState(find('CB-261018'))).toEqual({
        amountChoice: 'full',
        amountText: '',
        documentIds: [],
        note: '',
      });
    });

    it('restores a saved draft', () => {
      expect(createInitialState(find('CB-260987'))).toEqual({
        reason: 'proof-of-purchase',
        amountChoice: 'full',
        amountText: '',
        documentIds: ['CB-260987-doc-1'],
        note: '',
      });
    });

    it('restores a smaller amount from a draft', () => {
      const chargeback = find('CB-260987');
      const state = createInitialState({
        ...chargeback,
        draft: chargeback.draft && { ...chargeback.draft, challengedAmount: 150 },
      });

      expect(state.amountChoice).toBe('partial');
      expect(state.amountText).toBe('150.00');
    });

    it('fills in the previous answers when resubmitting', () => {
      expect(createInitialState(find('CB-260954'))).toEqual({
        reason: 'proof-of-purchase',
        amountChoice: 'full',
        amountText: '',
        documentIds: ['CB-260954-doc-1'],
        note: '',
      });
    });
  });

  describe('getInitialStep', () => {
    const empty = { amountChoice: 'full', amountText: '', documentIds: [], note: '' } as const;

    it('starts a new challenge at the review', () => {
      expect(getInitialStep('challenge', empty, 100, false)).toBe('review');
    });

    it('starts a resubmission at the evidence', () => {
      expect(getInitialStep('resubmit', empty, 100, false)).toBe('evidence');
    });

    it('resumes a draft at the first step that is not done', () => {
      expect(getInitialStep('challenge', empty, 100, true)).toBe('reason');
      expect(getInitialStep('challenge', { ...empty, reason: 'invalid-dispute' }, 100, true)).toBe(
        'evidence',
      );
      expect(
        getInitialStep(
          'challenge',
          { ...empty, reason: 'invalid-dispute', documentIds: ['a'] },
          100,
          true,
        ),
      ).toBe('submit');
    });
  });

  describe('getEvidenceRows', () => {
    const chargeback = find('CB-260790');

    it('lists the documents that fit the reason, then other documents', () => {
      const rows = getEvidenceRows('proof-of-purchase', []);

      expect(rows.map((row) => row.key)).toEqual([
        'transaction-receipt',
        'invoice',
        'delivery-proof',
        'customer-communication',
        'other',
      ]);
    });

    it('puts each document under its type', () => {
      const rows = getEvidenceRows('proof-of-purchase', chargeback.documents);

      expect(rows.find((row) => row.key === 'invoice')?.documents.length).toBe(1);
      expect(rows.find((row) => row.key === 'customer-communication')?.documents.length).toBe(1);
      expect(rows.find((row) => row.key === 'other')?.documents).toEqual([]);
    });

    it('puts documents that do not fit the reason under other documents', () => {
      const rows = getEvidenceRows('credit-issued', chargeback.documents);

      expect(rows.find((row) => row.key === 'other')?.documents.length).toBe(2);
    });

    it('lists only other documents without a reason', () => {
      expect(getEvidenceRows(undefined, []).map((row) => row.key)).toEqual(['other']);
    });
  });

  describe('document checks', () => {
    const [clean] = find('CB-260790').documents;

    it('finds scanning and blocked documents', () => {
      expect(hasScanningDocuments([clean])).toBe(false);
      expect(hasScanningDocuments([{ ...clean, securityStatus: 'scanning' }])).toBe(true);
      expect(hasBlockedDocuments([clean])).toBe(false);
      expect(hasBlockedDocuments([{ ...clean, securityStatus: 'rejected' }])).toBe(true);
      expect(hasBlockedDocuments([{ ...clean, securityStatus: 'upload-failed' }])).toBe(true);
    });

    it('knows whether a document was sent with an earlier response', () => {
      const returned = find('CB-260954');

      expect(wasDocumentSent(returned, 'CB-260954-doc-1')).toBe(true);
      expect(wasDocumentSent(returned, 'CB-260954-upload-1')).toBe(false);
    });
  });

  it('describes the dispute for the review step', () => {
    const rows = getReviewRows(find('CB-261018'));

    expect(rows.map((row) => [row.key, row.value])).toEqual([
      ['amount', '$86.40'],
      ['claim', 'Cardholder says they did not make this payment'],
      ['disputeReason', 'Visa reason code 10.4'],
      ['card', '•••• 4821'],
      ['transaction', 'TXN-58213-01'],
      ['transactionDate', 'Sep 20, 2026'],
      ['order', 'ORD-58213'],
    ]);
    expect(rows.find((row) => row.key === 'card')?.valueLabel).toBe('Visa ending in 4821');
  });
});
