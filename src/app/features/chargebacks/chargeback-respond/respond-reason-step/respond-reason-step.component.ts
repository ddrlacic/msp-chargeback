import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import {
  CHALLENGE_REASONS,
  ChallengeReason,
} from '../../../../services/chargeback/chargeback.types';
import {
  RadioGroupComponent,
  RadioOption,
} from '../../../../shared/components/radio-group/radio-group.component';
import { formatMoney } from '../../../../shared/utils/money.utils';
import { CHALLENGE_REASON_COPY, CHARGEBACKS_CONSTANTS } from '../../chargebacks.constants';
import { ChargebackRespondFlow } from '../chargeback-respond.flow';
import { AmountChoice, getAmountError } from '../chargeback-respond.utils';

let nextReasonStepId = 0;

@Component({
  selector: 'app-respond-reason-step',
  imports: [LucideAngularModule, RadioGroupComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './respond-reason-step.component.html',
  host: { class: 'flex flex-col gap-6' },
})
export class RespondReasonStepComponent {
  private readonly injector = inject(Injector);
  private readonly amountInput = viewChild<ElementRef<HTMLInputElement>>('amountInput');

  protected readonly flow = inject(ChargebackRespondFlow);
  protected readonly copy = CHARGEBACKS_CONSTANTS.RESPOND.REASON;

  private readonly id = nextReasonStepId++;
  protected readonly reasonLabelId = `respond-reason-label-${this.id}`;
  protected readonly reasonErrorId = `respond-reason-error-${this.id}`;
  protected readonly amountLabelId = `respond-amount-label-${this.id}`;
  protected readonly amountId = `respond-amount-${this.id}`;
  protected readonly amountHintId = `respond-amount-hint-${this.id}`;
  protected readonly amountErrorId = `respond-amount-error-${this.id}`;

  private readonly amountTouched = signal(false);

  protected readonly reasonOptions: readonly RadioOption[] = CHALLENGE_REASONS.map((reason) => ({
    value: reason,
    label: CHALLENGE_REASON_COPY[reason].label,
    description: CHALLENGE_REASON_COPY[reason].description,
  }));

  protected readonly amountOptions = computed<readonly RadioOption[]>(() => [
    {
      value: 'full',
      label: this.copy.AMOUNT_FULL(formatMoney(this.flow.fullAmount(), this.flow.currency())),
    },
    { value: 'partial', label: this.copy.AMOUNT_PARTIAL },
  ]);

  protected readonly maxAmount = computed(() =>
    formatMoney(this.flow.fullAmount(), this.flow.currency()),
  );
  protected readonly amountError = computed(() =>
    getAmountError(this.flow.fullAmount(), this.flow.currency()),
  );
  protected readonly showReasonError = computed(
    () => this.flow.attempted() && this.flow.reasonMissing(),
  );
  protected readonly showAmountError = computed(
    () =>
      this.flow.amountChoice() === 'partial' &&
      this.flow.amountInvalid() &&
      (this.flow.attempted() || this.amountTouched()),
  );

  protected onReason(value: string | undefined): void {
    this.flow.reason.set(value as ChallengeReason | undefined);
  }

  protected onAmountChoice(value: string | undefined): void {
    this.flow.amountChoice.set(value as AmountChoice);
    if (value === 'partial') {
      afterNextRender(() => this.amountInput()?.nativeElement.focus(), {
        injector: this.injector,
      });
    } else {
      this.amountTouched.set(false);
    }
  }

  protected onAmountInput(event: Event): void {
    this.flow.amountText.set((event.target as HTMLInputElement).value);
  }

  protected onAmountBlur(): void {
    this.amountTouched.set(true);
  }
}
