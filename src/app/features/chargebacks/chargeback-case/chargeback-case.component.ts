import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { CHARGEBACKS_PATH } from '../../../layout/app-sidebar/sidebar.constants';
import { PageBreadcrumb, PageComponent } from '../../../layout/page/page.component';
import { ChargebackStore } from '../../../services/chargeback/chargeback.store';
import { ChargebackAction } from '../../../services/chargeback/chargeback.types';
import { getOutstandingAmount } from '../../../services/chargeback/chargeback.utils';
import { formatMoney } from '../../../shared/utils/money.utils';
import { CHARGEBACKS_CONSTANTS, RESPOND_PATH } from '../chargebacks.constants';
import { CaseAcceptDialogComponent } from './case-accept-dialog/case-accept-dialog.component';
import { CaseArbitrationDialogComponent } from './case-arbitration-dialog/case-arbitration-dialog.component';
import { CaseDeadlineComponent } from './case-deadline/case-deadline.component';
import { CaseDetailsComponent } from './case-details/case-details.component';
import { CaseHeaderComponent } from './case-header/case-header.component';
import { CaseMoneyComponent } from './case-money/case-money.component';
import { CaseStatusBannerComponent } from './case-status-banner/case-status-banner.component';
import { CaseTimelineComponent } from './case-timeline/case-timeline.component';
import { getCaseDeadline } from './chargeback-case.utils';

@Component({
  selector: 'app-chargeback-case',
  imports: [
    CaseAcceptDialogComponent,
    CaseArbitrationDialogComponent,
    CaseDeadlineComponent,
    CaseDetailsComponent,
    CaseHeaderComponent,
    CaseMoneyComponent,
    CaseStatusBannerComponent,
    CaseTimelineComponent,
    PageComponent,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chargeback-case.component.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
})
export class ChargebackCaseComponent {
  private readonly store = inject(ChargebackStore);
  private readonly router = inject(Router);

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

  protected readonly deadline = computed(() => {
    const chargeback = this.chargeback();
    return chargeback ? getCaseDeadline(chargeback) : undefined;
  });

  protected readonly acceptOpen = signal(false);
  protected readonly arbitrationOpen = signal(false);

  protected readonly acceptAmount = computed(() => {
    const chargeback = this.chargeback();
    return chargeback ? formatMoney(getOutstandingAmount(chargeback), chargeback.currency) : '';
  });

  protected onAction(action: ChargebackAction): void {
    switch (action) {
      case 'accept':
        this.acceptOpen.set(true);
        break;
      case 'request-arbitration':
        this.arbitrationOpen.set(true);
        break;
      case 'challenge':
      case 'continue-challenge':
      case 'resubmit':
      case 'respond-pre-arbitration':
        void this.router.navigate([CHARGEBACKS_PATH, this.caseId(), RESPOND_PATH]);
        break;
    }
  }

  protected acceptChargeback(): void {
    this.acceptOpen.set(false);
    this.store.acceptChargeback(this.caseId());
  }

  protected requestArbitration(): void {
    this.arbitrationOpen.set(false);
    this.store.requestArbitration(this.caseId());
  }
}
