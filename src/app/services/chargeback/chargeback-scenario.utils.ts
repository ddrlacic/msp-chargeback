import { addDays, atTime, parseIsoDate, toIsoDate } from '../../shared/utils/date.utils';
import {
  createReceivedEvent,
  FIXTURE_BRAND,
  ISSUER_NOTES,
  WORLDPAY_RETURN_NOTE,
} from './chargeback.fixtures';
import {
  CardNetwork,
  ChargebackCase,
  ChargebackCycle,
  ChargebackDocument,
  ChargebackStatus,
  TimelineEvent,
} from './chargeback.types';
import {
  getAllowedActions,
  getAmountAtStake,
  getResponseWindowDays,
  isNeedsAction,
  roundMoney,
} from './chargeback.utils';

export const SCENARIO_EVENTS = [
  'worldpay-forwards-response',
  'worldpay-returns-response',
  'issuer-accepts',
  'issuer-withdraws-dispute',
  'pre-arbitration-filed',
  'pre-arbitration-handled',
  'issuer-declines-pre-arbitration',
  'issuer-wins-pre-arbitration',
  'arbitration-won',
  'arbitration-split',
  'arbitration-lost',
  'deadline-passes',
] as const;

export type ScenarioEvent = (typeof SCENARIO_EVENTS)[number];

export type RulingScenarioEvent = 'arbitration-won' | 'arbitration-split' | 'arbitration-lost';

export type TransitionScenarioEvent = Exclude<ScenarioEvent, RulingScenarioEvent>;

export type ScenarioStep =
  | ScenarioEvent
  | 'save-draft'
  | 'submit-response'
  | 'submit-pre-arbitration-response'
  | 'accept'
  | 'request-arbitration';

export type ScenarioDocumentType = 'transaction-receipt' | 'invoice' | 'delivery-proof';

export interface ScenarioTransition {
  readonly status: ChargebackStatus;
  readonly changes: Partial<ChargebackCase>;
  readonly event: Omit<TimelineEvent, 'id' | 'occurredAt' | 'cycle'>;
}

export const SCENARIO_EVENT_RESULTS: Record<ScenarioEvent, ChargebackStatus> = {
  'worldpay-forwards-response': 'under-review',
  'worldpay-returns-response': 'returned-by-worldpay',
  'issuer-accepts': 'won',
  'issuer-withdraws-dispute': 'dispute-withdrawn',
  'pre-arbitration-filed': 'pre-arbitration-response-required',
  'pre-arbitration-handled': 'pre-arbitration',
  'issuer-declines-pre-arbitration': 'arbitration-decision-needed',
  'issuer-wins-pre-arbitration': 'lost',
  'arbitration-won': 'won',
  'arbitration-split': 'partially-won',
  'arbitration-lost': 'lost',
  'deadline-passes': 'deadline-missed',
};

const SUBMIT_PATH: readonly ScenarioStep[] = ['submit-response', 'worldpay-forwards-response'];

const PRE_ARBITRATION_PATH: readonly ScenarioStep[] = [...SUBMIT_PATH, 'pre-arbitration-filed'];

const DECISION_PATH: readonly ScenarioStep[] = [
  ...PRE_ARBITRATION_PATH,
  'submit-pre-arbitration-response',
  'issuer-declines-pre-arbitration',
];

const ARBITRATION_PATH: readonly ScenarioStep[] = [...DECISION_PATH, 'request-arbitration'];

export const SCENARIO_SCRIPTS: Record<ChargebackStatus, readonly ScenarioStep[]> = {
  'action-required': [],
  'draft-not-submitted': ['save-draft'],
  'returned-by-worldpay': ['submit-response', 'worldpay-returns-response'],
  'response-submitted': ['submit-response'],
  'under-review': SUBMIT_PATH,
  'pre-arbitration': [...SUBMIT_PATH, 'pre-arbitration-handled'],
  'pre-arbitration-response-required': PRE_ARBITRATION_PATH,
  'arbitration-decision-needed': DECISION_PATH,
  arbitration: ARBITRATION_PATH,
  won: [...SUBMIT_PATH, 'issuer-accepts'],
  'partially-won': [...ARBITRATION_PATH, 'arbitration-split'],
  'dispute-withdrawn': [...SUBMIT_PATH, 'issuer-withdraws-dispute'],
  lost: [...ARBITRATION_PATH, 'arbitration-lost'],
  accepted: ['accept'],
  'deadline-missed': ['deadline-passes'],
};

const PRE_ARBITRATION_OUTCOMES: readonly ScenarioEvent[] = [
  'issuer-accepts',
  'issuer-declines-pre-arbitration',
  'issuer-wins-pre-arbitration',
];

const DOCUMENT_SAMPLES: Record<
  ScenarioDocumentType,
  { readonly name: (orderNumber: string) => string; readonly sizeBytes: number }
