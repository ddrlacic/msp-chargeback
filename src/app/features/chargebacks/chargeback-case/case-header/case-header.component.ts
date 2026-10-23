import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ChargebackCase } from '../../../../services/chargeback/chargeback.types';
import { CHARGEBACKS_CONSTANTS } from '../../chargebacks.constants';
import { ChargebackStatusBadgeComponent } from '../../shared/chargeback-status-badge/chargeback-status-badge.component';
import { getCaseHeader } from '../chargeback-case.utils';

@Component({
  selector: 'app-case-header',
  imports: [ChargebackStatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './case-header.component.html',
  host: { class: 'block min-w-0' },
})
export class CaseHeaderComponent {
  readonly chargeback = input.required<ChargebackCase>();

  protected readonly copy = CHARGEBACKS_CONSTANTS.CASE.HEADER;
  protected readonly header = computed(() => getCaseHeader(this.chargeback()));
}
