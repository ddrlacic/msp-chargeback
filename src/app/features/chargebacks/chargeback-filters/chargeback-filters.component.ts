import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import {
  FilterMenuComponent,
  FilterMenuOption,
} from '../../../shared/components/filter-menu/filter-menu.component';
import { CARD_NETWORKS, CardNetwork } from '../../../services/chargeback/chargeback.types';
import {
  CARD_NETWORK_LABELS,
  CHARGEBACKS_CONSTANTS,
  RECEIVED_PRESET_LABELS,
} from '../chargebacks.constants';
import {
  ChargebackListFilters,
  LocationOption,
  RECEIVED_PRESETS,
  ReceivedPreset,
} from '../chargebacks.types';

@Component({
  selector: 'app-chargeback-filters',
  imports: [FilterMenuComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chargeback-filters.component.html',
  host: { class: 'flex min-w-0 flex-1 flex-wrap items-center gap-2' },
})
export class ChargebackFiltersComponent {
  readonly filters = input.required<ChargebackListFilters>();
  readonly locations = input.required<readonly LocationOption[]>();

  readonly filtersChange = output<ChargebackListFilters>();

  protected readonly copy = CHARGEBACKS_CONSTANTS.LIST;

  protected readonly receivedOptions: readonly FilterMenuOption[] = RECEIVED_PRESETS.map(
    (preset) => ({ value: preset, label: RECEIVED_PRESET_LABELS[preset] }),
  );

  protected readonly networkOptions: readonly FilterMenuOption[] = CARD_NETWORKS.map((network) => ({
    value: network,
    label: CARD_NETWORK_LABELS[network],
  }));

  protected readonly locationOptions = computed<readonly FilterMenuOption[]>(() =>
    this.locations().map((location) => ({
      value: location.merchantId,
      label: location.locationName,
      description: location.merchantId,
    })),
  );

  protected readonly receivedValue = computed(() => {
    const received = this.filters().received;
    return received === 'any' ? undefined : RECEIVED_PRESET_LABELS[received];
  });

  protected readonly locationValue = computed(() => {
    const selected = this.filters().merchantIds;
    if (selected.length === 1) {
      return this.locations().find((location) => location.merchantId === selected[0])?.locationName;
    }
    return selected.length ? this.copy.FILTERS.LOCATIONS(selected.length) : undefined;
  });

  protected readonly networkValue = computed(() => {
    const selected = this.filters().networks;
    if (selected.length === 1) {
      return CARD_NETWORK_LABELS[selected[0]];
    }
    return selected.length ? this.copy.FILTERS.NETWORKS(selected.length) : undefined;
  });

  protected onSearch(event: Event): void {
    this.update({ search: (event.target as HTMLInputElement).value });
  }

  protected clearSearch(input: HTMLInputElement): void {
    this.update({ search: '' });
    input.focus();
  }

  protected onReceived(values: readonly string[]): void {
    this.update({ received: (values[0] as ReceivedPreset | undefined) ?? 'any' });
  }

  protected onLocations(values: readonly string[]): void {
    this.update({ merchantIds: values });
  }

  protected onNetworks(values: readonly string[]): void {
    this.update({
      networks: CARD_NETWORKS.filter((network: CardNetwork) => values.includes(network)),
    });
  }

  private update(change: Partial<ChargebackListFilters>): void {
    this.filtersChange.emit({ ...this.filters(), ...change });
  }
}
