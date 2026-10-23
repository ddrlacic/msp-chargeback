import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CHARGEBACKS_PATH } from '../../../layout/app-sidebar/sidebar.constants';
import { PageBreadcrumb, PageComponent } from '../../../layout/page/page.component';
import { ChargebackStore } from '../../../services/chargeback/chargeback.store';
import { CHARGEBACKS_CONSTANTS } from '../chargebacks.constants';
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
}