> = {
  'transaction-receipt': { name: (order) => `receipt-${order}.pdf`, sizeBytes: 148_480 },
  invoice: { name: (order) => `invoice-${order}.pdf`, sizeBytes: 125_952 },
  'delivery-proof': { name: () => 'delivery-confirmation.pdf', sizeBytes: 121_856 },
};

const DEFAULT_REPLY_DAYS = 7;
const EVENT_SPACING_DAYS = 3;
const SENT_BEFORE_EVENT_MS = 5 * 60_000;
const TRANSACTION_TO_CHARGEBACK_DAYS = 14;

export function isRulingEvent(event: ScenarioEvent): event is RulingScenarioEvent {
  return (
    event === 'arbitration-won' || event === 'arbitration-split' || event === 'arbitration-lost'
  );
}

export function getScenarioEvents(
  chargeback: Pick<ChargebackCase, 'status' | 'cycle'>,
): readonly ScenarioEvent[] {
  switch (chargeback.status) {
    case 'response-submitted':
      return ['worldpay-forwards-response', 'worldpay-returns-response'];
    case 'under-review':
      return chargeback.cycle === 'pre-arbitration'
        ? PRE_ARBITRATION_OUTCOMES
        : [
            'issuer-accepts',
            'issuer-withdraws-dispute',
            'pre-arbitration-filed',
            'pre-arbitration-handled',
          ];
    case 'pre-arbitration':
      return PRE_ARBITRATION_OUTCOMES;
    case 'arbitration':
      return ['arbitration-won', 'arbitration-split', 'arbitration-lost'];
    default:
      return isNeedsAction(chargeback.status) ? ['deadline-passes'] : [];
  }
}

export function getScenarioReplyBy(
  status: ChargebackStatus,
  cycle: ChargebackCycle,
  network: CardNetwork,
  now: Date,
): string {
  const window = getResponseWindowDays({ status, cycle, network });
  return toIsoDate(addDays(now, window ? Math.ceil(window / 2) : DEFAULT_REPLY_DAYS));
}

export function createScenarioBase(chargeback: ChargebackCase, now: Date): ChargebackCase {
  return {
    ...chargeback,
    status: 'action-required',
    cycle: 'first-chargeback',
    allowedActions: getAllowedActions('action-required'),
    replyByDate: getScenarioReplyBy('action-required', 'first-chargeback', chargeback.network, now),
    challengedAmount: undefined,
    challengeReason: undefined,
    challengeNote: undefined,
    amountDebited: chargeback.chargebackAmount,
    amountCredited: 0,
    arbitrationFees: undefined,
    documents: [],
    timeline: [
      {
        id: `${chargeback.caseId}-event-1`,
        ...createReceivedEvent(now.toISOString(), chargeback.chargebackAmount, chargeback.network),
      },
    ],
    draft: undefined,
    worldpayNote: undefined,
    issuerNote: undefined,
  };
}

export function createScenarioDocuments(
  chargeback: ChargebackCase,
  types: readonly ScenarioDocumentType[],
  now: Date,
): readonly ChargebackDocument[] {
  const orderNumber = chargeback.orderReference.replace(/^ORD-/, '');
  return types.map((type, index) => ({
    id: `${chargeback.caseId}-doc-${chargeback.documents.length + index + 1}`,
    name: DOCUMENT_SAMPLES[type].name(orderNumber),
    type,
    sizeBytes: DOCUMENT_SAMPLES[type].sizeBytes,
    securityStatus: 'clean',
    uploadedBy: FIXTURE_BRAND.userName,
    createdDateTime: now.toISOString(),
  }));
}

export function spreadScenarioTimeline(chargeback: ChargebackCase, now: Date): ChargebackCase {
  const last = chargeback.timeline.length - 1;
  const timeline = chargeback.timeline.map((event, index) => ({
    ...event,
    occurredAt: atTime(
      addDays(now, -((last - index) * EVENT_SPACING_DAYS + 1)),
      9 + (index % 8),
      12 + index,
    ),
  }));
  const sentAt = new Map<string, string>();
  for (const event of timeline) {
    const sent = new Date(Date.parse(event.occurredAt) - SENT_BEFORE_EVENT_MS).toISOString();
    event.documentIds?.forEach((id) => sentAt.set(id, sent));
  }
  const chargebackDate = toIsoDate(new Date(timeline[0].occurredAt));
  return {
    ...chargeback,
    chargebackDate,
    transactionDate: toIsoDate(
      addDays(parseIsoDate(chargebackDate), -TRANSACTION_TO_CHARGEBACK_DAYS),
    ),
    timeline,
    documents: chargeback.documents.map((document) => ({
      ...document,
      createdDateTime: sentAt.get(document.id) ?? document.createdDateTime,
    })),
  };
}

