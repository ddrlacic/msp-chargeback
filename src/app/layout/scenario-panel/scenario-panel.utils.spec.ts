import { getCaseIdFromUrl, isRespondUrl } from './scenario-panel.utils';

describe('scenario panel utils', () => {
  it('reads the case ID from a case or respond page', () => {
    expect(getCaseIdFromUrl('/chargebacks/CB-261018')).toBe('CB-261018');
    expect(getCaseIdFromUrl('/chargebacks/CB-261018/respond')).toBe('CB-261018');
    expect(getCaseIdFromUrl('/chargebacks/CB-261018?tab=timeline')).toBe('CB-261018');
  });

  it('finds no case on other pages', () => {
    expect(getCaseIdFromUrl('/chargebacks')).toBe(undefined);
    expect(getCaseIdFromUrl('/chargebacks?tab=won')).toBe(undefined);
    expect(getCaseIdFromUrl('/dashboard')).toBe(undefined);
  });

  it('knows when the respond flow is open', () => {
    expect(isRespondUrl('/chargebacks/CB-261018/respond')).toBe(true);
    expect(isRespondUrl('/chargebacks/CB-261018')).toBe(false);
    expect(isRespondUrl('/chargebacks')).toBe(false);
  });
});
