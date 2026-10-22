import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { getTestProviders } from '../../testing/providers';
import { ChargebacksComponent } from './chargebacks.component';

describe('ChargebacksComponent', () => {
  let fixture: ComponentFixture<ChargebacksComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChargebacksComponent],
      providers: getTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(ChargebacksComponent);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  function bodyRows(): HTMLTableRowElement[] {
    return [...element.querySelectorAll<HTMLTableRowElement>('tbody tr')];
  }

  function caseIds(): string[] {
    return bodyRows().map((row) => row.querySelector('a')?.textContent?.trim() ?? '');
  }

  function rowFor(caseId: string): HTMLTableRowElement {
    const row = bodyRows().find((item) => item.querySelector('a')?.textContent?.trim() === caseId);
    if (!row) {
      throw new Error(`Missing row ${caseId}`);
    }
    return row;
  }

  function text(target: Element | null): string {
    return target?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  function header(label: string): HTMLTableCellElement {
    const cell = [...element.querySelectorAll<HTMLTableCellElement>('thead th')].find(
      (item) => text(item) === label,
    );
    if (!cell) {
      throw new Error(`Missing header ${label}`);
    }
    return cell;
  }

  async function search(value: string): Promise<void> {
    const input = element.querySelector<HTMLInputElement>('input[type="search"]');
    if (!input) {
      throw new Error('Missing search');
    }
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function click(target: Element | null | undefined): Promise<void> {
    (target as HTMLElement).click();
    await fixture.whenStable();
  }

  it('shows the page title without a description', () => {
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Chargebacks');
    expect(element.querySelector('header p')).toBe(null);
  });

  it('summarizes what needs action, what is due soon, what is in review and what was won', () => {
    const tile = (key: string) =>
      [...element.querySelectorAll(`[data-tile="${key}"] dt, [data-tile="${key}"] dd`)].map(text);

    expect(tile('needs-action')).toEqual(['Needs action', '7', '$1,053.75 disputed']);
    expect(tile('due-soon')).toEqual(['Due soon', '4', 'Next due Oct 23, 2026']);
    expect(tile('in-review')).toEqual(['In review', '4', '$522.89 disputed']);
    expect(tile('won')).toEqual(['Won', '3', '$234.05 returned']);
  });

  it('lists every case, soonest due date first', () => {
    expect(bodyRows().length).toBe(17);
    expect(caseIds().slice(0, 3)).toEqual(['CB-261031', 'CB-261018', 'CB-260954']);
    expect(header('Due date').getAttribute('aria-sort')).toBe('ascending');
  });

  it('shows the due date and an invisible action on cases that need action', () => {
    const row = rowFor('CB-261031');

    expect(row.querySelector('app-chargeback-status-badge')?.getAttribute('data-state')).toBe(
      'needs-action',
    );
    expect(row.querySelector('app-chargeback-due-date')?.getAttribute('data-tone')).toBe('soon');
    const action = row.querySelectorAll('a')[1];
    expect(text(action)).toBe('Review and respond');
    expect(action.getAttribute('data-style')).toBe('invisible');
  });

  it('shows an invisible simple "View details" action and no due date on other cases', () => {
    const row = rowFor('CB-260921');
    const action = row.querySelectorAll('a')[1];

    expect(row.querySelector('app-chargeback-due-date')).toBe(null);
    expect(text(action)).toBe('View details');
    expect(action.getAttribute('data-style')).toBe('invisible-simple');
  });

  it('has no primary buttons in the table', () => {
    expect(element.querySelector('app-chargeback-table .bg-brand-primary')).toBe(null);
  });

  it('shows the cases of one state per tab', async () => {
    const wonTab = element.querySelector('[role="tab"][data-tab="won"]');
    expect(text(wonTab?.lastElementChild ?? null)).toBe('3');

    await click(wonTab);

    expect(wonTab?.getAttribute('aria-selected')).toBe('true');
    expect(bodyRows().length).toBe(3);
    expect(element.querySelector('[role="tabpanel"]')?.getAttribute('aria-labelledby')).toBe(
      'chargebacks-tab-won',
    );
  });

  it('says when nothing matches and clears the filters from there', async () => {
    await search('no-such-case');

    expect(bodyRows().length).toBe(0);
    expect(text(element.querySelector('[role="tabpanel"] h2'))).toBe('No cases match your filters');

    const clear = [...element.querySelectorAll('[role="tabpanel"] button')].find(
      (button) => text(button) === 'Clear filters',
    );
    await click(clear);

    expect(bodyRows().length).toBe(17);
  });

  it('shows applied filters as chips that can be removed one by one or all at once', async () => {
    const networkMenu = [...element.querySelectorAll('app-filter-menu')].find(
      (menu) => text(menu.querySelector('button')) === 'Card network',
    );
    const visa = [...(networkMenu?.querySelectorAll('label') ?? [])].find(
      (label) => text(label) === 'Visa',
    );
    expect(element.querySelector('app-filter-chips')).toBe(null);

    await click(visa?.querySelector('input'));

    expect(bodyRows().length).toBe(6);
    expect(text(element.querySelector('[data-filter="networks"]'))).toBe('Card network: Visa');

    await click(element.querySelector('[aria-label="Remove Card network filter"]'));
    expect(bodyRows().length).toBe(17);
    expect(element.querySelector('app-filter-chips')).toBe(null);

    await click(visa?.querySelector('input'));
    await search('CB-26');
    const clearAll = [...element.querySelectorAll('app-filter-chips button')].find(
      (button) => text(button) === 'Clear all',
    );
    await click(clearAll);

    expect(element.querySelector('app-filter-chips')).toBe(null);
    expect(element.querySelector<HTMLInputElement>('input[type="search"]')?.value).toBe('CB-26');
  });

  it('opens the case when a row is clicked', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await click(rowFor('CB-261018').querySelectorAll('td')[4]);

    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/chargebacks', 'CB-261018']);
  });

  it('does not open the case when its checkbox is selected', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await click(rowFor('CB-261018').querySelector('input[type="checkbox"]'));

    expect(navigate).toHaveBeenCalledTimes(0);
    expect(text(element.querySelector('[aria-live="polite"]'))).toBe('1 of 17 selected');
  });

  it('selects every case in view and counts them in the footer and export button', async () => {
    const selectAll = element.querySelector<HTMLInputElement>(
      'thead input[aria-label="Select all cases in view"]',
    );
    expect(text(element.querySelector('[aria-live="polite"]'))).toBe('17 cases in view');

    await click(selectAll);

    expect(text(element.querySelector('[aria-live="polite"]'))).toBe('17 of 17 selected');
    expect(
      [...element.querySelectorAll('button')].some((button) => text(button) === 'Export 17 cases'),
    ).toBe(true);
  });

  it('marks select-all as partial when only some cases are selected', async () => {
    await click(rowFor('CB-261018').querySelector('input[type="checkbox"]'));

    const selectAll = element.querySelector<HTMLInputElement>('thead input[type="checkbox"]');
    expect(selectAll?.indeterminate).toBe(true);
    expect(selectAll?.checked).toBe(false);
  });

  it('sorts by a column when its header is selected', async () => {
    await click(header('Amount').querySelector('button'));

    expect(header('Amount').getAttribute('aria-sort')).toBe('descending');
    expect(header('Due date').hasAttribute('aria-sort')).toBe(false);
    expect(caseIds()[0]).toBe('CB-260790');
  });

  it('resizes a column from the keyboard within its limits', async () => {
    const handle = element.querySelector<HTMLElement>(
      '[role="separator"][aria-label="Resize the Reason column"]',
    );
    expect(handle?.getAttribute('aria-valuenow')).toBe('320');

    handle?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await fixture.whenStable();
    expect(handle?.getAttribute('aria-valuenow')).toBe('336');

    handle?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    await fixture.whenStable();
    expect(handle?.getAttribute('aria-valuenow')).toBe('560');
  });
});
