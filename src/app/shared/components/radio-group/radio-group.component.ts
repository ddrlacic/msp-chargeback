import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface RadioOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
}

let nextRadioGroupId = 0;

@Component({
  selector: 'app-radio-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './radio-group.component.html',
  host: {
    role: 'radiogroup',
    class: 'flex flex-col gap-2',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'invalid() ? true : null',
  },
})
export class RadioGroupComponent {
  readonly options = input.required<readonly RadioOption[]>();
  readonly value = model<string>();
  readonly labelledBy = input<string>();
  readonly describedBy = input<string>();
  readonly invalid = input(false);

  protected readonly name = `radio-group-${nextRadioGroupId++}`;

  protected onChange(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }
}
