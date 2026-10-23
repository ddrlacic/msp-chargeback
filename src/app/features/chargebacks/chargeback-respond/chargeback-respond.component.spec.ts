import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { MockInstance } from 'vitest';

import { ChargebackStore, DOCUMENT_SCAN_MS } from '../../../services/chargeback/chargeback.store';
import { installDialogPolyfill } from '../../../testing/dialog';
import { getTestProviders } from '../../../testing/providers';
import { ChargebackRespondComponent } from './chargeback-respond.component';
import { ChargebackRespondFlow } from './chargeback-respond.flow';

describe('ChargebackRespondComponent', () => {
  let fixture: ComponentFixture<ChargebackRespondComponent>;
  let navigate: MockInstance<Router['navigate']>;

  beforeAll(() => installDialogPolyfill());

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [ChargebackRespondComponent],
      providers: getTestProviders(),
    }).compileComponents();
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => vi.useRealTimers());

  function render(caseId: string): HTMLElement {
    fixture = TestBed.createComponent(ChargebackRespondComponent);
    fixture.componentRef.setInput('caseId', caseId);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const text = (element: Element | null | undefined) =>
    element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  function click(element: Element | null | undefined): void {
    (element as HTMLElement).click();
    fixture.detectChanges();
  }

  function action(element: HTMLElement, name: string): HTMLButtonElement | null {
    return element.querySelector<HTMLButtonElement>(`[data-action="${name}"]`);
  }

  function choose(element: HTMLElement, value: string): void {
    const radio = element.querySelector<HTMLInputElement>(`input[type="radio"][value="${value}"]`);
    if (!radio) {
      throw new Error(`Missing option ${value}`);
    }
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
  }

  function type(input: HTMLInputElement | HTMLTextAreaElement | null, value: string): void {
    if (!input) {
      throw new Error('Missing input');
    }
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  const spoken = (element: Element | null | undefined) =>
    Array.from(element?.querySelectorAll('*') ?? [])
      .map((child) =>
        Array.from(child.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => (node.textContent ?? '').replace(/\s+/g, ' ').trim())
          .join(' ')
          .trim(),
      )
      .filter(Boolean)
      .join(' ');

  const optionLabels = (group: Element | undefined) =>
    Array.from(group?.querySelectorAll('label > span > span:first-child') ?? []).map(text);

  const flow = () => fixture.debugElement.injector.get(ChargebackRespondFlow);
  const heading = (element: HTMLElement) => text(element.querySelector('section h2'));
  const stepStatuses = (element: HTMLElement) =>
    Array.from(element.querySelectorAll('app-respond-stepper [data-step]')).map((step) =>
      step.querySelector('[data-status]')?.getAttribute('data-status'),
    );

  it('starts at the review step with the dispute details', () => {
    const element = render('CB-261018');

    expect(text(element.querySelector('h1'))).toBe('Challenge chargeback');
    expect(
      Array.from(element.querySelectorAll('nav[aria-label="Breadcrumb"] li')).map(text),
    ).toEqual(['Chargebacks', 'CB-261018', 'Challenge chargeback']);
    expect(heading(element)).toBe('Review');
    expect(stepStatuses(element)).toEqual(['current', 'upcoming', 'upcoming', 'upcoming']);
    expect(text(element.querySelector('[data-row="amount"]'))).toBe('Disputed amount $86.40');
    expect(text(element.querySelector('app-respond-review-step > div > p:first-of-type'))).toBe(
      'Respond by Oct 25, 2026, or the chargeback stands',
    );
    expect(action(element, 'back')).toBe(null);
    expect(text(action(element, 'exit'))).toBe('Save and exit');
    expect(text(action(element, 'next'))).toBe('Continue');
  });

  describe('reason and amount', () => {
    let element: HTMLElement;

    beforeEach(() => {
      element = render('CB-261018');
      click(action(element, 'next'));
    });

    it('moves to the reason and amount step', () => {
      expect(heading(element)).toBe('Reason and amount');
      expect(stepStatuses(element)).toEqual(['complete', 'current', 'upcoming', 'upcoming']);
      expect(
        Array.from(element.querySelectorAll('input[type="radio"]')).map(
          (radio) => (radio as HTMLInputElement).value,
        ),
      ).toEqual([
        'credit-issued',
        'cardholder-withdrew',
        'invalid-dispute',
        'proof-of-purchase',
        'full',
        'partial',
      ]);
      expect(optionLabels(element.querySelectorAll('app-radio-group')[1])).toEqual([
        'Full amount ($86.40)',
        'Smaller amount',
      ]);
    });

    it('asks for a reason before continuing', () => {
      expect(element.querySelector('[role="alert"]')).toBe(null);

      click(action(element, 'next'));

      expect(heading(element)).toBe('Reason and amount');
      expect(text(element.querySelector('[role="alert"]'))).toBe('Choose a reason');
    });

    it('offers the full amount by default and a field for a smaller one', () => {
      expect(element.querySelector('input[type="text"]')).toBe(null);

      choose(element, 'partial');

      expect(element.querySelector('input[type="text"]')).not.toBe(null);
      expect(text(element.querySelector('app-respond-reason-step p.text-small'))).toBe(
        'Up to $86.40',
      );
    });

    it('explains an amount that is out of range after the field loses focus', () => {
      choose(element, 'invalid-dispute');
      choose(element, 'partial');
      const input = element.querySelector<HTMLInputElement>('input[type="text"]');
      type(input, '120');

      expect(element.querySelector('[role="alert"]')).toBe(null);

      input?.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(text(element.querySelector('[role="alert"]'))).toBe(
        'Enter an amount from $0.01 to $86.40',
      );
      expect(input?.getAttribute('aria-invalid')).toBe('true');

      click(action(element, 'next'));

      expect(heading(element)).toBe('Reason and amount');
    });

    it('continues to the evidence step with a reason and a valid smaller amount', () => {
      choose(element, 'invalid-dispute');
      choose(element, 'partial');
      type(element.querySelector('input[type="text"]'), '40.50');

      click(action(element, 'next'));

      expect(heading(element)).toBe('Evidence');
      expect(flow().challengedAmount()).toBe(40.5);
    });

    it('goes back to the review', () => {
      click(action(element, 'back'));

      expect(heading(element)).toBe('Review');
    });
  });

  describe('evidence', () => {
    let element: HTMLElement;

    beforeEach(() => {
      element = render('CB-261018');
      click(action(element, 'next'));
      choose(element, 'proof-of-purchase');
      click(action(element, 'next'));
    });

    it('lists the documents that fit the reason', () => {
      const rows = Array.from(element.querySelectorAll('[data-evidence]'));

      expect(rows.map((row) => row.getAttribute('data-evidence'))).toEqual([
        'transaction-receipt',
        'invoice',
        'delivery-proof',
        'customer-communication',
        'other',
      ]);
      expect(text(rows[0].querySelector('p'))).toBe('Transaction receipt');
      expect(rows[0].querySelector('button')?.getAttribute('aria-label')).toBe(
        'Upload transaction receipt',
      );
    });

    it('asks for at least one document before continuing', () => {
      click(action(element, 'next'));

      expect(heading(element)).toBe('Evidence');
      expect(text(element.querySelector('[role="alert"]'))).toBe('Add at least one document');
    });

    it('opens the upload dialog for the chosen document type', () => {
      const dialog = element.querySelector('app-case-upload-dialog dialog');
      click(element.querySelector('[data-evidence="delivery-proof"] button'));

      expect(dialog?.hasAttribute('open')).toBe(true);
      expect(element.querySelector<HTMLSelectElement>('app-case-upload-dialog select')?.value).toBe(
        'delivery-proof',
      );
    });

    it('checks off an item once a document is added and lets the merchant remove it', () => {
      flow().upload({
        type: 'transaction-receipt',
        files: [new File([new Uint8Array(2048)], 'receipt.pdf')],
      });
      fixture.detectChanges();
      const row = element.querySelector('[data-evidence="transaction-receipt"]');

      expect(row?.hasAttribute('data-done')).toBe(true);
      expect(spoken(row?.querySelector('[data-document]'))).toBe('receipt.pdf 2 KB Scanning');

      vi.advanceTimersByTime(DOCUMENT_SCAN_MS);
      fixture.detectChanges();

      expect(spoken(row?.querySelector('[data-document]'))).toBe('receipt.pdf 2 KB');

      click(row?.querySelector('[aria-label="Remove receipt.pdf"]'));

      expect(row?.hasAttribute('data-done')).toBe(false);
      expect(row?.querySelector('[data-document]')).toBe(null);
    });

    it('keeps the note with the response', () => {
      type(element.querySelector('textarea'), 'The order was delivered');

      expect(flow().note()).toBe('The order was delivered');
    });
  });

  describe('review and submit', () => {
    let element: HTMLElement;

    beforeEach(() => {
      element = render('CB-261022');
      click(action(element, 'next'));
      choose(element, 'invalid-dispute');
      choose(element, 'partial');
      type(element.querySelector('input[type="text"]'), '100');
      click(action(element, 'next'));
      flow().upload({
        type: 'terms-and-conditions',
        files: [new File([new Uint8Array(1024)], 'policy.pdf')],
      });
      type(element.querySelector('textarea'), 'Filed twice');
      click(action(element, 'next'));
    });

    it('summarizes what will be sent', () => {
      expect(heading(element)).toBe('Review and submit');
      expect(text(action(element, 'submit'))).toBe('Submit response');
      expect(spoken(element.querySelector('[data-section="reason"]'))).toBe(
        'Reason Invalid dispute Edit',
      );
      expect(spoken(element.querySelector('[data-section="amount"]'))).toBe(
        'Amount $100.00 of $142.75 Edit',
      );
      expect(spoken(element.querySelector('[data-section="documents"]'))).toContain(
        'policy.pdf Terms and conditions · 1 KB',
      );
      expect(spoken(element.querySelector('[data-section="note"]'))).toBe('Note Filed twice Edit');
    });

    it('tells the merchant what happens to the money', () => {
      expect(spoken(element.querySelector('app-respond-submit-step section'))).toBe(
        'What happens next Worldpay reviews your response and passes it on to the cardholder’s bank. $100.00 is credited back to your account while they decide.',
      );
    });

    it('waits for the security scan before it can be submitted', () => {
      expect(action(element, 'submit')?.disabled).toBe(true);
      expect(text(element.querySelector('[role="status"]'))).toBe(
        'Scanning documents. You can submit when it finishes',
      );

      vi.advanceTimersByTime(DOCUMENT_SCAN_MS);
      fixture.detectChanges();

      expect(action(element, 'submit')?.disabled).toBe(false);
      expect(element.querySelector('[role="status"]')).toBe(null);
    });

    it('opens the step again from an edit button', () => {
      click(element.querySelector('[aria-label="Edit documents"]'));

      expect(heading(element)).toBe('Evidence');
    });

    it('submits the response and opens the case', () => {
      vi.advanceTimersByTime(DOCUMENT_SCAN_MS);
      fixture.detectChanges();

      click(action(element, 'submit'));
      const chargeback = TestBed.inject(ChargebackStore).getById('CB-261022');

      expect(chargeback?.status).toBe('response-submitted');
      expect(chargeback?.challengedAmount).toBe(100);
      expect(navigate).toHaveBeenCalledExactlyOnceWith(['/chargebacks', 'CB-261022']);
    });

    it('does not describe a credit for a Visa chargeback', () => {
      const visa = render('CB-261018');
      click(action(visa, 'next'));
      choose(visa, 'cardholder-withdrew');
      click(action(visa, 'next'));
      flow().upload({
        type: 'customer-communication',
        files: [new File([new Uint8Array(1024)], 'email.pdf')],
      });
      click(action(visa, 'next'));

      expect(spoken(visa.querySelector('app-respond-submit-step section'))).toBe(
        'What happens next Worldpay reviews your response and passes it on to the cardholder’s bank. No money moves until they decide.',
      );
    });
  });

  describe('leaving', () => {
    it('saves a draft and opens the case', () => {
      const element = render('CB-261018');
      click(action(element, 'next'));
      choose(element, 'proof-of-purchase');

      click(action(element, 'exit'));

      expect(TestBed.inject(ChargebackStore).getById('CB-261018')?.status).toBe(
        'evidence-required',
      );
      expect(navigate).toHaveBeenCalledExactlyOnceWith(['/chargebacks', 'CB-261018']);
    });

    it('saves the draft when the page closes some other way', () => {
      const element = render('CB-261018');
      click(action(element, 'next'));
      choose(element, 'proof-of-purchase');

      fixture.destroy();

      expect(TestBed.inject(ChargebackStore).getById('CB-261018')?.draft?.reason).toBe(
        'proof-of-purchase',
      );
    });

    it('resumes a saved draft at the step after the last complete one', () => {
      const element = render('CB-260987');

      expect(heading(element)).toBe('Review and submit');
      expect(stepStatuses(element)).toEqual(['complete', 'complete', 'complete', 'current']);
    });
  });

  describe('fix and resubmit', () => {
    let element: HTMLElement;

    beforeEach(() => {
      element = render('CB-260954');
    });

    it('shows Worldpay’s note and starts at the evidence', () => {
      expect(text(element.querySelector('h1'))).toBe('Fix and resubmit');
      expect(spoken(element.querySelector('aside'))).toBe(
        'Note from Worldpay The delivery photo is hard to read. Upload a clearer copy that shows the delivery address and time. Resubmit by Oct 26, 2026, or the chargeback stands',
      );
      expect(heading(element)).toBe('Evidence');
      expect(stepStatuses(element)).toEqual(['complete', 'complete', 'current', 'upcoming']);
      expect(spoken(element.querySelector('[data-document]'))).toBe('delivery-photo.jpg 1.1 MB');
    });

    it('lets the merchant jump to any step', () => {
      click(element.querySelector('[data-step="review"] button'));

      expect(heading(element)).toBe('Review');
    });

    it('offers cancel instead of saving a draft', () => {
      expect(text(action(element, 'exit'))).toBe('Cancel');

      click(action(element, 'exit'));

      expect(TestBed.inject(ChargebackStore).getById('CB-260954')?.status).toBe(
        'returned-by-worldpay',
      );
      expect(navigate).toHaveBeenCalledExactlyOnceWith(['/chargebacks', 'CB-260954']);
    });

    it('resubmits with the old answers', () => {
      click(action(element, 'next'));
      click(action(element, 'submit'));

      expect(TestBed.inject(ChargebackStore).getById('CB-260954')?.status).toBe(
        'response-submitted',
      );
      expect(navigate).toHaveBeenCalledExactlyOnceWith(['/chargebacks', 'CB-260954']);
    });
  });
});
