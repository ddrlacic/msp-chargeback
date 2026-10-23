import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { filter, map } from 'rxjs';

import { CHARGEBACK_STATUS_COPY } from '../../features/chargebacks/chargebacks.constants';
import {
  getScenarioEvents,
  SCENARIO_EVENT_RESULTS,
  ScenarioEvent,
} from '../../services/chargeback/chargeback-scenario.utils';
import { ChargebackStore } from '../../services/chargeback/chargeback.store';
import { CHARGEBACK_STATUSES } from '../../services/chargeback/chargeback.types';
import { ButtonDirective } from '../../shared/components/button/button.directive';
import { CHARGEBACKS_PATH } from '../app-sidebar/sidebar.constants';
import { SCENARIO_PANEL_COPY, SCENARIO_PANEL_ID } from './scenario-panel.constants';
import { getCaseIdFromUrl, isRespondUrl } from './scenario-panel.utils';

let nextScenarioId = 0;

@Component({
  selector: 'app-scenario-panel',
  imports: [ButtonDirective, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scenario-panel.component.html',
})
export class ScenarioPanelComponent {
  private readonly store = inject(ChargebackStore);
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly copy = SCENARIO_PANEL_COPY;
  protected readonly panelId = SCENARIO_PANEL_ID;
  protected readonly caseSelectId = `scenario-case-${nextScenarioId}`;
  protected readonly statusSelectId = `scenario-status-${nextScenarioId++}`;
  protected readonly announcement = signal('');

  protected readonly caseId = computed(() => getCaseIdFromUrl(this.url()));
  protected readonly chargeback = computed(() => {
    const caseId = this.caseId();
    return caseId === undefined ? undefined : this.store.getById(caseId);
  });

  protected readonly caseOptions = computed(() =>
    this.store.cases().map((chargeback) => ({
      id: chargeback.caseId,
      label: this.copy.CASE_OPTION(
        chargeback.caseId,
        chargeback.locationName,
        CHARGEBACK_STATUS_COPY[chargeback.status].label,
      ),
    })),
  );

  protected readonly statusOptions = CHARGEBACK_STATUSES.map((status) => ({
    value: status,
    label: CHARGEBACK_STATUS_COPY[status].label,
  }));

  protected readonly events = computed(() => {
    const chargeback = this.chargeback();
    return chargeback
      ? getScenarioEvents(chargeback).map((event) => ({
          event,
          label: this.copy.EVENT_LABELS[event],
          result: this.copy.BECOMES(CHARGEBACK_STATUS_COPY[SCENARIO_EVENT_RESULTS[event]].label),
        }))
      : [];
  });

  protected selectCase(caseId: string): void {
    if (caseId) {
      void this.router.navigate([CHARGEBACKS_PATH, caseId]);
    }
  }

  protected selectStatus(value: string): void {
    const caseId = this.caseId();
    const status = CHARGEBACK_STATUSES.find((item) => item === value);
    if (caseId === undefined || status === undefined) {
      return;
    }
    this.store.jumpToStatus(caseId, status);
    this.afterChange(caseId);
  }

  protected simulate(event: ScenarioEvent): void {
    const caseId = this.caseId();
    if (caseId === undefined) {
      return;
    }
    this.store.simulateEvent(caseId, event);
    this.afterChange(caseId);
  }

  protected reset(): void {
    this.store.reset();
    this.announcement.set(this.copy.ANNOUNCE_RESET);
    this.leaveRespond();
  }

  private afterChange(caseId: string): void {
    const chargeback = this.store.getById(caseId);
    if (chargeback) {
      this.announcement.set(
        this.copy.ANNOUNCE_STATUS(caseId, CHARGEBACK_STATUS_COPY[chargeback.status].label),
      );
    }
    this.leaveRespond();
  }

  private leaveRespond(): void {
    const caseId = this.caseId();
    if (caseId !== undefined && isRespondUrl(this.url())) {
      void this.router.navigate([CHARGEBACKS_PATH, caseId]);
    }
  }
}
