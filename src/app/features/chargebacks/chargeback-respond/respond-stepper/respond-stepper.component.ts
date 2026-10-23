import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { CHARGEBACKS_CONSTANTS } from '../../chargebacks.constants';
import { RESPOND_STEPS, RespondStep } from '../chargeback-respond.utils';

export type StepStatus = 'complete' | 'current' | 'upcoming';

export interface StepperItem {
  readonly key: RespondStep;
  readonly number: number;
  readonly label: string;
  readonly status: StepStatus;
  readonly reachable: boolean;
}

@Component({
  selector: 'app-respond-stepper',
  imports: [LucideAngularModule, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './respond-stepper.component.html',
  host: { class: '@container block' },
})
export class RespondStepperComponent {
  readonly current = input.required<RespondStep>();
  readonly reachable = input.required<readonly RespondStep[]>();
  readonly select = output<RespondStep>();

  protected readonly copy = CHARGEBACKS_CONSTANTS.RESPOND;

  protected readonly items = computed<readonly StepperItem[]>(() => {
    const currentIndex = RESPOND_STEPS.indexOf(this.current());
    return RESPOND_STEPS.map((key, index) => ({
      key,
      number: index + 1,
      label: this.copy.STEPS[key],
      status: index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming',
      reachable: this.reachable().includes(key),
    }));
  });

  protected readonly position = computed(() =>
    this.copy.STEP_OF(RESPOND_STEPS.indexOf(this.current()) + 1, RESPOND_STEPS.length),
  );
}
