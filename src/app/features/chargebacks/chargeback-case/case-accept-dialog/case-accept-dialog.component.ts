import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ButtonDirective } from '../../../../shared/components/button/button.directive';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { CHARGEBACKS_CONSTANTS } from '../../chargebacks.constants';

@Component({
  selector: 'app-case-accept-dialog',
  imports: [ButtonDirective, DialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './case-accept-dialog.component.html',
})
export class CaseAcceptDialogComponent {
  readonly open = input(false);
  readonly amount = input.required<string>();
  readonly closed = output<void>();
  readonly confirmed = output<void>();

  protected readonly copy = CHARGEBACKS_CONSTANTS.ACCEPT_DIALOG;
}
