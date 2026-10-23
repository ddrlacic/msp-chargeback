import {
  ChargebackAction,
  ChargebackCase,
  ChargebackColorState,
  ChargebackStatus,
} from '../../../services/chargeback/chargeback.types';
import {
  getAmountAtStake,
  getArbitrationFeeSchedule,
  getArbitrationFeeTotal,
  getNetAmount,
  getOutstandingAmount,
  getResponseWindowDays,
  getStatusState,
  isNeedsAction,
  roundMoney,
} from '../../../services/chargeback/chargeback.utils';
import { formatDate, formatDateAtTime } from '../../../shared/utils/date.utils';
import {
  formatMoney,
  formatSignedMoney,
  formatWholeMoney,
} from '../../../shared/utils/money.utils';
import {
  CARD_NETWORK_LABELS,
  CARD_NETWORK_LOGOS,
  CHARGEBACK_ACTION_LABELS,
  CHARGEBACK_STATUS_COPY,
  CHARGEBACKS_CONSTANTS,
} from '../chargebacks.constants';

const copy = CHARGEBACKS_CONSTANTS.CASE;
const dialogCopy = CHARGEBACKS_CONSTANTS.ARBITRATION_DIALOG;

const OPTION_STATUSES: readonly ChargebackStatus[] = [
  'action-required',
  'pre-arbitration-response-required',
  'arbitration-decision-needed',
];

const BANK_NOTE_STATUSES: readonly ChargebackStatus[] = [
  'pre-arbitration-response-required',
  'arbitration-decision-needed',
];

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

export interface CaseBannerNote {
  readonly title: string;
  readonly text: string;
}

export interface CaseBanner {
  readonly state: ChargebackColorState;
  readonly title: string;
  readonly detail?: string;
  readonly deadline?: string;
  readonly note?: CaseBannerNote;
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

export interface CaseDeadline {
  readonly title: string;
  readonly date: string;
  readonly windowDays?: number;
}

export interface ArbitrationOutcome {
  readonly key: 'win' | 'lose';
  readonly label: string;
  readonly value: string;
  readonly detail?: string;
}

export interface ArbitrationDialogView {
  readonly description: string;
  readonly outcomes: readonly ArbitrationOutcome[];
}

export interface MoneyRow {
  readonly key: 'disputed' | 'challenged' | 'debited' | 'credited' | 'fees' | 'net';
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
  readonly logo?: string;
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
  const withOptions = OPTION_STATUSES.includes(chargeback.status) && !chargeback.draft;
  return {
    state: getStatusState(chargeback.status),
    title: CHARGEBACK_STATUS_COPY[chargeback.status].message.replace(
      '{amount}',
      formatMoney(getMessageAmount(chargeback), chargeback.currency),
    ),
    detail: getBannerDetail(chargeback),
    deadline: getDeadline(chargeback),
    note: getBannerNote(chargeback),
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

export function getCaseDeadline(chargeback: ChargebackCase): CaseDeadline | undefined {
  if (!chargeback.replyByDate || !isNeedsAction(chargeback.status)) {
    return undefined;
  }
  return {
    title:
      chargeback.status === 'arbitration-decision-needed'
        ? copy.DEADLINE.DECIDE_BY
        : copy.DEADLINE.RESPOND_BY,
    date: chargeback.replyByDate,
    windowDays: getResponseWindowDays(chargeback),
  };
}

export function getArbitrationDialog(chargeback: ChargebackCase): ArbitrationDialogView {
  const atStake = formatMoney(getAmountAtStake(chargeback), chargeback.currency);
  return {
    description: dialogCopy.DESCRIPTION(CARD_NETWORK_LABELS[chargeback.network]),
    outcomes: [
      { key: 'win', label: dialogCopy.WIN, value: dialogCopy.WIN_VALUE(atStake) },
      getLoseOutcome(chargeback, atStake),
    ],
  };
}

export function getMoneySummary(chargeback: ChargebackCase): MoneySummaryView {
  const currency = chargeback.currency;
  const open = isOpen(chargeback.status);
  const challenged = chargeback.challengedAmount;
  const net = getNetAmount(chargeback);
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
  );
  if (chargeback.arbitrationFees) {
    rows.push({
      key: 'fees',
      label: copy.MONEY.FEES,
      value: formatSignedMoney(-chargeback.arbitrationFees, currency),
    });
  }
  rows.push({
    key: 'net',
    label: open ? copy.MONEY.NET_SO_FAR : copy.MONEY.NET,
    value: formatSignedMoney(net, currency),
  });
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
    {
      key: 'card',
      label: labels.CARD,
      value: labels.CARD_NUMBER(chargeback.cardLastFour),
      valueLabel: header.cardLabel,
      logo: CARD_NETWORK_LOGOS[chargeback.network],
    },
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
        CARD_NETWORK_LABELS[chargeback.network],
        getFeesPhrase(chargeback),
      );
    case 'respond-pre-arbitration':
      return copy.OPTIONS.PRE_ARBITRATION_DESCRIPTION;
    default:
      return copy.OPTIONS.CHALLENGE_DESCRIPTION;
  }
}

