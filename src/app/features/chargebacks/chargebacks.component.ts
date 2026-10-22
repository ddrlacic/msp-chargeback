import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageComponent } from '../../layout/page/page.component';
import { ChargebackStore } from '../../services/chargeback/chargeback.store';
import { getResponseWindowDays, isNeedsAction } from '../../services/chargeback/chargeback.utils';
import { formatMoney } from '../../shared/utils/money.utils';
import { CHARGEBACKS_CONSTANTS } from './chargebacks.constants';
import { ChargebackDueDateComponent } from './shared/chargeback-due-date/chargeback-due-date.component';
import { ChargebackStatusBadgeComponent } from './shared/chargeback-status-badge/chargeback-status-badge.component';

@Component({
  selector: 'app-chargebacks',
  imports: [ChargebackDueDateComponent, ChargebackStatusBadgeComponent, PageComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chargebacks.component.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
})
export class ChargebacksComponent {
  private readonly store = inject(ChargebackStore);

  protected readonly copy = CHARGEBACKS_CONSTANTS.LIST;

  protected readonly rows = computed(() =>
    this.store.cases().map((chargeback) => ({
      caseId: chargeback.caseId,
      status: chargeback.status,
      location: chargeback.locationName,
      amount: formatMoney(chargeback.chargebackAmount, chargeback.currency),
      replyByDate: isNeedsAction(chargeback.status) ? chargeback.replyByDate : undefined,
      windowDays: getResponseWindowDays(chargeback),
    })),
  );
}
