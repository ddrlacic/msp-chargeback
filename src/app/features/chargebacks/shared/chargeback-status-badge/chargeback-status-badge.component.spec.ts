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

    expect(element.textContent?.trim()).toBe('Returned by Worldpay');
    expect(element.dataset['state']).toBe('needs-action');
    expect(element.querySelector('span')?.classList.contains('bg-needs-action-soft')).toBe(true);
  });

  it('uses the lost colors for an accepted chargeback', () => {
    const element = render('accepted');

    expect(element.dataset['state']).toBe('lost');
    expect(element.querySelector('span')?.classList.contains('bg-lost-soft')).toBe(true);
  });
});
