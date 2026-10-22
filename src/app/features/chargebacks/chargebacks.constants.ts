import {
  CardNetwork,
  ChargebackColorState,
  ChargebackDocumentType,
  ChargebackStatus,
} from '../../services/chargeback/chargeback.types';

export interface ChargebackStatusCopy {
  readonly label: string;
  readonly message: string;
  readonly cta: string;
}

export const CHARGEBACK_STATUS_COPY: Record<ChargebackStatus, ChargebackStatusCopy> = {
  'action-required': {
    label: 'Action required',
    message: 'Choose to accept or challenge the chargeback',
    cta: 'Review and respond',
  },
  'evidence-required': {
    label: 'Evidence required',
    message: 'Finish your challenge and submit it before the due date',
    cta: 'Continue challenge',
  },
  'returned-by-worldpay': {
    label: 'Returned by Worldpay',
    message: 'Worldpay returned your response. See their note and resubmit.',
    cta: 'Fix and resubmit',
  },
  'response-submitted': {
    label: 'Response submitted',
    message: 'Your response has been sent to Worldpay',
    cta: 'View timeline',
  },
  'under-review': {
    label: 'Under review',
    message: 'Worldpay or the card network is reviewing your response',
    cta: 'View timeline',
  },
  'pre-arbitration': {
    label: 'Pre-arbitration',
    message: 'The issuer challenged your response. Worldpay is handling it.',
    cta: 'View timeline',
  },
  'pre-arbitration-response-required': {
    label: 'Pre-arbitration response required',
    message: 'The issuer challenged your previous response. Review the case and respond.',
    cta: 'Respond to pre-arbitration',
  },
  'decision-needed': {
    label: 'Decision needed',
    message: 'Choose whether to take the case to arbitration. Fees apply if you lose.',
    cta: 'Review options',
  },
  arbitration: {
    label: 'Arbitration',
    message: 'The card network is making a final decision',
    cta: 'View timeline',
  },
  won: {
    label: 'Won',
    message: 'Resolved in your favor. {amount} is returned to your account.',
    cta: 'View details',
  },
  'partially-won': {
    label: 'Partially won',
    message: 'Part of the amount was resolved in your favor',
    cta: 'View details',
  },
  'dispute-withdrawn': {
    label: 'Dispute withdrawn',
    message: 'The issuer withdrew the dispute',
    cta: 'View details',
  },
  lost: {
    label: 'Lost',
    message: 'You remain liable for {amount}',
    cta: 'View details',
  },
  accepted: {
    label: 'Accepted',
    message: 'You accepted the chargeback. {amount} stays charged.',
    cta: 'View details',
  },
  'deadline-missed': {
    label: 'Deadline missed',
    message: 'No response was sent by the due date. The chargeback stands.',
    cta: 'View details',
  },
};

export const CHARGEBACK_STATE_LABELS: Record<ChargebackColorState, string> = {
  'needs-action': 'Needs action',
  'in-review': 'In review',
  won: 'Won',
  lost: 'Lost',
};

export const CARD_NETWORK_LABELS: Record<CardNetwork, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
};

export const CHARGEBACK_DOCUMENT_TYPE_LABELS: Record<ChargebackDocumentType, string> = {
  'transaction-receipt': 'Transaction receipt',
  invoice: 'Invoice',
  'delivery-proof': 'Delivery proof',
  'customer-communication': 'Customer communication',
  'refund-proof': 'Refund proof',
  'authorization-proof': 'Authorization proof',
  'terms-and-conditions': 'Terms and conditions',
  other: 'Other',
};

export const CHARGEBACKS_CONSTANTS = {
  LIST: {
    TITLE: 'Chargebacks',
    DESCRIPTION: 'Review chargebacks and respond before the due date',
  },
  CASE: {
    BREADCRUMB: 'Chargebacks',
    TITLE: (caseId: string) => `Case ${caseId}`,
    NOT_FOUND_TITLE: 'Case not found',
    NOT_FOUND_MESSAGE: 'Check the link, or go back to the chargeback list',
    BACK_TO_LIST: 'Go to chargebacks',
    STATUS: 'Status',
    AMOUNT: 'Amount',
    REASON: 'Reason',
    LOCATION: 'Location',
    DUE: 'Respond by',
  },
  DUE_DATE: {
    DAYS_LEFT: (days: number) => (days === 1 ? '1 day left' : `${days} days left`),
    DUE_TODAY: 'Due today',
    OVERDUE: (days: number) => (days === 1 ? '1 day overdue' : `${days} days overdue`),
  },
} as const;
