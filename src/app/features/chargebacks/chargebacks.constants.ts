import {
  CardNetwork,
  ChallengeReason,
  ChargebackAction,
  ChargebackColorState,
  ChargebackDocumentSecurityStatus,
  ChargebackDocumentType,
  ChargebackStatus,
} from '../../services/chargeback/chargeback.types';
import { formatFileSize } from '../../shared/utils/file.utils';
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
    message: 'The cardholder’s bank challenged your response. Worldpay is handling it.',
    cta: 'View timeline',
  },
  'pre-arbitration-response-required': {
    label: 'Pre-arbitration response required',
    message: 'The cardholder’s bank challenged your previous response. Review the case and respond.',
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
    message: 'The cardholder’s bank withdrew the dispute',
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

export const CHARGEBACK_DOCUMENT_TYPE_HINTS: Record<ChargebackDocumentType, string> = {
  'transaction-receipt': 'Shows the amount, date, and items',
  invoice: 'Itemized order with the total',
  'delivery-proof': 'Photo, signature, or tracking that shows the order arrived',
  'customer-communication': 'Emails or messages with the cardholder',
  'refund-proof': 'Receipt or confirmation that shows the refund',
  'authorization-proof': 'Signed slip or approval record for the payment',
  'terms-and-conditions': 'Your refund or cancellation policy the cardholder agreed to',
  other: 'Anything else that supports your response',
};

export const CHARGEBACK_DOCUMENT_STATUS_LABELS: Partial<
  Record<ChargebackDocumentSecurityStatus, string>
> = {
  scanning: 'Scanning',
  rejected: 'Blocked by the security scan',
  'upload-failed': 'Upload failed',
};

export interface ChallengeReasonCopy {
  readonly label: string;
  readonly description: string;
}

export const CHALLENGE_REASON_COPY: Record<ChallengeReason, ChallengeReasonCopy> = {
  'credit-issued': {
    label: 'Credit already issued',
    description: 'You refunded the cardholder before they disputed the payment',
  },
  'cardholder-withdrew': {
    label: 'Cardholder no longer disputes',
    description: 'The cardholder agreed the payment is valid',
  },
  'invalid-dispute': {
    label: 'Invalid dispute',
    description: 'The dispute was filed too late, twice, or with wrong details',
  },
  'proof-of-purchase': {
    label: 'Proof of purchase or delivery',
    description: 'The cardholder paid for the order and received it',
  },
};

export const RESPOND_PATH = 'respond';

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
      BANK_NOTE: 'Note from the cardholder’s bank',
      PARTIALLY_WON: (returned: string, challenged: string) =>
        `${returned} of ${challenged} is returned to your account`,
      ARBITRATION_FEES: (fees: string) => `If you lose, ${fees}`,
      LOST_FEES: (fees: string) => `You also pay ${fees} in arbitration fees`,
    },
    OPTIONS: {
      LABEL: 'Your options',
      ACCEPT_DESCRIPTION: (amount: string) =>
        `${amount} stays charged and the case closes. You cannot undo this.`,
      CHALLENGE_DESCRIPTION:
        'Send evidence that the payment was valid. Worldpay reviews it and passes it on to the cardholder’s bank.',
      PRE_ARBITRATION_DESCRIPTION:
        'Send new evidence for the cardholder’s bank to review. If they still disagree, you can take the case to arbitration.',
      ARBITRATION_DESCRIPTION: (network: string, fees: string) =>
        `${network} makes the final decision. If you lose, ${fees}.`,
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
      FEES: 'Arbitration fees',
      NET: 'Net',
      NET_SO_FAR: 'Net so far',
      NET_HINT: 'Final when the case closes',
    },
    DOCUMENTS: {
      UPLOAD_DIALOG: {
        TITLE: 'Upload documents',
        TYPE: 'Document type',
        TYPE_PLACEHOLDER: 'Select document type',
        DROP: 'Drag and drop to upload files or',
        CHOOSE: 'choose from files',
        HINT: (fileLimit: string) =>
          `PDF, JPG, PNG, GIF, or TIF. Up to ${fileLimit} per file and 10 MB per case.`,
        FILES: 'Files to upload',
        REMOVE: (name: string) => `Remove ${name}`,
        CANCEL: 'Cancel',
        SUBMIT: (count: number) => (count === 1 ? 'Upload document' : 'Upload documents'),
        WRONG_TYPE: (name: string) => `Couldn’t add ${name}. Use a PDF, JPG, PNG, GIF, or TIF file.`,
        TOO_MANY: 'A case can have up to 50 documents',
        TOO_LARGE: (name: string, limit: number) =>
          `Couldn’t add ${name}. Each file can be up to ${formatFileSize(limit)}.`,
        CASE_TOO_LARGE: (name: string) =>
          `Couldn’t add ${name}. A case can have up to 10 MB of documents.`,
        DUPLICATE: (name: string) =>
          `Couldn’t add ${name}. This case already has a document with that name.`,
      },
      SAMPLE: {
        TITLE: 'Sample document',
        CASE: (caseId: string) => `Case ${caseId}`,
        NOTE: 'This file is fake data in the MSP chargeback prototype.',
      },
    },
    TIMELINE: {
      TITLE: 'Timeline',
      ACTORS: {
        merchant: 'You',
        worldpay: 'Worldpay',
        'cardholder-bank': 'Cardholder’s bank',
        'card-network': 'Card network',
      },
      PENDING: {
        RESPONSE_NEEDED: 'Your response is needed',
        DECISION_NEEDED: 'Your decision is needed',
        RETURNED: 'Worldpay returned your response',
        SENT_TO_BANK: 'Worldpay is sending your response to the cardholder’s bank',
        UNDER_REVIEW: 'Waiting for the cardholder’s bank to decide',
        HANDLING_CHALLENGE: 'Worldpay is handling the challenge',
        WAITING_FOR_NETWORK: 'Waiting for the card network’s final decision',
        RESPOND_BY: (date: string) => `Respond by ${date}`,
        RESUBMIT_BY: (date: string) => `Resubmit by ${date}`,
        DECIDE_BY: (date: string) => `Decide by ${date}`,
      },
      MONEY: {
        DEBITED: (amount: string) => `${amount} debited`,
        CREDITED: (amount: string) => `${amount} credited back`,
        FEES: (amount: string) => `${amount} arbitration fees debited`,
      },
      DOCUMENTS: 'Documents sent',
      PREVIEW: (name: string) => `Preview ${name}`,
    },
  },
  ACCEPT_DIALOG: {
    TITLE: 'Accept chargeback',
    DESCRIPTION: (amount: string) =>
      `${amount} stays charged and the case closes. You cannot undo this.`,
    CANCEL: 'Cancel',
    CONFIRM: 'Accept chargeback',
  },
  ARBITRATION_DIALOG: {
    TITLE: 'Request arbitration',
    DESCRIPTION: (network: string) => `${network} reviews both sides and makes a final decision`,
    WIN: 'If you win',
    WIN_VALUE: (amount: string) => `${amount} is returned to your account`,
    LOSE: 'If you lose',
    LOSE_VALUE: (amount: string, fees: string) =>
      `${amount} stays charged and you pay ${fees} in fees`,
    LOSE_VALUE_UNKNOWN_FEES: (amount: string) =>
      `${amount} stays charged and you pay the arbitration fees`,
    FEES_UP_TO: (amount: string) => `up to ${amount}`,
    FEE_BREAKDOWN: (filing: string, review: string) =>
      `${filing} filing fee and ${review} review fee`,
    FEE_BREAKDOWN_WITH_ERRORS: (filing: string, review: string, perError: string) =>
      `${filing} filing fee and ${review} review fee, plus ${perError} for each technical error`,
    CANCEL: 'Cancel',
    CONFIRM: 'Request arbitration',
  },
  RESPOND: {
    TITLE: {
      challenge: 'Challenge chargeback',
      resubmit: 'Fix and resubmit',
      'pre-arbitration': 'Respond to pre-arbitration',
    },
    STEPS_LABEL: 'Progress',
    STEP_OF: (step: number, total: number) => `Step ${step} of ${total}`,
    STEP_DONE: 'Completed',
    STEPS: {
      review: 'Review',
      reason: 'Reason and amount',
      evidence: 'Evidence',
      submit: 'Review and submit',
    },
    ACTIONS: {
      BACK: 'Back',
      CONTINUE: 'Continue',
      SAVE_AND_EXIT: 'Save and exit',
      CANCEL: 'Cancel',
      SUBMIT: 'Submit response',
    },
    NOTE: {
      TITLE: 'Note from Worldpay',
      DEADLINE: (date: string) => `Resubmit by ${date}, or the chargeback stands`,
      BANK_TITLE: 'Note from the cardholder’s bank',
      BANK_DEADLINE: (date: string) => `Respond by ${date}, or the chargeback stands`,
    },
    REVIEW: {
      DESCRIPTION: 'Check the dispute before you respond',
      PRE_ARBITRATION_DESCRIPTION:
        'The cardholder’s bank reviewed your response and still disputes the payment',
      DEADLINE: (date: string) => `Respond by ${date}, or the chargeback stands`,
      AMOUNT: 'Disputed amount',
      CLAIM: 'Cardholder’s claim',
      DISPUTE_REASON: 'Dispute reason',
      DISPUTE_REASON_VALUE: (network: string, code: string) => `${network} reason code ${code}`,
      TRANSACTION: 'Transaction',
      TRANSACTION_DATE: 'Transaction date',
      ORDER: 'Order',
      CARD: 'Card',
    },
    REASON: {
      LEGEND: 'Challenge reason',
      DESCRIPTION: 'Choose the reason that fits best. It decides which documents to add.',
      ERROR: 'Choose a reason',
      AMOUNT_LEGEND: 'Amount to challenge',
      AMOUNT_FULL: (amount: string) => `Full amount (${amount})`,
      AMOUNT_SAME: (amount: string) => `Same amount as before (${amount})`,
      AMOUNT_PARTIAL: 'Smaller amount',
      AMOUNT_LABEL: 'Amount',
      AMOUNT_HINT: (max: string) => `Up to ${max}`,
      AMOUNT_ERROR: (min: string, max: string) => `Enter an amount from ${min} to ${max}`,
    },
    EVIDENCE: {
      DESCRIPTION:
        'Add documents that support your reason. Worldpay passes them on to the cardholder’s bank.',
      PRE_ARBITRATION_DESCRIPTION:
        'Add new documents that answer the challenge. The cardholder’s bank already has the ones you sent before.',
      PREVIOUS: {
        TITLE: 'Your previous response',
        SENT: (date: string) => `Sent ${date}`,
        REASON: 'Reason',
        AMOUNT: 'Amount',
        DOCUMENTS: 'Documents',
        NOTE: 'Note',
      },
      CHECKLIST: 'Documents to add',
      OTHER: 'Other documents',
      UPLOAD: 'Upload',
      UPLOAD_LABEL: (type: string) => `Upload ${type.toLowerCase()}`,
      FILES: (type: string) => `${type} files`,
      REMOVE: (name: string) => `Remove ${name}`,
      PREVIEW: (name: string) => `Preview ${name}`,
      ADDED: 'Added',
      NOTE_LABEL: 'Note (optional)',
      NOTE_HINT: 'Tell Worldpay anything the documents do not show',
      NO_DOCUMENTS: 'Add at least one document',
      BLOCKED: 'Remove documents that did not upload',
    },
    SUBMIT: {
      DESCRIPTION: 'Check what you are sending. Nothing goes to Worldpay until you submit.',
      REASON: 'Reason',
      AMOUNT: 'Amount',
      DOCUMENTS: 'Documents',
      NOTE: 'Note',
      EDIT: 'Edit',
      EDIT_LABEL: (section: string) => `Edit ${section.toLowerCase()}`,
      AMOUNT_PARTIAL: (amount: string, full: string) => `${amount} of ${full}`,
      NEXT_TITLE: 'What happens next',
      NEXT_CREDIT: (amount: string) =>
        `Worldpay reviews your response and passes it on to the cardholder’s bank. ${amount} is credited back to your account while they decide.`,
      NEXT_NO_CREDIT:
        'Worldpay reviews your response and passes it on to the cardholder’s bank. No money moves until they decide.',
      NEXT_PRE_ARBITRATION:
        'Worldpay reviews your response and passes it on to the cardholder’s bank. No money moves until they decide. If they still disagree, you can take the case to arbitration.',
      SCANNING: 'Scanning documents. You can submit when it finishes',
      BLOCKED: 'Remove documents that did not upload to submit',
    },
  },
  DUE_DATE: {
    DAYS_LEFT: (days: number) => (days === 1 ? '1 day left' : `${days} days left`),
    DUE_TODAY: 'Due today',
    OVERDUE: (days: number) => (days === 1 ? '1 day overdue' : `${days} days overdue`),
  },
} as const;
