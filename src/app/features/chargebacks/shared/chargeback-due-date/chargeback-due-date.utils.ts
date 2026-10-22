import {
  differenceInCalendarDays,
  formatDate,
  parseIsoDate,
} from '../../../../shared/utils/date.utils';
import { CHARGEBACKS_CONSTANTS } from '../../chargebacks.constants';

export type DueDateTone = 'default' | 'soon' | 'overdue';

export interface DueDateInfo {
  readonly daysLeft: number;
  readonly tone: DueDateTone;
  readonly dateLabel: string;
  readonly remainingLabel: string;
}

export const DEFAULT_DUE_SOON_DAYS = 3;
const MIN_DUE_SOON_DAYS = 2;
const DUE_SOON_SHARE_OF_WINDOW = 0.25;

export function getDueSoonThreshold(windowDays?: number): number {
  if (!windowDays) {
    return DEFAULT_DUE_SOON_DAYS;
  }
  return Math.max(MIN_DUE_SOON_DAYS, Math.ceil(windowDays * DUE_SOON_SHARE_OF_WINDOW));
}

export function getDueDateInfo(replyByDate: string, today: Date, windowDays?: number): DueDateInfo {
  const daysLeft = differenceInCalendarDays(parseIsoDate(replyByDate), today);
  return {
    daysLeft,
    tone: getTone(daysLeft, windowDays),
    dateLabel: formatDate(replyByDate),
    remainingLabel: getRemainingLabel(daysLeft),
  };
}

function getTone(daysLeft: number, windowDays?: number): DueDateTone {
  if (daysLeft < 0) {
    return 'overdue';
  }
  return daysLeft <= getDueSoonThreshold(windowDays) ? 'soon' : 'default';
}

function getRemainingLabel(daysLeft: number): string {
  const copy = CHARGEBACKS_CONSTANTS.DUE_DATE;
  if (daysLeft === 0) {
    return copy.DUE_TODAY;
  }
  return daysLeft > 0 ? copy.DAYS_LEFT(daysLeft) : copy.OVERDUE(Math.abs(daysLeft));
}
