import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-checkbox',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkbox.component.html',
  host: { class: 'relative grid size-4 shrink-0 place-items-center' },
})
export class CheckboxComponent {
  readonly checked = input(false);
  readonly indeterminate = input(false);
  readonly ariaLabel = input<string>();
  readonly tabIndex = input(0);

  readonly checkedChange = output<boolean>();

  protected onChange(event: Event): void {
    this.checkedChange.emit((event.target as HTMLInputElement).checked);
  }
}
