import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { formatDate } from '../../../shared/utils/date.utils';
import { formatMoney } from '../../../shared/utils/money.utils';
import { CHARGEBACK_STATE_LABELS, CHARGEBACKS_CONSTANTS } from '../chargebacks.constants';
import { ChargebackListSummary } from '../chargebacks.types';

interface SummaryTile {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly detail: string;
  readonly urgent: boolean;
}

@Component({
  selector: 'app-chargeback-summary',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chargeback-summary.component.html',
  host: { class: 'block @container' },
})
export class ChargebackSummaryComponent {
  readonly summary = input.required<ChargebackListSummary>();

  protected readonly tiles = computed<readonly SummaryTile[]>(() => {
    const { needsAction, dueSoon, inReview, won, currency } = this.summary();
    const copy = CHARGEBACKS_CONSTANTS.LIST.SUMMARY;
    const money = (amount: number) => formatMoney(amount, currency);
    return [
      {
        key: 'needs-action',
        label: CHARGEBACK_STATE_LABELS['needs-action'],
        value: needsAction.count,
        detail: copy.DISPUTED(money(needsAction.amount)),
        urgent: false,
      },
      {
        key: 'due-soon',
        label: copy.DUE_SOON,
        value: dueSoon.count,
        detail: dueSoon.nextDueDate
          ? copy.NEXT_DUE(formatDate(dueSoon.nextDueDate))
          : copy.NOTHING_DUE_SOON,
        urgent: dueSoon.count > 0,
      },
      {
        key: 'in-review',
        label: CHARGEBACK_STATE_LABELS['in-review'],
        value: inReview.count,
        detail: copy.DISPUTED(money(inReview.amount)),
        urgent: false,
      },
      {
        key: 'won',
        label: CHARGEBACK_STATE_LABELS.won,
        value: won.count,
        detail: copy.RETURNED(money(won.amount)),
        urgent: false,
      },
    ];
  });
}
