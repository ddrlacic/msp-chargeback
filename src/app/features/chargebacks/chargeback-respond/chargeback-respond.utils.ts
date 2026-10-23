import {
  ChallengeReason,
  ChargebackCase,
  ChargebackDocument,
  ChargebackDocumentType,
} from '../../../services/chargeback/chargeback.types';
import { roundMoney } from '../../../services/chargeback/chargeback.utils';
import { formatDate } from '../../../shared/utils/date.utils';
import { formatMoney } from '../../../shared/utils/money.utils';
import {
  CARD_NETWORK_LABELS,
  CARD_NETWORK_LOGOS,
  CHARGEBACK_DOCUMENT_TYPE_HINTS,
  CHARGEBACK_DOCUMENT_TYPE_LABELS,
  CHARGEBACKS_CONSTANTS,
} from '../chargebacks.constants';

const copy = CHARGEBACKS_CONSTANTS.RESPOND;
const caseCopy = CHARGEBACKS_CONSTANTS.CASE;

export type RespondMode = 'challenge' | 'resubmit';

export const RESPOND_STEPS = ['review', 'reason', 'evidence', 'submit'] as const;

export type RespondStep = (typeof RESPOND_STEPS)[number];

export type AmountChoice = 'full' | 'partial';

export const MIN_CHALLENGE_AMOUNT = 0.01;

const REASON_EVIDENCE: Record<ChallengeReason, readonly ChargebackDocumentType[]> = {
  'credit-issued': ['refund-proof', 'transaction-receipt'],
  'cardholder-withdrew': ['customer-communication', 'transaction-receipt'],
  'invalid-dispute': ['transaction-receipt', 'terms-and-conditions', 'customer-communication'],
  'proof-of-purchase': [
    'transaction-receipt',
    'invoice',
    'delivery-proof',
    'customer-communication',
  ],
};

export interface RespondFormState {
  readonly reason?: ChallengeReason;
  readonly amountChoice: AmountChoice;
  readonly amountText: string;
  readonly documentIds: readonly string[];
  readonly note: string;
}

export interface EvidenceRow {
  readonly key: string;
  readonly type: ChargebackDocumentType;
  readonly label: string;
  readonly hint: string;
  readonly documents: readonly ChargebackDocument[];
}

export interface ReviewRow {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly secondary?: string;
  readonly valueLabel?: string;
  readonly logo?: string;
}

export function getRespondMode(chargeback: ChargebackCase): RespondMode | undefined {
  const actions = chargeback.allowedActions;
  if (actions.includes('resubmit')) {
    return 'resubmit';
  }
  return actions.includes('challenge') || actions.includes('continue-challenge')
    ? 'challenge'
    : undefined;
}

export function getRespondTitle(chargeback: ChargebackCase | undefined): string {
  const mode = chargeback ? getRespondMode(chargeback) : undefined;
  return copy.TITLE[mode ?? 'challenge'];
}

export function getStepIndex(step: RespondStep): number {
  return RESPOND_STEPS.indexOf(step);
}

export function parseAmount(text: string): number | undefined {
  const cleaned = text.trim().replace(/^\$/, '').replace(/,/g, '');
  return /^\d+(\.\d{1,2})?$/.test(cleaned) ? Number(cleaned) : undefined;
}

export function isValidChallengeAmount(amount: number | undefined, max: number): boolean {
  return amount !== undefined && amount >= MIN_CHALLENGE_AMOUNT && amount <= max;
}

export function getChallengedAmount(
  choice: AmountChoice,
  text: string,
  full: number,
): number | undefined {
  if (choice === 'full') {
    return full;
  }
  const amount = parseAmount(text);
  return isValidChallengeAmount(amount, full) ? roundMoney(amount ?? 0) : undefined;
}

export function formatAmountText(amount: number): string {
  return amount.toFixed(2);
}

export function getAmountError(max: number, currency: string): string {
  return copy.REASON.AMOUNT_ERROR(
    formatMoney(MIN_CHALLENGE_AMOUNT, currency),
    formatMoney(max, currency),
  );
}

