import { ComponentFixture, TestBed } from '@angular/core/testing';

import { createChargebackFixtures } from '../../../../services/chargeback/chargeback.fixtures';
import { ChargebackCase } from '../../../../services/chargeback/chargeback.types';
import { getTestProviders, TEST_TODAY } from '../../../../testing/providers';
import { CaseDocumentFilesService } from '../case-document-files.service';
import { CaseTimelineComponent } from './case-timeline.component';

const cases = createChargebackFixtures(TEST_TODAY);

function getCase(caseId: string): ChargebackCase {
  const chargeback = cases.find((item) => item.caseId === caseId);
  if (!chargeback) {
    throw new Error(`Missing fixture ${caseId}`);
  }
  return chargeback;
}

describe('CaseTimelineComponent', () => {
  let fixture: ComponentFixture<CaseTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaseTimelineComponent],
      providers: getTestProviders(),
    }).compileComponents();
  });

  function render(caseId: string): HTMLElement {
    fixture = TestBed.createComponent(CaseTimelineComponent);
    fixture.componentRef.setInput('chargeback', getCase(caseId));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function text(element: Element | null | undefined): string {
    return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  it('shows one list named Timeline', () => {
    const element = render('CB-261018');
    const lists = Array.from(element.querySelectorAll('ol'));

    expect(lists.length).toBe(1);
    expect(text(element.querySelector(`#${lists[0].getAttribute('aria-labelledby')}`))).toBe(
      'Timeline',
    );
  });

  it('puts the pending row last and marks it as the current step', () => {
    const element = render('CB-261018');
    const items = Array.from(element.querySelectorAll('li'));
    const last = items[items.length - 1];

    expect(last.hasAttribute('data-pending')).toBe(true);
    expect(last.getAttribute('aria-current')).toBe('step');
    expect(text(last.querySelectorAll('p')[0])).toBe('Your response is needed');
    expect(text(last.querySelectorAll('p')[1])).toBe('Respond by Oct 25, 2026');
  });

  it('lists the past events oldest first, above the pending row', () => {
    const element = render('CB-260876');
    const titles = Array.from(element.querySelectorAll('[data-event]')).map((item) =>
      text(item.querySelector('p')),
    );

    expect(titles[0]).toBe('Chargeback received');
    expect(titles[titles.length - 1]).toBe('Worldpay sent your response to the cardholder’s bank');
    expect(text(element.querySelector('[data-pending] p'))).toBe(
      'Waiting for the cardholder’s bank to decide',
    );
  });

  it('emits the primary action from the pending row', () => {
    const element = render('CB-260954');
    const action = vi.fn();
    fixture.componentInstance.action.subscribe(action);

    element.querySelector<HTMLButtonElement>('[data-pending] button')?.click();

    expect(action).toHaveBeenCalledExactlyOnceWith('resubmit');
  });

  it('shows no button when nothing needs action', () => {
    expect(render('CB-260876').querySelector('[data-pending] button')).toBe(null);
  });

  it('shows no pending row once the case is closed', () => {
    expect(render('CB-260655').querySelector('[data-pending]')).toBe(null);
  });

  it('shows what was sent on a resolved case', () => {
    const event = render('CB-260655').querySelector('[data-event="CB-260655-event-2"]');

    expect(
      Array.from(event?.querySelectorAll('[aria-label^="Preview"]') ?? []).map((button) =>
        button.getAttribute('aria-label'),
      ),
    ).toEqual(['Preview receipt-56933.pdf', 'Preview signed-authorization.pdf']);
  });

  it('marks past events with a small dot and the outcome with a check or a cross', () => {
    const won = render('CB-260655');
    const lost = render('CB-260540');
    const markers = (element: HTMLElement) =>
      Array.from(element.querySelectorAll('[data-event] > div:first-child')).map((marker) => {
        const icon = marker.querySelector('svg');
        if (!icon) {
          return 'dot';
        }
        return icon.classList.contains('lucide-x') ? 'x' : 'check';
      });

    expect(markers(won)).toEqual(['dot', 'dot', 'check']);
    expect(markers(lost)).toEqual(['dot', 'dot', 'dot', 'x']);
  });

  it('fills the outcome marker with the solid status colour', () => {
    const won = render('CB-260655').querySelectorAll('[data-event] > div:first-child > span');
    const lost = render('CB-260540').querySelectorAll('[data-event] > div:first-child > span');

    expect(won[won.length - 1].classList.contains('bg-success-120')).toBe(true);
    expect(lost[lost.length - 1].classList.contains('bg-error-120')).toBe(true);
  });

  it('shows a dot in the status colour on the pending row', () => {
    const marker = render('CB-261018').querySelector('[data-pending] > div:first-child > span');

    expect(marker?.classList.contains('bg-warning-15')).toBe(true);
    expect(marker?.firstElementChild?.classList.contains('bg-warning-120')).toBe(true);
  });

  it('shows the actor, the Worldpay term and the money on an event', () => {
    const event = render('CB-260655').querySelector('[data-event="CB-260655-event-2"]');

    expect(text(event?.querySelector('p'))).toBe('Response sent to Worldpay');
    expect(text(event?.querySelectorAll('p')[1])).toBe('You · Represent');
    expect(text(event?.querySelectorAll('p')[2])).toBe('$74.25 credited back');
  });

  it('opens a document from the event it was sent with', () => {
    const element = render('CB-260921');
    const open = vi.spyOn(TestBed.inject(CaseDocumentFilesService), 'open').mockReturnValue();

    element.querySelector<HTMLButtonElement>('[aria-label="Preview receipt-57890.pdf"]')?.click();

    expect(open).toHaveBeenCalledExactlyOnceWith('CB-260921', getCase('CB-260921').documents[0]);
  });
});
