import {
  CardNetwork,
  ChargebackAction,
  ChargebackCase,
  ChargebackColorState,
  ChargebackMoneySummary,
  ChargebackStatus,
} from './chargeback.types';

const STATUS_STATES: Record<ChargebackStatus, ChargebackColorState> = {
  'action-required': 'needs-action',
  'evidence-required': 'needs-action',
  'returned-by-worldpay': 'needs-action',
  'response-submitted': 'in-review',
  'under-review': 'in-review',
  'pre-arbitration': 'in-review',
  'pre-arbitration-response-required': 'needs-action',
  'decision-needed': 'needs-action',
  arbitration: 'in-review',
  won: 'won',
  'partially-won': 'won',
  'dispute-withdrawn': 'won',
  lost: 'lost',
  accepted: 'lost',
  'deadline-missed': 'lost',
};

const STATUS_ALLOWED_ACTIONS: Record<ChargebackStatus, readonly ChargebackAction[]> = {
  'action-required': ['challenge', 'accept'],
  'evidence-required': ['continue-challenge', 'accept'],
  'returned-by-worldpay': ['resubmit', 'accept'],
  'response-submitted': [],
  'under-review': [],
  'pre-arbitration': [],
  'pre-arbitration-response-required': ['respond-pre-arbitration', 'accept'],
  'decision-needed': ['request-arbitration', 'accept'],
  arbitration: [],
  won: [],
  'partially-won': [],
  'dispute-withdrawn': [],
  lost: [],
  accepted: [],
  'deadline-missed': [],
};

type ResponseStage = 'first-chargeback' | 'pre-arbitration' | 'arbitration-request';

const RESPONSE_WINDOW_DAYS: Record<ResponseStage, Partial<Record<CardNetwork, number>>> = {
  'first-chargeback': { visa: 20, mastercard: 30, discover: 35, amex: 7 },
  'pre-arbitration': { visa: 20, discover: 10 },
  'arbitration-request': { visa: 7, mastercard: 35 },
};

export function getStatusState(status: ChargebackStatus): ChargebackColorState {
  return STATUS_STATES[status];
}

export function isNeedsAction(status: ChargebackStatus): boolean {
  return STATUS_STATES[status] === 'needs-action';
}

export function getAllowedActions(status: ChargebackStatus): readonly ChargebackAction[] {
  return STATUS_ALLOWED_ACTIONS[status];
}

export function getResponseWindowDays(
  chargeback: Pick<ChargebackCase, 'status' | 'cycle' | 'network'>,
): number | undefined {
  const stage = getResponseStage(chargeback);
  return stage ? RESPONSE_WINDOW_DAYS[stage][chargeback.network] : undefined;
}

export function getMoneySummary(chargeback: ChargebackCase): ChargebackMoneySummary {
  return {
    currency: chargeback.currency,
    chargebackAmount: chargeback.chargebackAmount,
    challengedAmount: chargeback.challengedAmount ?? chargeback.chargebackAmount,
    amountDebited: chargeback.amountDebited,
    amountCredited: chargeback.amountCredited,
    netAmount: roundMoney(chargeback.amountCredited - chargeback.amountDebited),
  };
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function getResponseStage(
  chargeback: Pick<ChargebackCase, 'status' | 'cycle'>,
): ResponseStage | undefined {
  if (chargeback.status === 'decision-needed') {
    return 'arbitration-request';
  }
  if (!isNeedsAction(chargeback.status)) {
    return undefined;
  }
  return chargeback.cycle === 'first-chargeback' ? 'first-chargeback' : 'pre-arbitration';
}
