import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ChargebackCase } from '../../../../services/chargeback/chargeback.types';
import { CHARGEBACKS_CONSTANTS } from '../../chargebacks.constants';
import { getMoneySummary } from '../chargeback-case.utils';

let nextMoneyId = 0;

@Component({
  selector: 'app-case-money',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './case-money.component.html',
})
export class CaseMoneyComponent {
  readonly chargeback = input.required<ChargebackCase>();

  protected readonly copy = CHARGEBACKS_CONSTANTS.CASE.MONEY;
  protected readonly titleId = `case-money-${nextMoneyId++}`;
  protected readonly summary = computed(() => getMoneySummary(this.chargeback()));
}
