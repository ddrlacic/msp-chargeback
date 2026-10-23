import {
  CardNetwork,
  ChargebackAction,
  ChargebackCase,
  ChargebackColorState,
  ChargebackDocument,
  ChargebackStatus,
} from '../../../services/chargeback/chargeback.types';
import {
  getStatusState,
  isNeedsAction,
  roundMoney,
} from '../../../services/chargeback/chargeback.utils';
import { formatDate, formatDateAtTime } from '../../../shared/utils/date.utils';
import { formatFileSize } from '../../../shared/utils/file.utils';
import { formatMoney, formatSignedMoney } from '../../../shared/utils/money.utils';
import {
  CARD_NETWORK_LABELS,
  CHARGEBACK_ACTION_LABELS,
  CHARGEBACK_DOCUMENT_TYPE_LABELS,
  CHARGEBACK_STATUS_COPY,
  CHARGEBACKS_CONSTANTS,
} from '../chargebacks.constants';

const copy = CHARGEBACKS_CONSTANTS.CASE;

const OPTION_STATUSES: readonly ChargebackStatus[] = ['action-required', 'decision-needed'];

const ARBITRATION_FEES: Partial<Record<CardNetwork, string>> = {
  visa: copy.OPTIONS.FEES_UP_TO('$500'),
  mastercard: copy.OPTIONS.FEES_FROM('$400'),
};

export interface CaseAction {
  readonly action: ChargebackAction;
  readonly label: string;
  readonly primary: boolean;
}

export interface CaseOption extends CaseAction {
  readonly description: string;
}

export interface CaseDraftSummary {
  readonly saved: string;
  readonly content: string;
}

export interface CaseBanner {
  readonly state: ChargebackColorState;
  readonly title: string;
  readonly detail?: string;
  readonly deadline?: string;
  readonly note?: string;
  readonly draft?: CaseDraftSummary;
  readonly actions: readonly CaseAction[];
  readonly options: readonly CaseOption[];
}

export interface CaseHeader {
  readonly amount: string;
  readonly reason: string;
  readonly card: string;
  readonly cardLabel: string;
  readonly order: string;
  readonly location: string;
}

export interface MoneyRow {
  readonly key: 'disputed' | 'challenged' | 'debited' | 'credited' | 'net';
  readonly label: string;
  readonly value: string;
}

export interface MoneySummaryView {
  readonly rows: readonly MoneyRow[];
  readonly hint?: string;
}

export interface DetailRow {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly secondary?: string;
  readonly valueLabel?: string;
}

export type DocumentStatusTone = 'scanning' | 'error';

export interface DocumentRow {
  readonly document: ChargebackDocument;
  readonly typeLabel: string;
  readonly size: string;
  readonly dateLabel: string;
  readonly status?: { readonly label: string; readonly tone: DocumentStatusTone };
  readonly sent: boolean;
  readonly canOpen: boolean;
  readonly canDelete: boolean;
}

export interface TimelineRow {
  readonly id: string;
  readonly title: string;
  readonly worldpayTerm?: string;
  readonly date: string;
  readonly occurredAt: string;
  readonly amount?: string;
}

export function getOutstandingAmount(chargeback: ChargebackCase): number {
  return Math.max(0, roundMoney(chargeback.amountDebited - chargeback.amountCredited));
}

export function getCaseHeader(chargeback: ChargebackCase): CaseHeader {
  const network = CARD_NETWORK_LABELS[chargeback.network];
  return {
    amount: formatMoney(chargeback.chargebackAmount, chargeback.currency),
    reason: chargeback.reasonDescription,
    card: copy.HEADER.CARD(network, chargeback.cardLastFour),
    cardLabel: copy.HEADER.CARD_LABEL(network, chargeback.cardLastFour),
    order: chargeback.orderReference,
    location: chargeback.dbaName,
  };
}

