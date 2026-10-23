import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';

import { getTestProviders } from '../../../testing/providers';
import { chargebackRespondGuard, chargebackRespondLeaveGuard } from './chargeback-respond.guard';

describe('chargebackRespondGuard', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: getTestProviders() }));

  function run(caseId: string): boolean | UrlTree {
    const route = { paramMap: new Map([['caseId', caseId]]) } as unknown as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() =>
      chargebackRespondGuard(route, undefined as never),
    ) as boolean | UrlTree;
  }

  it('opens the flow for a case that can be challenged', () => {
    expect(run('CB-261018')).toBe(true);
  });

  it('opens the flow for a returned response', () => {
    expect(run('CB-260954')).toBe(true);
  });

  it('sends the merchant to the case when it cannot be challenged', () => {
    const result = run('CB-260655');

    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/chargebacks/CB-260655');
  });

  it('sends the merchant to the case page for an unknown case', () => {
    const result = run('CB-000000');

    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/chargebacks/CB-000000');
  });

  it('asks the page before the merchant leaves it', () => {
    const page = { confirmLeave: vi.fn(() => false) };

    const result = TestBed.runInInjectionContext(() =>
      chargebackRespondLeaveGuard(page, undefined as never, undefined as never, undefined as never),
    );

    expect(result).toBe(false);
    expect(page.confirmLeave).toHaveBeenCalledOnce();
  });
});
