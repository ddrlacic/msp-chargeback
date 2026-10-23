import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { CLOCK } from '../../../../shared/clock';
import { DueDateTone, getDueDateInfo } from './chargeback-due-date.utils';

const TONE_CLASSES: Record<DueDateTone, string> = {
  default: 'text-ink-muted',
  soon: 'font-semibold text-needs-action-text',
  overdue: 'font-semibold text-lost-text',
};

@Component({
  selector: 'app-chargeback-due-date',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chargeback-due-date.component.html',
  host: {
    class: 'inline-flex',
    '[attr.data-tone]': 'info().tone',
  },
})
export class ChargebackDueDateComponent {
  private readonly clock = inject(CLOCK);

  readonly date = input.required<string>();
  readonly windowDays = input<number>();
  readonly layout = input<'stacked' | 'inline'>('stacked');
  readonly remainingSize = input<'small' | 'body'>('small');

  protected readonly info = computed(() =>
    getDueDateInfo(this.date(), this.clock.now(), this.windowDays()),
  );
  protected readonly toneClass = computed(
    () => `${TONE_CLASSES[this.info().tone]} ${this.remainingSize() === 'body' ? 'text-body' : 'text-small'}`,
  );
  protected readonly iconSize = computed(() => (this.remainingSize() === 'body' ? 14 : 12));
  protected readonly iconClass = computed(() =>
    this.remainingSize() === 'body' ? 'size-3.5' : 'size-3',
  );
  protected readonly iconStroke = computed(() => (this.layout() === 'inline' ? 1 : 1.5));
}
