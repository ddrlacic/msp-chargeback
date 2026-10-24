import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { ChargebackDocument } from '../../../../services/chargeback/chargeback.types';
import { ButtonDirective } from '../../../../shared/components/button/button.directive';
import { CHARGEBACKS_CONSTANTS } from '../../chargebacks.constants';
import { getDocumentChipState } from './document-chip.utils';

@Component({
  selector: 'app-document-chip',
  imports: [ButtonDirective, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './document-chip.component.html',
  host: {
    class:
      'relative -ml-2 flex h-8 max-w-[calc(100%+0.5rem)] min-w-0 items-center gap-1.5 rounded-md pl-2 transition-[background-color] duration-200 ease-in-out has-[[data-preview]:hover]:bg-hover has-[[data-preview]:active]:bg-pressed pointer-coarse:h-11',
    '[class.pr-1]': 'removable()',
    '[class.pr-2]': '!removable()',
    '[attr.data-document]': 'document().id',
  },
})
export class DocumentChipComponent {
  readonly document = input.required<ChargebackDocument>();
  readonly details = input<string>();
  readonly removable = input(false);

  readonly open = output<ChargebackDocument>();
  readonly remove = output<ChargebackDocument>();

  protected readonly copy = CHARGEBACKS_CONSTANTS.DOCUMENT_CHIP;
  protected readonly state = computed(() => getDocumentChipState(this.document()));
}
