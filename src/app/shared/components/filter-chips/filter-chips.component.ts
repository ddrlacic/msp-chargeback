import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { FILTER_CHIPS_CONSTANTS } from './filter-chips.constants';

export interface FilterChip {
  readonly key: string;
  readonly label: string;
  readonly value: string;
}

@Component({
  selector: 'app-filter-chips',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filter-chips.component.html',
  host: { class: 'flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2' },
})
export class FilterChipsComponent {
  readonly chips = input.required<readonly FilterChip[]>();

  readonly remove = output<string>();
  readonly clearAll = output<void>();

  protected readonly copy = FILTER_CHIPS_CONSTANTS;
}
