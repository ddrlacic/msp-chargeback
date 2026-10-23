import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { MockInstance } from 'vitest';

import { ChargebackStore } from '../../services/chargeback/chargeback.store';
import { getTestProviders } from '../../testing/providers';
import { ScenarioPanelComponent } from './scenario-panel.component';

@Component({ template: '' })
class EmptyPageComponent {}

describe('ScenarioPanelComponent', () => {
  let fixture: ComponentFixture<ScenarioPanelComponent>;
  let store: ChargebackStore;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenarioPanelComponent],
      providers: getTestProviders([
        { path: 'chargebacks', component: EmptyPageComponent },
        { path: 'chargebacks/:caseId', component: EmptyPageComponent },
        { path: 'chargebacks/:caseId/respond', component: EmptyPageComponent },
      ]),
    }).compileComponents();
    store = TestBed.inject(ChargebackStore);
    router = TestBed.inject(Router);
  });

  async function render(url: string): Promise<HTMLElement> {
    await router.navigateByUrl(url);
    fixture = TestBed.createComponent(ScenarioPanelComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  function text(element: Element | null | undefined): string {
    return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  function select(element: HTMLElement, label: string): HTMLSelectElement {
    const target = [...element.querySelectorAll('label')].find((item) => text(item) === label);
    const found = element.querySelector<HTMLSelectElement>(`#${target?.getAttribute('for')}`);
    if (!found) {
      throw new Error(`Missing select ${label}`);
    }
    return found;
  }

  function choose(element: HTMLSelectElement, value: string): void {
    element.value = value;
    element.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function eventButtons(element: HTMLElement): string[] {
    return [...element.querySelectorAll('section li button')].map((button) =>
      [...button.querySelectorAll('span')].map((span) => text(span)).join(' - '),
    );
  }

  it('asks for a case on pages that are not about one', async () => {
    const element = await render('/chargebacks');

    expect(text(element.querySelector('[popover] > div > p'))).toBe(
      'Choose a case to change its status or simulate what happens next.',
    );
    expect(element.querySelectorAll('label').length).toBe(1);
    expect(select(element, 'Case').value).toBe('');
  });

  it('lists every case with its location and status', async () => {
    const element = await render('/chargebacks');
    const options = [...select(element, 'Case').options];

    expect(options.length).toBe(21);
    expect(text(options[1])).toBe('CB-261018 · Downtown · Action required');
  });

  it('follows the case on the page', async () => {
    const element = await render('/chargebacks/CB-260815/respond');

    expect(select(element, 'Case').value).toBe('CB-260815');
    expect(select(element, 'Status').value).toBe('pre-arbitration-response-required');
  });

  it('opens the case that is picked', async () => {
    const element = await render('/chargebacks');
    const navigate: MockInstance<Router['navigate']> = vi
      .spyOn(router, 'navigate')
      .mockResolvedValue(true);

    choose(select(element, 'Case'), 'CB-260843');

    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/chargebacks', 'CB-260843']);
  });

  it('lists the statuses in order', async () => {
    const element = await render('/chargebacks/CB-261018');

    expect([...select(element, 'Status').options].map((option) => text(option))).toEqual([
      'Action required',
      'Draft not submitted',
      'Returned by Worldpay',
      'Response submitted',
      'Under review',
      'Pre-arbitration',
      'Pre-arbitration response required',
      'Arbitration decision needed',
      'Arbitration',
      'Won',
      'Partially won',
      'Dispute withdrawn',
      'Lost',
      'Accepted',
      'Deadline missed',
    ]);
  });

  it('moves the case to the status that is picked and says so', async () => {
    const element = await render('/chargebacks/CB-261018');

    choose(select(element, 'Status'), 'under-review');

    expect(store.getById('CB-261018')?.status).toBe('under-review');
    expect(select(element, 'Status').value).toBe('under-review');
    expect(text(element.querySelector('[role="status"]'))).toBe('CB-261018 is now Under review.');
  });

  it('shows the events that can happen next, and what each leads to', async () => {
    const element = await render('/chargebacks/CB-260921');

    expect(eventButtons(element)).toEqual([
      'Worldpay sends your response to the bank - Status becomes Under review',
      'Worldpay returns your response - Status becomes Returned by Worldpay',
    ]);
  });

  it('simulates an event and shows the new events', async () => {
    const element = await render('/chargebacks/CB-260921');

    (element.querySelector('section li button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(store.getById('CB-260921')?.status).toBe('under-review');
    expect(eventButtons(element)).toEqual([
      'Cardholder’s bank accepts your response - Status becomes Won',
      'Cardholder’s bank withdraws the dispute - Status becomes Dispute withdrawn',
      'Cardholder’s bank challenges your response - Status becomes Pre-arbitration response required',
      'Cardholder’s bank challenges; Worldpay handles it - Status becomes Pre-arbitration',
    ]);
  });

  it('offers only the due date to pass when the merchant must act', async () => {
    const element = await render('/chargebacks/CB-261018');

    expect(eventButtons(element)).toEqual(['Due date passes - Status becomes Deadline missed']);
  });

  it('says so when the case is closed', async () => {
    const element = await render('/chargebacks/CB-260655');

    expect(eventButtons(element)).toEqual([]);
    expect(text(element.querySelector('section p'))).toBe(
      'This case is closed. Nothing more happens to it.',
    );
  });

  it('resets all the data', async () => {
    const element = await render('/chargebacks/CB-261018');
    store.jumpToStatus('CB-261018', 'lost');
    store.jumpToStatus('CB-261022', 'won');
    fixture.detectChanges();

    const reset = [...element.querySelectorAll('button')].find(
      (button) => text(button) === 'Reset all data',
    );
    reset?.click();
    fixture.detectChanges();

    expect(store.getById('CB-261018')?.status).toBe('action-required');
    expect(store.getById('CB-261022')?.status).toBe('action-required');
    expect(text(element.querySelector('[role="status"]'))).toBe('All data reset.');
  });

  it('leaves the respond flow when its case changes status', async () => {
    const element = await render('/chargebacks/CB-261018/respond');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    choose(select(element, 'Status'), 'accepted');

    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/chargebacks', 'CB-261018']);
  });
});
