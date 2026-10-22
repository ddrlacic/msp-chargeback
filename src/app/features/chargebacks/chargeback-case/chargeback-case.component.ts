import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CHARGEBACKS_PATH } from '../../../layout/app-sidebar/sidebar.constants';
import { PageBreadcrumb, PageComponent } from '../../../layout/page/page.component';
import { ChargebackStore } from '../../../services/chargeback/chargeback.store';
import {
  getResponseWindowDays,
  isNeedsAction,
} from '../../../services/chargeback/chargeback.utils';
import { formatMoney } from '../../../shared/utils/money.utils';
import { CHARGEBACKS_CONSTANTS } from '../chargebacks.constants';
import { ChargebackDueDateComponent } from '../shared/chargeback-due-date/chargeback-due-date.component';
import { ChargebackStatusBadgeComponent } from '../shared/chargeback-status-badge/chargeback-status-badge.component';

@Component({
  selector: 'app-chargeback-case',
  imports: [ChargebackDueDateComponent, ChargebackStatusBadgeComponent, PageComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chargeback-case.component.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
})
export class ChargebackCaseComponent {
  private readonly store = inject(ChargebackStore);

  readonly caseId = input.required<string>();

  protected readonly copy = CHARGEBACKS_CONSTANTS.CASE;
  protected readonly chargebacksPath = CHARGEBACKS_PATH;

  protected readonly chargeback = computed(() => this.store.getById(this.caseId()));

  protected readonly title = computed(() =>
    this.chargeback() ? this.copy.TITLE(this.caseId()) : this.copy.NOT_FOUND_TITLE,
  );

  protected readonly breadcrumbs = computed<readonly PageBreadcrumb[]>(() => [
    { label: this.copy.BREADCRUMB, link: CHARGEBACKS_PATH },
    { label: this.chargeback() ? this.caseId() : this.copy.NOT_FOUND_TITLE },
  ]);

  protected readonly amount = computed(() => {
    const chargeback = this.chargeback();
    return chargeback ? formatMoney(chargeback.chargebackAmount, chargeback.currency) : '';
  });

  protected readonly dueDate = computed(() => {
    const chargeback = this.chargeback();
    if (!chargeback?.replyByDate || !isNeedsAction(chargeback.status)) {
      return undefined;
    }
    return { date: chargeback.replyByDate, windowDays: getResponseWindowDays(chargeback) };
  });
}
