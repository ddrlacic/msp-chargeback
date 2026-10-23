import {
  ChargebackAction,
  ChargebackCase,
  ChargebackColorState,
  ChargebackDocument,
  TimelineEvent,
} from '../../../../services/chargeback/chargeback.types';
import { getStatusState, isNeedsAction } from '../../../../services/chargeback/chargeback.utils';
import { formatDate, formatDateAtTime } from '../../../../shared/utils/date.utils';
import { isImageFile } from '../../../../shared/utils/file.utils';
import { formatMoney } from '../../../../shared/utils/money.utils';
import {
  CARD_NETWORK_LABELS,
  CHARGEBACK_ACTION_LABELS,
  CHARGEBACKS_CONSTANTS,
} from '../../chargebacks.constants';

const copy = CHARGEBACKS_CONSTANTS.CASE.TIMELINE;

export type MarkerTone = ChargebackColorState | 'neutral';

export interface PendingAction {
  readonly action: ChargebackAction;
  readonly label: string;
}

export interface PendingRow {
  readonly title: string;
  readonly detail?: string;
  readonly tone: ChargebackColorState;
  readonly action?: PendingAction;
}

export interface TimelineDocument {
  readonly document: ChargebackDocument;
  readonly icon: 'file-image' | 'file-text';
  readonly label: string;
  readonly canOpen: boolean;
}

export interface TimelineRow {
  readonly id: string;
  readonly title: string;
  readonly meta: string;
  readonly description?: string;
  readonly money?: string;
  readonly documents: readonly TimelineDocument[];
  readonly date: string;
  readonly occurredAt: string;
  readonly tone: MarkerTone;
}

export function getPendingRow(chargeback: ChargebackCase): PendingRow | undefined {
  const content = getPendingContent(chargeback);
  if (!content) {
    return undefined;
  }
  return {
    ...content,
    tone: getStatusState(chargeback.status),
    action: getPendingAction(chargeback),
  };
}

export function getTimelineRows(chargeback: ChargebackCase): readonly TimelineRow[] {
  const state = getStatusState(chargeback.status);
  const hasPending = getPendingContent(chargeback) !== undefined;
  const lastIndex = chargeback.timeline.length - 1;
  return chargeback.timeline.map((event, index) => ({
    id: event.id,
    title: event.title,
    meta: getEventMeta(chargeback, event),
    description: event.description,
    money: getEventMoney(chargeback, event),
    documents: getEventDocuments(chargeback, event),
    date: formatDateAtTime(event.occurredAt),
    occurredAt: event.occurredAt,
    tone: !hasPending && index === lastIndex ? state : 'neutral',
  }));
}

function getPendingContent(
  chargeback: ChargebackCase,
): Pick<PendingRow, 'title' | 'detail'> | undefined {
  const date = chargeback.replyByDate ? formatDate(chargeback.replyByDate) : undefined;
  switch (chargeback.status) {
    case 'action-required':
    case 'evidence-required':
    case 'pre-arbitration-response-required':
      return {
        title: copy.PENDING.RESPONSE_NEEDED,
        detail: date ? copy.PENDING.RESPOND_BY(date) : undefined,
      };
    case 'returned-by-worldpay':
      return {
        title: copy.PENDING.RETURNED,
        detail: date ? copy.PENDING.RESUBMIT_BY(date) : undefined,
      };
    case 'decision-needed':
      return {
        title: copy.PENDING.DECISION_NEEDED,
        detail: date ? copy.PENDING.DECIDE_BY(date) : undefined,
      };
    case 'response-submitted':
      return { title: copy.PENDING.SENT_TO_BANK };
    case 'under-review':
      return { title: copy.PENDING.UNDER_REVIEW };
    case 'pre-arbitration':
      return { title: copy.PENDING.HANDLING_CHALLENGE };
    case 'arbitration':
      return { title: copy.PENDING.WAITING_FOR_NETWORK };
    default:
      return undefined;
  }
}

function getPendingAction(chargeback: ChargebackCase): PendingAction | undefined {
  const action = chargeback.allowedActions[0];
  if (!action || !isNeedsAction(chargeback.status)) {
    return undefined;
  }
  return { action, label: CHARGEBACK_ACTION_LABELS[action] };
}

function getEventMeta(chargeback: ChargebackCase, event: TimelineEvent): string {
  const actor =
    event.actor === 'card-network'
      ? CARD_NETWORK_LABELS[chargeback.network]
      : copy.ACTORS[event.actor];
  return event.worldpayTerm ? `${actor} · ${event.worldpayTerm}` : actor;
}

function getEventMoney(chargeback: ChargebackCase, event: TimelineEvent): string | undefined {
  if (event.amountChange === undefined) {
    return undefined;
  }
  const amount = formatMoney(Math.abs(event.amountChange), chargeback.currency);
  return event.amountChange < 0 ? copy.MONEY.DEBITED(amount) : copy.MONEY.CREDITED(amount);
}

function getEventDocuments(
  chargeback: ChargebackCase,
  event: TimelineEvent,
): readonly TimelineDocument[] {
  const documents: TimelineDocument[] = [];
  for (const id of event.documentIds ?? []) {
    const document = chargeback.documents.find((item) => item.id === id);
    if (document) {
      documents.push({
        document,
        icon: isImageFile(document.name) ? 'file-image' : 'file-text',
        label: copy.PREVIEW(document.name),
        canOpen: document.securityStatus === 'clean',
      });
    }
  }
  return documents;
}
