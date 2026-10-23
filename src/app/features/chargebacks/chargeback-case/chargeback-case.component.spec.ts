import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ChargebackStore } from '../../../services/chargeback/chargeback.store';
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

  it('lists documents to preview and download without upload or delete', () => {
    const documents = render('CB-260987').querySelector('app-case-documents');

    expect(documents?.querySelectorAll('li[data-document]').length).toBe(1);
    expect(documents?.querySelector('[aria-label="Download receipt-57961.pdf"]')).not.toBe(null);
    expect(documents?.querySelectorAll('button').length).toBe(2);
  });

  it('blocks download while a document is scanned', () => {
    const element = render('CB-260987');
    TestBed.inject(ChargebackStore).uploadDocuments('CB-260987', 'transaction-receipt', [
      { name: 'receipt.pdf', sizeBytes: 1200 },
    ]);
    fixture.detectChanges();

    const row = element.querySelectorAll('li[data-document]')[1];
    expect(text(row?.querySelector('[data-status]'))).toBe('Scanning');
    expect(row?.querySelector<HTMLButtonElement>('[aria-label^="Download"]')?.disabled).toBe(true);
  });

  it('hides documents when the case has none', () => {
    expect(render('CB-261018').querySelector('app-case-documents')).toBe(null);
  });

  it('lists the timeline newest first', () => {
    const items = render('CB-260655').querySelectorAll(
      '[aria-labelledby="case-timeline-title"] ol > li',
    );

    expect(text(items[0].querySelector('p'))).toBe('Resolved in your favor');
    expect(items.length).toBe(3);
  });

  it('shows a not found state for an unknown case', () => {
    const element = render('CB-000000');

    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Case not found');
    expect(element.querySelector('section > div:last-child a')?.getAttribute('href')).toBe(
      '/chargebacks',
    );
  });
});
