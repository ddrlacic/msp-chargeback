import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  ChargebackColorState,
  ChargebackStatus,
} from '../../../../services/chargeback/chargeback.types';
import { getStatusState } from '../../../../services/chargeback/chargeback.utils';
import { CHARGEBACK_STATUS_COPY } from '../../chargebacks.constants';

const STATE_CLASSES: Record<
  ChargebackColorState,
  { readonly badge: string; readonly dot: string }
> = {
  'needs-action': { badge: 'bg-needs-action-soft text-needs-action-ink', dot: 'bg-needs-action' },
  'in-review': { badge: 'bg-in-review-soft text-in-review-ink', dot: 'bg-in-review' },
  won: { badge: 'bg-won-soft text-won-ink', dot: 'bg-won' },
  lost: { badge: 'bg-lost-soft text-lost-ink', dot: 'bg-lost' },
};

@Component({
  selector: 'app-chargeback-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chargeback-status-badge.component.html',
  host: {
    class: 'inline-flex max-w-full',
    '[attr.data-state]': 'state()',
  },
})
export class ChargebackStatusBadgeComponent {
  readonly status = input.required<ChargebackStatus>();

  protected readonly state = computed(() => getStatusState(this.status()));
  protected readonly label = computed(() => CHARGEBACK_STATUS_COPY[this.status()].label);
  protected readonly classes = computed(() => STATE_CLASSES[this.state()]);
}
