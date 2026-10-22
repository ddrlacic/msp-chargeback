import { TestBed } from '@angular/core/testing';

import { getTestProviders } from '../../testing/providers';
import { ChargebacksComponent } from './chargebacks.component';

describe('ChargebacksComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChargebacksComponent],
      providers: getTestProviders(),
    }).compileComponents();
  });

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(ChargebacksComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the page title and description', () => {
    const element = render();

    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Chargebacks');
    expect(element.querySelector('header p')?.textContent?.trim()).toBe(
      'Review chargebacks and respond before the due date',
    );
  });

  it('links every case to its case page', () => {
    const links = render().querySelectorAll('ul a');

    expect(links.length).toBe(17);
    expect(links[0].getAttribute('href')).toBe('/chargebacks/CB-261018');
  });

  it('shows due dates only for cases that need action', () => {
    expect(render().querySelectorAll('app-chargeback-due-date').length).toBe(7);
  });
});
