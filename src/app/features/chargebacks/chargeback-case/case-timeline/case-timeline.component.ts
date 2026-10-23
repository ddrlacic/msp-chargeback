import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import {
  ChargebackAction,
  ChargebackCase,
  ChargebackDocument,
} from '../../../../services/chargeback/chargeback.types';
import { ButtonDirective } from '../../../../shared/components/button/button.directive';
import { CHARGEBACKS_CONSTANTS } from '../../chargebacks.constants';
import { CaseDocumentFilesService } from '../case-document-files.service';
import { getPendingRow, getTimelineRows, MarkerTone } from './case-timeline.utils';

const MARKER_HALO: Record<MarkerTone, string> = {
  neutral: '',
  'needs-action': 'bg-warning-15',
  'in-review': 'bg-info-15',
  won: 'bg-success-15',
  lost: 'bg-error-15',
};

const MARKER_DOT: Record<MarkerTone, string> = {
  neutral: 'bg-ink-subtle',
  'needs-action': 'bg-warning-120',
  'in-review': 'bg-info-120',
  won: 'bg-success-120',
  lost: 'bg-error-120',
};

let nextTimelineId = 0;

@Component({
  selector: 'app-case-timeline',
  imports: [ButtonDirective, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './case-timeline.component.html',
  host: { class: '@container relative block' },
})
export class CaseTimelineComponent {
  private readonly files = inject(CaseDocumentFilesService);

  readonly chargeback = input.required<ChargebackCase>();
  readonly action = output<ChargebackAction>();

  protected readonly copy = CHARGEBACKS_CONSTANTS.CASE.TIMELINE;
  protected readonly titleId = `case-timeline-${nextTimelineId++}`;

  protected readonly rows = computed(() =>
    getTimelineRows(this.chargeback()).map((row) => ({
      ...row,
      isOutcome: row.tone !== 'neutral',
      halo: row.tone === 'neutral' ? MARKER_HALO.neutral : MARKER_DOT[row.tone],
      dot: MARKER_DOT[row.tone],
      icon: row.tone === 'lost' ? 'x' : 'check',
    })),
  );

  protected readonly pending = computed(() => {
    const row = getPendingRow(this.chargeback());
    return row ? { ...row, halo: MARKER_HALO[row.tone], dot: MARKER_DOT[row.tone] } : undefined;
  });

  protected preview(document: ChargebackDocument): void {
    this.files.open(this.chargeback().caseId, document);
  }
}
