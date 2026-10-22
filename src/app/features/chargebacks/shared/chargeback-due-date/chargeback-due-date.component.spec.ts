import { TestBed } from '@angular/core/testing';

import { getTestProviders } from '../../../../testing/providers';
import { ChargebackDueDateComponent } from './chargeback-due-date.component';

describe('ChargebackDueDateComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChargebackDueDateComponent],
      providers: getTestProviders(),
    }).compileComponents();
  });

  function render(date: string, windowDays?: number): HTMLElement {
    const fixture = TestBed.createComponent(ChargebackDueDateComponent);
    fixture.componentRef.setInput('date', date);
    fixture.componentRef.setInput('windowDays', windowDays);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the date and days left', () => {
    const element = render('2026-11-15', 30);

    expect(element.querySelector('time')?.getAttribute('datetime')).toBe('2026-11-15');
    expect(element.textContent?.replace(/\s+/g, ' ').trim()).toBe('Nov 15, 2026 24 days left');
    expect(element.dataset['tone']).toBe('default');
  });

  it('highlights a due date that is soon', () => {
    const element = render('2026-10-25', 20);

    expect(element.dataset['tone']).toBe('soon');
    expect(element.querySelector('lucide-icon')?.getAttribute('name')).toBe('clock');
  });
});