export function createInitialState(chargeback: ChargebackCase): RespondFormState {
  const mode = getRespondMode(chargeback);
  const existingIds = new Set(chargeback.documents.map((document) => document.id));
  if (mode === 'resubmit') {
    return withAmount(
      {
        reason: chargeback.challengeReason,
        amountChoice: 'full',
        amountText: '',
        documentIds: chargeback.documents.map((document) => document.id),
        note: chargeback.challengeNote ?? '',
      },
      chargeback.challengedAmount,
      chargeback.chargebackAmount,
    );
  }
  const draft = chargeback.draft;
  if (!draft) {
    return { amountChoice: 'full', amountText: '', documentIds: [], note: '' };
  }
  return withAmount(
    {
      reason: draft.reason,
      amountChoice: 'full',
      amountText: '',
      documentIds: draft.documentIds.filter((id) => existingIds.has(id)),
      note: draft.note ?? '',
    },
    draft.challengedAmount,
    chargeback.chargebackAmount,
  );
}

export function getInitialStep(
  mode: RespondMode,
  state: RespondFormState,
  full: number,
  hasDraft: boolean,
): RespondStep {
  if (mode === 'resubmit') {
    return 'evidence';
  }
  if (!hasDraft) {
    return 'review';
  }
  const amount = getChallengedAmount(state.amountChoice, state.amountText, full);
  if (state.reason === undefined || amount === undefined) {
    return 'reason';
  }
  return state.documentIds.length ? 'submit' : 'evidence';
}

export function getEvidenceRows(
  reason: ChallengeReason | undefined,
  documents: readonly ChargebackDocument[],
): readonly EvidenceRow[] {
  const types = reason ? REASON_EVIDENCE[reason] : [];
  const rows: EvidenceRow[] = types.map((type) => ({
    key: type,
    type,
    label: CHARGEBACK_DOCUMENT_TYPE_LABELS[type],
    hint: CHARGEBACK_DOCUMENT_TYPE_HINTS[type],
    documents: documents.filter((document) => document.type === type),
  }));
  rows.push({
    key: 'other',
    type: 'other',
    label: copy.EVIDENCE.OTHER,
    hint: CHARGEBACK_DOCUMENT_TYPE_HINTS.other,
    documents: documents.filter((document) => !types.includes(document.type)),
  });
  return rows;
}

export function hasBlockedDocuments(documents: readonly ChargebackDocument[]): boolean {
  return documents.some(
    (document) =>
      document.securityStatus === 'rejected' || document.securityStatus === 'upload-failed',
  );
}

export function hasScanningDocuments(documents: readonly ChargebackDocument[]): boolean {
  return documents.some((document) => document.securityStatus === 'scanning');
}

export function wasDocumentSent(chargeback: ChargebackCase, documentId: string): boolean {
  return chargeback.timeline.some((event) => event.documentIds?.includes(documentId));
}

export function getReviewRows(chargeback: ChargebackCase): readonly ReviewRow[] {
  const labels = copy.REVIEW;
  const network = CARD_NETWORK_LABELS[chargeback.network];
  return [
    {
      key: 'amount',
      label: labels.AMOUNT,
      value: formatMoney(chargeback.chargebackAmount, chargeback.currency),
    },
    { key: 'claim', label: labels.CLAIM, value: chargeback.reasonDescription },
    {
      key: 'disputeReason',
      label: labels.DISPUTE_REASON,
      value: labels.DISPUTE_REASON_VALUE(network, chargeback.reasonCode),
    },
    {
      key: 'card',
      label: labels.CARD,
      value: caseCopy.DETAILS.CARD_NUMBER(chargeback.cardLastFour),
      valueLabel: caseCopy.HEADER.CARD_LABEL(network, chargeback.cardLastFour),
      logo: CARD_NETWORK_LOGOS[chargeback.network],
    },
    { key: 'transaction', label: labels.TRANSACTION, value: chargeback.transactionId },
    {
      key: 'transactionDate',
      label: labels.TRANSACTION_DATE,
      value: formatDate(chargeback.transactionDate),
    },
    {
      key: 'order',
      label: labels.ORDER,
      value: chargeback.orderReference,
      secondary: chargeback.dbaName,
    },
  ];
}

function withAmount(
  state: RespondFormState,
  amount: number | undefined,
  full: number,
): RespondFormState {
  if (amount === undefined || amount === full) {
    return state;
  }
  return { ...state, amountChoice: 'partial', amountText: formatAmountText(amount) };
}
