import { TestBed } from '@angular/core/testing';

import { getTestProviders } from '../../../testing/providers';
import { ChargebackCaseComponent } from './chargeback-case.component';

describe('ChargebackCaseComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChargebackCaseComponent],
      providers: getTestProviders(),
    }).compileComponents();
  });

  function render(caseId: string): HTMLElement {
    const fixture = TestBed.createComponent(ChargebackCaseComponent);
    fixture.componentRef.setInput('caseId', caseId);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the case with its status and due date', () => {
    const element = render('CB-261018');

    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Case CB-261018');
    expect(element.querySelector('app-chargeback-status-badge')?.textContent?.trim()).toBe(
      'Action required',
    );
    expect(element.querySelector('app-chargeback-due-date')?.getAttribute('data-tone')).toBe(
      'soon',
    );
  });

  it('hides the due date when the case does not need action', () => {
    expect(render('CB-260655').querySelector('app-chargeback-due-date')).toBe(null);
  });

  it('shows a not found state for an unknown case', () => {
    const element = render('CB-000000');

    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Case not found');
    expect(element.querySelector('section > div:last-child a')?.getAttribute('href')).toBe(
      '/chargebacks',
    );
  });
});
