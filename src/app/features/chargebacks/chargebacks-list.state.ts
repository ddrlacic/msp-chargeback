import { Injectable, signal } from '@angular/core';

import {
  clampColumnWidth,
  DEFAULT_COLUMN_WIDTHS,
} from './chargeback-table/chargeback-table.constants';
import { ChargebackListFilters, ChargebackSort, ColumnKey, ListTab } from './chargebacks.types';
import { DEFAULT_LIST_FILTERS, DEFAULT_LIST_SORT } from './chargebacks.utils';

@Injectable({ providedIn: 'root' })
export class ChargebacksListState {
  private readonly tabState = signal<ListTab>('all');
  private readonly filtersState = signal<ChargebackListFilters>(DEFAULT_LIST_FILTERS);
  private readonly sortState = signal<ChargebackSort>(DEFAULT_LIST_SORT);
  private readonly columnWidthsState = signal<Record<ColumnKey, number>>(DEFAULT_COLUMN_WIDTHS);

  readonly tab = this.tabState.asReadonly();
  readonly filters = this.filtersState.asReadonly();
  readonly sort = this.sortState.asReadonly();
  readonly columnWidths = this.columnWidthsState.asReadonly();

  setTab(tab: ListTab): void {
    this.tabState.set(tab);
  }

  setFilters(filters: ChargebackListFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set(DEFAULT_LIST_FILTERS);
  }

  setSort(sort: ChargebackSort): void {
    this.sortState.set(sort);
  }

  setColumnWidth(key: ColumnKey, width: number): void {
    this.columnWidthsState.update((widths) => ({ ...widths, [key]: clampColumnWidth(key, width) }));
  }
}
