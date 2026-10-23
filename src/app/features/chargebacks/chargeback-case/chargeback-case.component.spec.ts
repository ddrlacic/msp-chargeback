import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { installDialogPolyfill } from '../../../testing/dialog';
import { getTestProviders } from '../../../testing/providers';
import { ChargebackCaseComponent } from './chargeback-case.component';

describe('ChargebackCaseComponent', () => {
  let fixture: ComponentFixture<ChargebackCaseComponent>;

  beforeAll(() => installDialogPolyfill());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChargebackCaseComponent],
      providers: getTestProviders(),
    }).compileComponents();
  });

  function render(caseId: string): HTMLElement {
    fixture = TestBed.createComponent(ChargebackCaseComponent);
    fixture.componentRef.setInput('caseId', caseId);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function text(element: Element | null | undefined): string {
    return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  function click(element: Element | null): void {
    (element as HTMLElement).click();
    fixture.detectChanges();
  }

  it('shows the amount and status in the header', () => {
    const element = render('CB-261018');
    const header = element.querySelector('app-case-header');

    expect(text(element.querySelector('h1'))).toBe('Case CB-261018');
    expect(text(header?.querySelector('p'))).toBe('Disputed amount $86.40');
    expect(text(header?.querySelector('app-chargeback-status-badge'))).toBe('Action required');
    expect(header?.querySelector('app-chargeback-due-date')).toBe(null);
  });

  it('shows the due date in its own section above the amounts', () => {
    const element = render('CB-261018');
    const deadline = element.querySelector('app-case-deadline');

    expect(text(deadline?.querySelector('h2'))).toBe('Respond by');
    expect(deadline?.querySelector('app-chargeback-due-date')?.getAttribute('data-tone')).toBe(
      'soon',
    );
    expect(deadline?.nextElementSibling?.tagName).toBe('APP-CASE-MONEY');
  });

  it('hides the due date when the case does not need action', () => {
    expect(render('CB-260655').querySelector('app-chargeback-due-date')).toBe(null);
  });

  it('offers accept and challenge side by side for a new chargeback', () => {
    const banner = render('CB-261018').querySelector('app-case-status-banner');
    const buttons = Array.from(banner?.querySelectorAll('li button') ?? []);

    expect(banner?.getAttribute('data-state')).toBe('needs-action');
    expect(text(banner?.querySelector('h2'))).toBe('Choose to accept or challenge the chargeback');
    expect(buttons.map((button) => button.getAttribute('data-action'))).toEqual([
      'accept',
      'challenge',
    ]);
    expect(buttons[1].classList.contains('bg-brand-primary')).toBe(true);
    expect(buttons[0].classList.contains('bg-brand-primary')).toBe(false);
    expect(buttons[0].classList.contains('self-start')).toBe(true);
  });

  it('emits the chosen action', () => {
    render('CB-260954');
    const banner = fixture.debugElement.query(By.css('app-case-status-banner'));
    const action = vi.fn();
    banner.componentInstance.action.subscribe(action);

    click(banner.nativeElement.querySelector('[data-action="resubmit"]'));

    expect(action).toHaveBeenCalledExactlyOnceWith('resubmit');
  });

  it('shows Worldpay’s note on a returned response', () => {
    const banner = render('CB-260954').querySelector('app-case-status-banner');

    expect(text(banner?.querySelector('figcaption'))).toBe('Note from Worldpay');
    expect(text(banner?.querySelector('blockquote'))).toBe(
      'The delivery photo is hard to read. Upload a clearer copy that shows the delivery address and time.',
    );
  });

  it('shows the money summary', () => {
    const rows = Array.from(render('CB-260790').querySelectorAll('app-case-money [data-row]'));

    expect(
      rows.map((row) => [text(row.querySelector('dt')), text(row.querySelector('dd'))]),
    ).toEqual([
      ['Disputed', '$312.00'],
      ['Debited', '\u2212$624.00'],
      ['Credited back', '$312.00'],
      ['Net so far', '\u2212$312.00'],
    ]);
  });

  it('shows the timeline in the main column, oldest event first', () => {
    const timeline = render('CB-260655').querySelector('app-case-timeline');
    const events = timeline?.querySelectorAll('[data-event]') ?? [];

    expect(text(timeline?.querySelector('h2'))).toBe('Timeline');
    expect(events.length).toBe(3);
    expect(text(events[0].querySelector('p'))).toBe('Chargeback received');
    expect(text(events[2].querySelector('p'))).toBe('Resolved in your favor');
  });

  it('offers a small secondary button on the pending row', () => {
    const button = render('CB-261018').querySelector<HTMLElement>(
      'app-case-timeline [data-pending] button',
    );

    expect(text(button)).toBe('Challenge chargeback');
    expect(button?.classList.contains('h-7')).toBe(true);
    expect(button?.classList.contains('bg-white')).toBe(true);
    expect(button?.classList.contains('bg-brand-primary')).toBe(false);
  });

  it('shows a not found state for an unknown case', () => {
    const element = render('CB-000000');

    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Case not found');
    expect(element.querySelector('section > div:last-child a')?.getAttribute('href')).toBe(
      '/chargebacks',
    );
  });
});
