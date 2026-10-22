import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChildren,
} from '@angular/core';

import { formatMoney } from '../../../shared/utils/money.utils';
import { CHARGEBACK_STATE_LABELS, CHARGEBACKS_CONSTANTS } from '../chargebacks.constants';
import { ListTab, TabSummary } from '../chargebacks.types';

export function getTabId(tab: ListTab): string {
  return `chargebacks-tab-${tab}`;
}

@Component({
  selector: 'app-chargeback-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chargeback-tabs.component.html',
  host: { class: 'block' },
})
export class ChargebackTabsComponent {
  readonly tabs = input.required<readonly TabSummary[]>();
  readonly dueSoon = input.required<number>();
  readonly currency = input.required<string>();
  readonly active = input.required<ListTab>();
  readonly panelId = input.required<string>();

  readonly activeChange = output<ListTab>();

  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('tab');

  protected readonly label = CHARGEBACKS_CONSTANTS.LIST.TABS.LABEL;
  protected readonly getTabId = getTabId;

  protected readonly items = computed(() => {
    const copy = CHARGEBACKS_CONSTANTS.LIST.TABS;
    const dueSoon = this.dueSoon();
    return this.tabs().map((item) => {
      const amount = formatMoney(item.amount, this.currency());
      return {
        ...item,
        label: item.tab === 'all' ? copy.ALL : CHARGEBACK_STATE_LABELS[item.tab],
        detail: item.tab === 'won' ? copy.RETURNED(amount) : copy.DISPUTED(amount),
        dueSoon: item.tab === 'needs-action' && dueSoon > 0 ? copy.DUE_SOON(dueSoon) : null,
      };
    });
  });

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const last = this.items().length - 1;
    const targets: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const target = targets[event.key];
    if (target === undefined) {
      return;
    }
    event.preventDefault();
    this.activeChange.emit(this.items()[target].tab);
    this.buttons()[target]?.nativeElement.focus();
  }
}
