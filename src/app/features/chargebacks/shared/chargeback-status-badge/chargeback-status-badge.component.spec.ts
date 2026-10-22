import { TestBed } from '@angular/core/testing';

import { ChargebackStatus } from '../../../../services/chargeback/chargeback.types';
import { getTestProviders } from '../../../../testing/providers';
import { ChargebackStatusBadgeComponent } from './chargeback-status-badge.component';

describe('ChargebackStatusBadgeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChargebackStatusBadgeComponent],
      providers: getTestProviders(),
    }).compileComponents();
  });

  function render(status: ChargebackStatus): HTMLElement {
    const fixture = TestBed.createComponent(ChargebackStatusBadgeComponent);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the status label with its color state', () => {
    const element = render('returned-by-worldpay');
    const badge = element.querySelector('span');

    expect(element.textContent?.trim()).toBe('Returned by Worldpay');
    expect(element.dataset['state']).toBe('needs-action');
    expect(badge?.classList.contains('bg-needs-action-soft')).toBe(true);
    expect(badge?.classList.contains('border-needs-action-line')).toBe(true);
  });

  it('uses the lost colors for an accepted chargeback', () => {
    const element = render('accepted');
    const badge = element.querySelector('span');

    expect(element.dataset['state']).toBe('lost');
    expect(badge?.classList.contains('bg-lost-soft')).toBe(true);
    expect(badge?.classList.contains('border-lost-line')).toBe(true);
  });
});