export function getCaseBanner(chargeback: ChargebackCase): CaseBanner {
  const actions = getCaseActions(chargeback);
  const withOptions = OPTION_STATUSES.includes(chargeback.status);
  return {
    state: getStatusState(chargeback.status),
    title: CHARGEBACK_STATUS_COPY[chargeback.status].message.replace(
      '{amount}',
      formatMoney(getMessageAmount(chargeback), chargeback.currency),
    ),
    detail: getBannerDetail(chargeback),
    deadline: getDeadline(chargeback),
    note: chargeback.status === 'returned-by-worldpay' ? chargeback.worldpayNote : undefined,
    draft: getDraftSummary(chargeback),
    actions: withOptions ? [] : actions,
    options: withOptions
      ? actions.map((action) => ({
          ...action,
          description: getOptionDescription(chargeback, action.action),
        }))
      : [],
  };
}

export function getMoneySummary(chargeback: ChargebackCase): MoneySummaryView {
  const currency = chargeback.currency;
  const open = isOpen(chargeback.status);
  const challenged = chargeback.challengedAmount;
  const net = roundMoney(chargeback.amountCredited - chargeback.amountDebited);
  const rows: MoneyRow[] = [
    {
      key: 'disputed',
      label: copy.MONEY.DISPUTED,
      value: formatMoney(chargeback.chargebackAmount, currency),
    },
  ];
  if (challenged !== undefined && challenged !== chargeback.chargebackAmount) {
    rows.push({
      key: 'challenged',
      label: copy.MONEY.CHALLENGED,
      value: formatMoney(challenged, currency),
    });
  }
  rows.push(
    {
      key: 'debited',
      label: copy.MONEY.DEBITED,
      value: formatSignedMoney(-chargeback.amountDebited, currency),
    },
    {
      key: 'credited',
      label: copy.MONEY.CREDITED,
      value: formatMoney(chargeback.amountCredited, currency),
    },
    {
      key: 'net',
      label: open ? copy.MONEY.NET_SO_FAR : copy.MONEY.NET,
      value: formatSignedMoney(net, currency),
    },
  );
  return { rows, hint: open ? copy.MONEY.NET_HINT : undefined };
}

export function getCaseDetails(chargeback: ChargebackCase): readonly DetailRow[] {
  const labels = copy.DETAILS;
  const header = getCaseHeader(chargeback);
  return [
    { key: 'caseId', label: labels.CASE_ID, value: chargeback.caseId },
    {
      key: 'reason',
      label: labels.REASON,
      value: chargeback.reasonDescription,
      secondary: labels.REASON_CODE(chargeback.reasonCode),
    },
    { key: 'card', label: labels.CARD, value: header.card, valueLabel: header.cardLabel },
    { key: 'transaction', label: labels.TRANSACTION, value: chargeback.transactionId },
    { key: 'order', label: labels.ORDER, value: chargeback.orderReference },
    {
      key: 'transactionDate',
      label: labels.TRANSACTION_DATE,
      value: formatDate(chargeback.transactionDate),
    },
    {
      key: 'transactionAmount',
      label: labels.TRANSACTION_AMOUNT,
      value: formatMoney(chargeback.transactionAmount, chargeback.currency),
    },
    { key: 'received', label: labels.RECEIVED, value: formatDate(chargeback.chargebackDate) },
    {
      key: 'location',
      label: labels.LOCATION,
      value: chargeback.dbaName,
      secondary: chargeback.merchantId,
    },
    { key: 'legalEntity', label: labels.LEGAL_ENTITY, value: chargeback.legalEntityName },
  ];
}

export function canUploadDocuments(chargeback: ChargebackCase): boolean {
  return isNeedsAction(chargeback.status);
}

export function getDocumentRows(chargeback: ChargebackCase): readonly DocumentRow[] {
  const sentAt = getSentDates(chargeback);
  const editable = canUploadDocuments(chargeback);
  return chargeback.documents.map((document) => {
    const sent = sentAt.get(document.id);
    return {
      document,
      typeLabel: CHARGEBACK_DOCUMENT_TYPE_LABELS[document.type],
      size: formatFileSize(document.sizeBytes),
      dateLabel: sent
        ? copy.DOCUMENTS.SENT(formatDate(sent))
        : copy.DOCUMENTS.UPLOADED(formatDate(document.createdDateTime), document.uploadedBy),
      status: getDocumentStatus(document),
      sent: sent !== undefined,
      canOpen: document.securityStatus === 'clean',
      canDelete: editable && sent === undefined && document.securityStatus !== 'scanning',
    };
  });
}

