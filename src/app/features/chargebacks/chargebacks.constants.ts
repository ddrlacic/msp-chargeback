import {
  CardNetwork,
  ChargebackAction,
  ChargebackColorState,
  ChargebackDocumentType,
  ChargebackStatus,
} from '../../services/chargeback/chargeback.types';
import { ColumnKey, ListTab, ReceivedPreset } from './chargebacks.types';

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

export const CHARGEBACK_ACTION_LABELS: Record<ChargebackAction, string> = {
  accept: 'Accept chargeback',
  challenge: 'Challenge chargeback',
  'continue-challenge': 'Continue challenge',
  resubmit: 'Fix and resubmit',
  'respond-pre-arbitration': 'Respond to pre-arbitration',
  'request-arbitration': 'Request arbitration',
};

export const CHARGEBACK_STATE_LABELS: Record<ChargebackColorState, string> = {
  'needs-action': 'Needs action',
  'in-review': 'In review',
  won: 'Won',
  lost: 'Lost',
};

export const CARD_NETWORK_LOGOS: Record<CardNetwork, string> = {
  visa: 'card-networks/visa.svg',
  mastercard: 'card-networks/mastercard.svg',
  amex: 'card-networks/amex.svg',
  discover: 'card-networks/discover.svg',
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

export const RECEIVED_PRESET_LABELS: Record<ReceivedPreset, string> = {
  any: 'Any date',
  'last-7-days': 'Last 7 days',
  'last-30-days': 'Last 30 days',
  'last-90-days': 'Last 90 days',
  'this-month': 'This month',
  'last-month': 'Last month',
};

export const COLUMN_LABELS: Record<ColumnKey, string> = {
  caseId: 'Case ID',
  status: 'Status',
  dueDate: 'Due date',
  amount: 'Amount',
  reason: 'Reason',
  card: 'Card',
  transaction: 'Transaction',
  transactionDate: 'Transaction date',
  location: 'Location',
  received: 'Received',
  lastUpdated: 'Last updated',
};

export const LIST_TAB_EMPTY_COPY: Record<
  ListTab,
  { readonly title: string; readonly message?: string }
> = {
  all: {
    title: 'No chargebacks',
    message: 'When a cardholder disputes a payment, the case shows up here',
  },
  'needs-action': { title: 'Nothing needs action', message: 'You’re all caught up' },
  'in-review': { title: 'No cases in review' },
  won: { title: 'No won cases' },
  lost: { title: 'No lost cases' },
};

const countLabel = (count: number, singular: string, plural: string) =>
  count === 1 ? `1 ${singular}` : `${count} ${plural}`;

export const CHARGEBACKS_CONSTANTS = {
  LIST: {
    TITLE: 'Chargebacks',
    TABS: {
      LABEL: 'Case status',
      ALL: 'All',
      DISPUTED: (amount: string) => `${amount} disputed`,
      RETURNED: (amount: string) => `${amount} returned`,
      DUE_SOON: (count: number) => `${count} due soon`,
    },
    SEARCH: {
      LABEL: 'Search cases',
      PLACEHOLDER: 'Search by case ID, transaction, or MID',
      CLEAR: 'Clear search',
    },
    FILTERS: {
      RECEIVED: 'Received',
      LOCATION: 'Location',
      NETWORK: 'Card network',
      LOCATIONS: (count: number) => countLabel(count, 'location', 'locations'),
      NETWORKS: (count: number) => countLabel(count, 'network', 'networks'),
      CLEAR: 'Clear filters',
    },
    EXPORT: {
      ALL: 'Export cases',
      SELECTED: (count: number) => `Export ${countLabel(count, 'case', 'cases')}`,
      FILE_NAME: (date: string) => `chargebacks-${date}.csv`,
      CURRENCY: 'Currency',
      REASON_CODE: 'Reason code',
      CARD_LAST_FOUR: 'Card last four',
      MERCHANT_ID: 'Merchant ID',
    },
    TABLE: {
      CAPTION: 'Chargeback cases',
      ACTION: 'Action',
      SELECT_ALL: 'Select all cases in view',
      SELECT_ROW: (caseId: string) => `Select case ${caseId}`,
      RESIZE: (column: string) => `Resize the ${column} column`,
      VIEW_DETAILS: 'View details',
      NO_DUE_DATE: 'No due date',
      CARD: (network: string, lastFour: string) => `${network} ending in ${lastFour}`,
      IN_VIEW: (count: number) => `${countLabel(count, 'case', 'cases')} in view`,
      SELECTED: (selected: number, total: number) => `${selected} of ${total} selected`,
      TOTAL: 'Total disputed',
    },
    NO_RESULTS: {
      TITLE: 'No cases match your filters',
      MESSAGE: 'Try different words or clear the filters',
    },
  },
  CASE: {
    BREADCRUMB: 'Chargebacks',
    TITLE: (caseId: string) => `Case ${caseId}`,
    NOT_FOUND_TITLE: 'Case not found',
    NOT_FOUND_MESSAGE: 'Check the link, or go back to the chargeback list',
    BACK_TO_LIST: 'Go to chargebacks',
    HEADER: {
      AMOUNT: 'Disputed amount',
      CARD: (network: string, lastFour: string) => `${network} •••• ${lastFour}`,
      CARD_LABEL: (network: string, lastFour: string) => `${network} ending in ${lastFour}`,
    },
    BANNER: {
      DEADLINE: (date: string) => `Respond by ${date}, or the chargeback stands`,
      DECISION_DEADLINE: (date: string) => `Decide by ${date}, or the chargeback stands`,
      DRAFT_SAVED: (dateTime: string) => `Draft saved ${dateTime}`,
      DRAFT_CONTENT: (amount: string, documents: number) =>
        `Challenging ${amount} with ${countLabel(documents, 'document', 'documents')}`,
      WORLDPAY_NOTE: 'Note from Worldpay',
      PARTIALLY_WON: (returned: string, challenged: string) =>
        `${returned} of ${challenged} is returned to your account`,
    },
    OPTIONS: {
      LABEL: 'Your options',
      ACCEPT_DESCRIPTION: (amount: string) =>
        `${amount} stays charged and the case closes. You cannot undo this.`,
      CHALLENGE_DESCRIPTION:
        'Send evidence that the payment was valid. Worldpay reviews it and passes it on to the cardholder’s bank.',
      ARBITRATION_DESCRIPTION: (fees: string) =>
        `The card network makes the final decision. If you lose, ${fees}.`,
      FEES_UP_TO: (amount: string) => `fees of up to ${amount} apply`,
      FEES_FROM: (amount: string) => `fees of ${amount} or more apply`,
      FEES: 'fees apply',
    },
    DETAILS: {
      TITLE: 'Case details',
      CASE_ID: 'Case ID',
      REASON: 'Reason',
      REASON_CODE: (code: string) => `Reason code ${code}`,
      CARD: 'Card',
      CARD_NUMBER: (lastFour: string) => `•••• ${lastFour}`,
      TRANSACTION: 'Transaction',
      ORDER: 'Order',
      TRANSACTION_DATE: 'Transaction date',
      TRANSACTION_AMOUNT: 'Transaction amount',
      RECEIVED: 'Received',
      LOCATION: 'Location',
      LEGAL_ENTITY: 'Legal entity',
    },
    DEADLINE: {
      RESPOND_BY: 'Respond by',
      DECIDE_BY: 'Decide by',
    },
    MONEY: {
      TITLE: 'Amounts',
      DISPUTED: 'Disputed',
      CHALLENGED: 'Challenged',
      DEBITED: 'Debited',
      CREDITED: 'Credited back',
      NET: 'Net',
      NET_SO_FAR: 'Net so far',
      NET_HINT: 'Final when the case closes',
    },
    DOCUMENTS: {
      TITLE: 'Documents',
      LIST: 'Case documents',
      UPLOADED: (date: string, by: string) => `Uploaded ${date} by ${by}`,
      SENT: (date: string) => `Sent to Worldpay ${date}`,
      SCANNING: 'Scanning',
      REJECTED: 'Blocked by the security scan',
      UPLOAD_FAILED: 'Upload failed',
      PREVIEW: (name: string) => `Preview ${name}`,
      DOWNLOAD: (name: string) => `Download ${name}`,
      UPLOAD_DIALOG: {
        TITLE: 'Upload documents',
        TYPE: 'Document type',
        TYPE_PLACEHOLDER: 'Select document type',
        DROP: 'Drag and drop to upload files or',
        CHOOSE: 'choose from files',
        HINT: 'PDF, JPG, or PNG. Up to 5 files, 30 MB in total.',
        FILES: 'Files to upload',
        REMOVE: (name: string) => `Remove ${name}`,
        CANCEL: 'Cancel',
        SUBMIT: (count: number) => (count === 1 ? 'Upload document' : 'Upload documents'),
        WRONG_TYPE: (name: string) => `Couldn’t add ${name}. Use a PDF, JPG, or PNG file.`,
        TOO_MANY: 'You can upload up to 5 files at a time',
        TOO_LARGE: (name: string) => `Couldn’t add ${name}. Files can be up to 30 MB in total.`,
      },
      SAMPLE: {
        TITLE: 'Sample document',
        CASE: (caseId: string) => `Case ${caseId}`,
        NOTE: 'This file is fake data in the MSP chargeback prototype.',
      },
    },
    TIMELINE: {
      TITLE: 'Timeline',
    },
  },
  DUE_DATE: {
    DAYS_LEFT: (days: number) => (days === 1 ? '1 day left' : `${days} days left`),
    DUE_TODAY: 'Due today',
    OVERDUE: (days: number) => (days === 1 ? '1 day overdue' : `${days} days overdue`),
  },
} as const;
