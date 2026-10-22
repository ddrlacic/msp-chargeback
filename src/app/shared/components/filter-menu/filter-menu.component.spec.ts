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

  it('keeps the filter name on the button and marks it active when a value is chosen', async () => {
    await render(true, ['amex'], 'American Express');

    expect(trigger().textContent?.trim()).toBe('Card network');
    expect(trigger().hasAttribute('data-active')).toBe(true);
    expect(trigger().getAttribute('aria-label')).toBe('Card network, American Express');
  });

  it('is not active without a chosen value', async () => {
    await render(true, []);

    expect(trigger().hasAttribute('data-active')).toBe(false);
  });

  function footerButton(label: string): HTMLButtonElement {
    const button = [...element.querySelectorAll<HTMLButtonElement>('[role="group"] button')].find(
      (item) => item.textContent?.trim() === label,
    );
    if (!button) {
      throw new Error(`Missing ${label}`);
    }
    return button;
  }

  it('clears and selects all values from the footer of a multiple choice', async () => {
    await render(true, ['visa']);

    footerButton('Clear').click();
    footerButton('Select all').click();

    expect(emitted).toEqual([[], ['visa', 'amex']]);
  });

  it('turns off Clear with nothing chosen and Select all with everything chosen', async () => {
    await render(true, []);
    expect(footerButton('Clear').disabled).toBe(true);
    expect(footerButton('Select all').disabled).toBe(false);

    fixture.componentRef.setInput('selected', ['visa', 'amex']);
    await fixture.whenStable();
    expect(footerButton('Clear').disabled).toBe(false);
    expect(footerButton('Select all').disabled).toBe(true);
  });

  it('has no footer in a single choice', async () => {
    await render(false, ['visa']);

    expect(element.querySelectorAll('[role="group"] button').length).toBe(0);
  });
});
