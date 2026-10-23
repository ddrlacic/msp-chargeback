import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ChargebackCase } from '../../../../services/chargeback/chargeback.types';
import {
  getResponseWindowDays,
  isNeedsAction,
} from '../../../../services/chargeback/chargeback.utils';
import { CHARGEBACKS_CONSTANTS } from '../../chargebacks.constants';
import { ChargebackDueDateComponent } from '../../shared/chargeback-due-date/chargeback-due-date.component';
import { ChargebackStatusBadgeComponent } from '../../shared/chargeback-status-badge/chargeback-status-badge.component';
import { getCaseHeader } from '../chargeback-case.utils';

@Component({
  selector: 'app-case-header',
  imports: [ChargebackDueDateComponent, ChargebackStatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './case-header.component.html',
  host: { class: 'flex flex-wrap items-start justify-between gap-x-6 gap-y-4' },
})
export class CaseHeaderComponent {
  readonly chargeback = input.required<ChargebackCase>();

  protected readonly copy = CHARGEBACKS_CONSTANTS.CASE.HEADER;
  protected readonly header = computed(() => getCaseHeader(this.chargeback()));
  protected readonly dueDate = computed(() => {
    const chargeback = this.chargeback();
    if (!chargeback.replyByDate || !isNeedsAction(chargeback.status)) {
      return undefined;
    }
    return { date: chargeback.replyByDate, windowDays: getResponseWindowDays(chargeback) };
  });
}