function getFeesPhrase(chargeback: ChargebackCase): string {
  const schedule = getArbitrationFeeSchedule(chargeback.network);
  if (!schedule) {
    return copy.OPTIONS.FEES;
  }
  const total = formatWholeMoney(getArbitrationFeeTotal(schedule), chargeback.currency);
  return schedule.upTo ? copy.OPTIONS.FEES_UP_TO(total) : copy.OPTIONS.FEES_FROM(total);
}

function getLoseOutcome(chargeback: ChargebackCase, atStake: string): ArbitrationOutcome {
  const schedule = getArbitrationFeeSchedule(chargeback.network);
  if (!schedule) {
    return {
      key: 'lose',
      label: dialogCopy.LOSE,
      value: dialogCopy.LOSE_VALUE_UNKNOWN_FEES(atStake),
    };
  }
  const whole = (amount: number) => formatWholeMoney(amount, chargeback.currency);
  const total = whole(getArbitrationFeeTotal(schedule));
  return {
    key: 'lose',
    label: dialogCopy.LOSE,
    value: dialogCopy.LOSE_VALUE(atStake, schedule.upTo ? dialogCopy.FEES_UP_TO(total) : total),
    detail:
      schedule.perTechnicalError === undefined
        ? dialogCopy.FEE_BREAKDOWN(whole(schedule.filing), whole(schedule.review))
        : dialogCopy.FEE_BREAKDOWN_WITH_ERRORS(
            whole(schedule.filing),
            whole(schedule.review),
            whole(schedule.perTechnicalError),
          ),
  };
}

function getReturnedAmount(chargeback: ChargebackCase): number {
  return Math.max(0, roundMoney(chargeback.chargebackAmount - getOutstandingAmount(chargeback)));
}

function getMessageAmount(chargeback: ChargebackCase): number {
  return chargeback.status === 'won'
    ? getReturnedAmount(chargeback)
    : getOutstandingAmount(chargeback);
}

function getBannerNote(chargeback: ChargebackCase): CaseBannerNote | undefined {
  if (chargeback.status === 'returned-by-worldpay' && chargeback.worldpayNote) {
    return { title: copy.BANNER.WORLDPAY_NOTE, text: chargeback.worldpayNote };
  }
  if (BANK_NOTE_STATUSES.includes(chargeback.status) && chargeback.issuerNote) {
    return { title: copy.BANNER.BANK_NOTE, text: chargeback.issuerNote };
  }
  return undefined;
}

function getBannerDetail(chargeback: ChargebackCase): string | undefined {
  const currency = chargeback.currency;
  switch (chargeback.status) {
    case 'partially-won':
      return copy.BANNER.PARTIALLY_WON(
        formatMoney(getReturnedAmount(chargeback), currency),
        formatMoney(chargeback.challengedAmount ?? chargeback.chargebackAmount, currency),
      );
    case 'arbitration':
      return copy.BANNER.ARBITRATION_FEES(getFeesPhrase(chargeback));
    case 'lost':
      return chargeback.arbitrationFees
        ? copy.BANNER.LOST_FEES(formatMoney(chargeback.arbitrationFees, currency))
        : undefined;
    default:
      return undefined;
  }
}

function getDeadline(chargeback: ChargebackCase): string | undefined {
  if (!chargeback.replyByDate || !isNeedsAction(chargeback.status)) {
    return undefined;
  }
  const date = formatDate(chargeback.replyByDate);
  return chargeback.status === 'arbitration-decision-needed'
    ? copy.BANNER.DECISION_DEADLINE(date)
    : copy.BANNER.DEADLINE(date);
}

function getDraftSummary(chargeback: ChargebackCase): CaseDraftSummary | undefined {
  const draft = chargeback.draft;
  if (!draft || !isNeedsAction(chargeback.status)) {
    return undefined;
  }
  return {
    saved: copy.BANNER.DRAFT_SAVED(formatDateAtTime(draft.savedAt)),
    content: copy.BANNER.DRAFT_CONTENT(
      formatMoney(
        draft.challengedAmount ?? chargeback.challengedAmount ?? chargeback.chargebackAmount,
        chargeback.currency,
      ),
      draft.documentIds.length,
    ),
  };
}

function isOpen(status: ChargebackStatus): boolean {
  const state = getStatusState(status);
  return state === 'needs-action' || state === 'in-review';
}
