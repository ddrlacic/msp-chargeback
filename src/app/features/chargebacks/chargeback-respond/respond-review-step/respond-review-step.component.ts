import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { formatDate } from '../../../../shared/utils/date.utils';
import { CHARGEBACKS_CONSTANTS } from '../../chargebacks.constants';
import { ChargebackRespondFlow } from '../chargeback-respond.flow';
import { getReviewRows } from '../chargeback-respond.utils';

@Component({
  selector: 'app-respond-review-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './respond-review-step.component.html',
  host: { class: 'flex flex-col gap-4' },
})
export class RespondReviewStepComponent {
  private readonly flow = inject(ChargebackRespondFlow);

  protected readonly copy = CHARGEBACKS_CONSTANTS.RESPOND.REVIEW;

  protected readonly rows = computed(() => {
    const chargeback = this.flow.chargeback();
    return chargeback ? getReviewRows(chargeback) : [];
  });

  protected readonly deadline = computed(() => {
    const date = this.flow.chargeback()?.replyByDate;
    return date ? this.copy.DEADLINE(formatDate(date)) : undefined;
  });
}
