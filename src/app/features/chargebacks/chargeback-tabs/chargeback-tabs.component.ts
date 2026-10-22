import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChildren,
} from '@angular/core';

import { CHARGEBACK_STATE_LABELS, CHARGEBACKS_CONSTANTS } from '../chargebacks.constants';
import { ListTab, TabCount } from '../chargebacks.types';

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
  readonly tabs = input.required<readonly TabCount[]>();
  readonly active = input.required<ListTab>();
  readonly panelId = input.required<string>();

  readonly activeChange = output<ListTab>();

  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('tab');

  protected readonly label = CHARGEBACKS_CONSTANTS.LIST.TABS.LABEL;
  protected readonly getTabId = getTabId;

  protected readonly items = computed(() =>
    this.tabs().map((item) => ({
      ...item,
      label:
        item.tab === 'all'
          ? CHARGEBACKS_CONSTANTS.LIST.TABS.ALL
          : CHARGEBACK_STATE_LABELS[item.tab],
    })),
  );

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
