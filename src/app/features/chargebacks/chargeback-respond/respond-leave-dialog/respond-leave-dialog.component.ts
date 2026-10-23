import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { ButtonDirective } from '../../../../shared/components/button/button.directive';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { CHARGEBACKS_CONSTANTS } from '../../chargebacks.constants';

export type LeaveChoice = 'stay' | 'discard' | 'save';

@Component({
  selector: 'app-respond-leave-dialog',
  imports: [ButtonDirective, DialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './respond-leave-dialog.component.html',
})
export class RespondLeaveDialogComponent {
  readonly open = input(false);
  readonly canSaveDraft = input(true);
  readonly choose = output<LeaveChoice>();

  protected readonly copy = CHARGEBACKS_CONSTANTS.RESPOND.LEAVE_DIALOG;
  protected readonly title = computed(() =>
    this.canSaveDraft() ? this.copy.SAVE_TITLE : this.copy.DISCARD_TITLE,
  );
  protected readonly description = computed(() =>
    this.canSaveDraft() ? this.copy.SAVE_DESCRIPTION : this.copy.DISCARD_DESCRIPTION,
  );
}
