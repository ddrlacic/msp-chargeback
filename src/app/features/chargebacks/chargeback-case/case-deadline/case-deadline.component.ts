import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ChargebackDueDateComponent } from '../../shared/chargeback-due-date/chargeback-due-date.component';
import { CaseDeadline } from '../chargeback-case.utils';

let nextDeadlineId = 0;

@Component({
  selector: 'app-case-deadline',
  imports: [ChargebackDueDateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './case-deadline.component.html',
})
export class CaseDeadlineComponent {
  readonly deadline = input.required<CaseDeadline>();

  protected readonly titleId = `case-deadline-${nextDeadlineId++}`;
}
