import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { ChargebackCase } from '../../../../services/chargeback/chargeback.types';
import { ButtonDirective } from '../../../../shared/components/button/button.directive';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { CHARGEBACKS_CONSTANTS } from '../../chargebacks.constants';
import { getArbitrationDialog } from '../chargeback-case.utils';

@Component({
  selector: 'app-case-arbitration-dialog',
  imports: [ButtonDirective, DialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './case-arbitration-dialog.component.html',
})
export class CaseArbitrationDialogComponent {
  readonly open = input(false);
  readonly chargeback = input.required<ChargebackCase>();
  readonly closed = output<void>();
  readonly confirmed = output<void>();

  protected readonly copy = CHARGEBACKS_CONSTANTS.ARBITRATION_DIALOG;
  protected readonly view = computed(() => getArbitrationDialog(this.chargeback()));
}
