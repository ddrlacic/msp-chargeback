import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { PageComponent } from '../../layout/page/page.component';
import { ChargebackStore } from '../../services/chargeback/chargeback.store';
import { CLOCK } from '../../shared/clock';
import { FilterChipsComponent } from '../../shared/components/filter-chips/filter-chips.component';
import { toIsoDate } from '../../shared/utils/date.utils';
import { ChargebackFiltersComponent } from './chargeback-filters/chargeback-filters.component';
import {
  ChargebackTableComponent,
  ColumnResize,
} from './chargeback-table/chargeback-table.component';
import { ChargebackTabsComponent, getTabId } from './chargeback-tabs/chargeback-tabs.component';
import { ChargebacksListState } from './chargebacks-list.state';
import { CHARGEBACKS_CONSTANTS, LIST_TAB_EMPTY_COPY } from './chargebacks.constants';
import { ChargebackListFilters, ColumnKey, ListTab } from './chargebacks.types';
import {
  clearListFilters,
  countDueSoon,
  getFilterChips,
  getLocationOptions,
  getNextSort,
  hasActiveFilters,
  matchesFilters,
  matchesTab,
  removeListFilter,
  sortRows,
  summarizeTabs,
  toChargebackRow,
  toCsv,
} from './chargebacks.utils';

const TABLE_PANEL_ID = 'chargebacks-table-panel';

@Component({
  selector: 'app-chargebacks',
  imports: [
    ChargebackFiltersComponent,
    ChargebackTableComponent,
    ChargebackTabsComponent,
    FilterChipsComponent,
    LucideAngularModule,
    PageComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chargebacks.component.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
})
export class ChargebacksComponent {
  private readonly store = inject(ChargebackStore);
  private readonly listState = inject(ChargebacksListState);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly today = inject(CLOCK).now();

  protected readonly copy = CHARGEBACKS_CONSTANTS.LIST;
  protected readonly panelId = TABLE_PANEL_ID;

  protected readonly tab = this.listState.tab;
  protected readonly filters = this.listState.filters;
  protected readonly sort = this.listState.sort;
  protected readonly columnWidths = this.listState.columnWidths;
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());

  private readonly allRows = computed(() =>
    this.store.cases().map((chargeback) => toChargebackRow(chargeback, this.today)),
  );

  private readonly filteredRows = computed(() =>
    this.allRows().filter((row) => matchesFilters(row, this.filters(), this.today)),
  );

  protected readonly rows = computed(() =>
    sortRows(
      this.filteredRows().filter((row) => matchesTab(row, this.tab())),
      this.sort(),
    ),
  );

  protected readonly tabSummaries = computed(() => summarizeTabs(this.filteredRows()));
  protected readonly dueSoon = computed(() => countDueSoon(this.filteredRows()));
  protected readonly currency = computed(() => this.allRows()[0]?.currency ?? 'USD');
  protected readonly locations = computed(() => getLocationOptions(this.allRows()));
  protected readonly tabId = computed(() => getTabId(this.tab()));
  protected readonly filterChips = computed(() => getFilterChips(this.filters(), this.locations()));

  private readonly selectedRows = computed(() =>
    this.rows().filter((row) => this.selectedIds().has(row.caseId)),
  );

  protected readonly exportLabel = computed(() =>
    this.selectedRows().length
      ? this.copy.EXPORT.SELECTED(this.selectedRows().length)
      : this.copy.EXPORT.ALL,
  );

  protected readonly emptyState = computed(() => {
    if (hasActiveFilters(this.filters())) {
      return {
        icon: 'search-x',
        title: this.copy.NO_RESULTS.TITLE,
        message: this.copy.NO_RESULTS.MESSAGE,
        canClear: true,
      };
    }
    const copy = LIST_TAB_EMPTY_COPY[this.tab()];
    return {
      icon: this.tab() === 'needs-action' ? 'circle-check' : 'inbox',
      title: copy.title,
      message: copy.message,
      canClear: false,
    };
  });

  protected onTabChange(tab: ListTab): void {
    this.listState.setTab(tab);
    this.selectedIds.set(new Set());
  }

  protected onFiltersChange(filters: ChargebackListFilters): void {
    this.listState.setFilters(filters);
    this.selectedIds.set(new Set());
  }

  protected clearFilters(): void {
    this.listState.clearFilters();
    this.selectedIds.set(new Set());
  }

  protected removeFilter(key: string): void {
    this.onFiltersChange(removeListFilter(this.filters(), key));
  }

  protected clearAllFilters(): void {
    this.onFiltersChange(clearListFilters(this.filters()));
  }

  protected onSortChange(key: ColumnKey): void {
    this.listState.setSort(getNextSort(this.sort(), key));
  }

  protected onColumnResize(resize: ColumnResize): void {
    this.listState.setColumnWidth(resize.key, resize.width);
  }

  protected openCase(caseId: string): void {
    void this.router.navigate(['/chargebacks', caseId]);
  }

  protected exportCases(): void {
    const rows = this.selectedRows().length ? this.selectedRows() : this.rows();
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = this.copy.EXPORT.FILE_NAME(toIsoDate(this.today));
    link.click();
    URL.revokeObjectURL(url);
  }
}