export function getScenarioTransition(
  chargeback: ChargebackCase,
  event: TransitionScenarioEvent,
  now: Date,
): ScenarioTransition {
  const challenged = chargeback.challengedAmount ?? chargeback.chargebackAmount;
  switch (event) {
    case 'worldpay-forwards-response':
      return {
        status: 'under-review',
        changes: {},
        event: {
          actor: 'worldpay',
          title: 'Worldpay sent your response to the cardholder’s bank',
          worldpayTerm: 'Representment',
        },
      };
    case 'worldpay-returns-response':
      return {
        status: 'returned-by-worldpay',
        changes: {
          replyByDate: getScenarioReplyBy(
            'returned-by-worldpay',
            chargeback.cycle,
            chargeback.network,
            now,
          ),
          worldpayNote: WORLDPAY_RETURN_NOTE,
        },
        event: {
          actor: 'worldpay',
          title: 'Worldpay returned your response',
          worldpayTerm: 'Request declined',
          description: WORLDPAY_RETURN_NOTE,
        },
      };
    case 'issuer-accepts': {
      const credit = getAmountAtStake(chargeback);
      return {
        status: 'won',
        changes: {
          replyByDate: undefined,
          amountCredited: roundMoney(chargeback.amountCredited + credit),
        },
        event: {
          actor: 'cardholder-bank',
          title: 'Resolved in your favor',
          worldpayTerm:
            chargeback.cycle === 'pre-arbitration'
              ? 'Successful pre-arbitration'
              : 'Chargeback reversal',
          amountChange: credit || undefined,
        },
      };
    }
    case 'issuer-withdraws-dispute': {
      const credit = getAmountAtStake(chargeback);
      return {
        status: 'dispute-withdrawn',
        changes: {
          replyByDate: undefined,
          amountCredited: roundMoney(chargeback.amountCredited + credit),
        },
        event: {
          actor: 'cardholder-bank',
          title: 'The cardholder’s bank withdrew the dispute',
          worldpayTerm: 'Issuer recalled',
          amountChange: credit || undefined,
        },
      };
    }
    case 'pre-arbitration-filed':
      return {
        status: 'pre-arbitration-response-required',
        changes: {
          cycle: 'pre-arbitration',
          replyByDate: getScenarioReplyBy(
            'pre-arbitration-response-required',
            'pre-arbitration',
            chargeback.network,
            now,
          ),
          issuerNote: ISSUER_NOTES.coldAndMissing,
        },
        event: {
          actor: 'cardholder-bank',
          title: 'The cardholder’s bank challenged your response',
          worldpayTerm: 'Pre-arbitration',
          description: ISSUER_NOTES.coldAndMissing,
        },
      };
    case 'pre-arbitration-handled':
      return {
        status: 'pre-arbitration',
        changes: { cycle: 'pre-arbitration', replyByDate: undefined },
        event: {
          actor: 'cardholder-bank',
          title: 'The cardholder’s bank challenged your response',
          worldpayTerm: 'Pre-arbitration',
        },
      };
    case 'issuer-declines-pre-arbitration': {
      const debitedAgain = chargeback.network === 'mastercard';
      const note = debitedAgain ? ISSUER_NOTES.notAsPictured : ISSUER_NOTES.wrongAddress;
      return {
        status: 'arbitration-decision-needed',
        changes: {
          replyByDate: getScenarioReplyBy(
            'arbitration-decision-needed',
            'pre-arbitration',
            chargeback.network,
            now,
          ),
          issuerNote: note,
          amountDebited: debitedAgain
            ? roundMoney(chargeback.amountDebited + challenged)
            : chargeback.amountDebited,
        },
        event: debitedAgain
          ? {
              actor: 'cardholder-bank',
              title: 'The cardholder’s bank challenged your response',
              worldpayTerm: 'Arbitration chargeback',
              description: note,
              amountChange: -challenged,
            }
          : {
              actor: 'cardholder-bank',
              title: 'The cardholder’s bank declined your pre-arbitration response',
              worldpayTerm: 'Issuer declined pre-arbitration',
              description: note,
            },
      };
    }
    case 'issuer-wins-pre-arbitration':
      return {
        status: 'lost',
        changes: {
          replyByDate: undefined,
          amountDebited: roundMoney(chargeback.amountDebited + challenged),
        },
        event: {
          actor: 'cardholder-bank',
          title: 'Resolved in the cardholder’s favor',
          worldpayTerm: 'Unsuccessful pre-arbitration',
          amountChange: -challenged,
        },
      };
    case 'deadline-passes':
      return {
        status: 'deadline-missed',
        changes: { replyByDate: undefined, draft: undefined },
        event: {
          actor: 'worldpay',
          title: 'No response was sent by the due date',
          worldpayTerm: 'Merchant assumed',
        },
      };
  }
}
