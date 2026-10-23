import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ChargebackCase } from '../../../../services/chargeback/chargeback.types';
import { CHARGEBACKS_CONSTANTS } from '../../chargebacks.constants';
import { getCaseDetails } from '../chargeback-case.utils';

let nextDetailsId = 0;

@Component({
  selector: 'app-case-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './case-details.component.html',
  host: { class: '@container block' },
})
export class CaseDetailsComponent {
  readonly chargeback = input.required<ChargebackCase>();

  protected readonly copy = CHARGEBACKS_CONSTANTS.CASE.DETAILS;
  protected readonly titleId = `case-details-${nextDetailsId++}`;
  protected readonly rows = computed(() => getCaseDetails(this.chargeback()));
}
