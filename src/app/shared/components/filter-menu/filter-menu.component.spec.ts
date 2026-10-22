import { ComponentFixture, TestBed } from '@angular/core/testing';

import { getTestProviders } from '../../../testing/providers';
import { FilterMenuComponent } from './filter-menu.component';

describe('FilterMenuComponent', () => {
  let fixture: ComponentFixture<FilterMenuComponent>;
  let element: HTMLElement;
  let emitted: (readonly string[])[];

  async function render(multiple: boolean, selected: readonly string[], valueLabel?: string) {
    await TestBed.configureTestingModule({
      imports: [FilterMenuComponent],
      providers: getTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(FilterMenuComponent);
    fixture.componentRef.setInput('label', 'Card network');
    fixture.componentRef.setInput('options', [
      { value: 'visa', label: 'Visa' },
      { value: 'amex', label: 'American Express' },
    ]);
    fixture.componentRef.setInput('selected', selected);
    fixture.componentRef.setInput('multiple', multiple);
    fixture.componentRef.setInput('valueLabel', valueLabel);
    emitted = [];
    fixture.componentInstance.selectedChange.subscribe((value) => emitted.push(value));
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  function trigger(): HTMLButtonElement {
    return element.querySelector('button') as HTMLButtonElement;
  }

  it('opens and closes from its button', async () => {
    await render(true, []);
    expect(trigger().getAttribute('aria-expanded')).toBe('false');

    trigger().click();
    await fixture.whenStable();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');

    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('adds and removes values in a multiple choice', async () => {
    await render(true, ['visa']);
    const boxes = element.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');

    boxes[1].click();
    boxes[0].click();

    expect(emitted).toEqual([['visa', 'amex'], []]);
  });

  it('emits the one chosen value in a single choice', async () => {
    await render(false, ['visa']);

    element.querySelectorAll<HTMLInputElement>('input[type="radio"]')[1].click();

    expect(emitted).toEqual([['amex']]);
  });

  it('shows the chosen value next to the label', async () => {
    await render(true, ['amex'], 'American Express');

    expect(trigger().getAttribute('aria-label')).toBe('Card network, American Express');
    expect(trigger().querySelector('.text-brand-primary')?.textContent?.trim()).toBe(
      'American Express',
    );
  });
});
