import { TEST_TODAY } from '../../../../testing/providers';
import {
  DEFAULT_DUE_SOON_DAYS,
  getDueDateInfo,
  getDueSoonThreshold,
} from './chargeback-due-date.utils';

describe('due date utils', () => {
  it('sets the due soon threshold to a quarter of the network window, at least 2 days', () => {
    expect(getDueSoonThreshold(20)).toBe(5);
    expect(getDueSoonThreshold(30)).toBe(8);
    expect(getDueSoonThreshold(7)).toBe(2);
    expect(getDueSoonThreshold(undefined)).toBe(DEFAULT_DUE_SOON_DAYS);
  });

  it('shows days left without a highlight when the due date is far away', () => {
    expect(getDueDateInfo('2026-11-15', TEST_TODAY, 30)).toEqual({
      daysLeft: 24,
      tone: 'default',
      dateLabel: 'Nov 15, 2026',
      remainingLabel: '24 days left',
    });
  });

  it('highlights a due date inside the due soon threshold', () => {
    expect(getDueDateInfo('2026-10-25', TEST_TODAY, 20).tone).toBe('soon');
    expect(getDueDateInfo('2026-10-23', TEST_TODAY, 7).remainingLabel).toBe('1 day left');
  });

  it('says due today on the due date', () => {
    expect(getDueDateInfo('2026-10-22', TEST_TODAY, 20)).toEqual({
      daysLeft: 0,
      tone: 'soon',
      dateLabel: 'Oct 22, 2026',
      remainingLabel: 'Due today',
    });
  });

  it('marks a past due date as overdue', () => {
    expect(getDueDateInfo('2026-10-21', TEST_TODAY, 20).remainingLabel).toBe('1 day overdue');
    expect(getDueDateInfo('2026-10-19', TEST_TODAY, 20)).toEqual({
      daysLeft: -3,
      tone: 'overdue',
      dateLabel: 'Oct 19, 2026',
      remainingLabel: '3 days overdue',
    });
  });
});
