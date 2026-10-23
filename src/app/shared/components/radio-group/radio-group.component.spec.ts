import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RadioGroupComponent, RadioOption } from './radio-group.component';

@Component({
  imports: [RadioGroupComponent],
  template: `
    <app-radio-group
      [options]="options"
      [value]="value()"
      [invalid]="invalid()"
      labelledBy="label"
      describedBy="error"
      (valueChange)="value.set($event)"
    />
  `,
})
class HostComponent {
  readonly options: readonly RadioOption[] = [
    { value: 'a', label: 'Option A', description: 'First option' },
    { value: 'b', label: 'Option B' },
  ];
  readonly value = signal<string | undefined>(undefined);
  readonly invalid = signal(false);
}

describe('RadioGroupComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  const radios = () => Array.from(element.querySelectorAll<HTMLInputElement>('input'));

  it('renders each option as a radio button in one group', () => {
    const group = element.querySelector('app-radio-group');

    expect(group?.getAttribute('role')).toBe('radiogroup');
    expect(group?.getAttribute('aria-labelledby')).toBe('label');
    expect(group?.getAttribute('aria-describedby')).toBe('error');
    expect(radios().map((radio) => radio.value)).toEqual(['a', 'b']);
    expect(new Set(radios().map((radio) => radio.name)).size).toBe(1);
    expect(
      Array.from(element.querySelectorAll('label')[0].querySelectorAll('span > span')).map((span) =>
        span.textContent?.trim(),
      ),
    ).toEqual(['Option A', 'First option']);
  });

  it('selects the option the merchant picks', () => {
    radios()[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('b');
    expect(radios().map((radio) => radio.checked)).toEqual([false, true]);
  });

  it('shows the value it is given', () => {
    fixture.componentInstance.value.set('a');
    fixture.detectChanges();

    expect(radios().map((radio) => radio.checked)).toEqual([true, false]);
  });

  it('marks the group invalid', () => {
    const group = element.querySelector('app-radio-group');

    expect(group?.hasAttribute('aria-invalid')).toBe(false);

    fixture.componentInstance.invalid.set(true);
    fixture.detectChanges();

    expect(group?.getAttribute('aria-invalid')).toBe('true');
  });
});