export function getTimelineRows(chargeback: ChargebackCase): readonly TimelineRow[] {
  return [...chargeback.timeline].reverse().map((event) => ({
    id: event.id,
    title: event.title,
    worldpayTerm: event.worldpayTerm,
    date: formatDateAtTime(event.occurredAt),
    occurredAt: event.occurredAt,
    amount:
      event.amountChange === undefined
        ? undefined
        : formatSignedMoney(event.amountChange, chargeback.currency),
  }));
}

function getCaseActions(chargeback: ChargebackCase): CaseAction[] {
  const primary = chargeback.allowedActions[0];
  return [...chargeback.allowedActions].reverse().map((action) => ({
    action,
    label: CHARGEBACK_ACTION_LABELS[action],
    primary: action === primary,
  }));
}

function getOptionDescription(chargeback: ChargebackCase, action: ChargebackAction): string {
  switch (action) {
    case 'accept':
      return copy.OPTIONS.ACCEPT_DESCRIPTION(
        formatMoney(getOutstandingAmount(chargeback), chargeback.currency),
      );
    case 'request-arbitration':
      return copy.OPTIONS.ARBITRATION_DESCRIPTION(
        ARBITRATION_FEES[chargeback.network] ?? copy.OPTIONS.FEES,
      );
    default:
      return copy.OPTIONS.CHALLENGE_DESCRIPTION;
  }
}

function getMessageAmount(chargeback: ChargebackCase): number {
  return chargeback.status === 'won'
    ? (chargeback.challengedAmount ?? chargeback.chargebackAmount)
    : getOutstandingAmount(chargeback);
}

function getBannerDetail(chargeback: ChargebackCase): string | undefined {
  if (chargeback.status !== 'partially-won') {
    return undefined;
  }
  return copy.BANNER.PARTIALLY_WON(
    formatMoney(chargeback.amountCredited, chargeback.currency),
    formatMoney(chargeback.challengedAmount ?? chargeback.chargebackAmount, chargeback.currency),
  );
}

function getDeadline(chargeback: ChargebackCase): string | undefined {
  if (!chargeback.replyByDate || !isNeedsAction(chargeback.status)) {
    return undefined;
  }
  const date = formatDate(chargeback.replyByDate);
  return chargeback.status === 'decision-needed'
    ? copy.BANNER.DECISION_DEADLINE(date)
    : copy.BANNER.DEADLINE(date);
}

function getDraftSummary(chargeback: ChargebackCase): CaseDraftSummary | undefined {
  const draft = chargeback.draft;
  if (chargeback.status !== 'evidence-required' || !draft) {
    return undefined;
  }
  return {
    saved: copy.BANNER.DRAFT_SAVED(formatDateAtTime(draft.savedAt)),
    content: copy.BANNER.DRAFT_CONTENT(
      formatMoney(draft.challengedAmount ?? chargeback.chargebackAmount, chargeback.currency),
      draft.documentIds.length,
    ),
  };
}

function getSentDates(chargeback: ChargebackCase): Map<string, string> {
  const sent = new Map<string, string>();
  for (const event of chargeback.timeline) {
    if (event.actor !== 'merchant') {
      continue;
    }
    for (const id of event.documentIds ?? []) {
      if (!sent.has(id)) {
        sent.set(id, event.occurredAt);
      }
    }
  }
  return sent;
}

function getDocumentStatus(document: ChargebackDocument): DocumentRow['status'] {
  switch (document.securityStatus) {
    case 'scanning':
      return { label: copy.DOCUMENTS.SCANNING, tone: 'scanning' };
    case 'rejected':
      return { label: copy.DOCUMENTS.REJECTED, tone: 'error' };
    case 'upload-failed':
      return { label: copy.DOCUMENTS.UPLOAD_FAILED, tone: 'error' };
    default:
      return undefined;
  }
}

function isOpen(status: ChargebackStatus): boolean {
  const state = getStatusState(status);
  return state === 'needs-action' || state === 'in-review';
}
