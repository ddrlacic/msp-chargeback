import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { CheckboxComponent } from '../../../shared/components/checkbox/checkbox.component';
import { formatDate } from '../../../shared/utils/date.utils';
import { formatMoney, formatMoneyParts } from '../../../shared/utils/money.utils';
import { CHARGEBACKS_CONSTANTS, COLUMN_LABELS } from '../chargebacks.constants';
import { ChargebackRow, ChargebackSort, ColumnKey } from '../chargebacks.types';
import { sumAmounts } from '../chargebacks.utils';
import { ChargebackDueDateComponent } from '../shared/chargeback-due-date/chargeback-due-date.component';
import { ChargebackStatusBadgeComponent } from '../shared/chargeback-status-badge/chargeback-status-badge.component';
import {
  ACTION_CELL_INSET,
  ACTION_COLUMN_WIDTH,
  ColumnConfig,
  RESIZE_STEP,
  SELECT_COLUMN_WIDTH,
  TABLE_COLUMNS,
} from './chargeback-table.constants';

export interface ColumnResize {
  readonly key: ColumnKey;
  readonly width: number;
}

type SortIcon = 'column' | 'asc' | 'desc';

interface ResizeDrag {
  readonly key: ColumnKey;
  readonly startX: number;
  readonly startWidth: number;
}

const ICON_VISIBLE = 'scale-100 opacity-100 blur-[0px]';
const ICON_HIDDEN = 'scale-25 opacity-0 blur-xs';
const CELL_CLASS =
  'h-10 border-b border-line bg-white px-3 whitespace-nowrap group-last:border-b-0 group-hover:bg-row-hover group-data-selected:bg-row-selected group-data-selected:group-hover:bg-row-selected-hover pointer-coarse:h-11';

@Component({
  selector: 'app-chargeback-table',
  imports: [
    CheckboxComponent,
    ChargebackDueDateComponent,
    ChargebackStatusBadgeComponent,
    LucideAngularModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chargeback-table.component.html',
  host: {
    class: 'block',
    '[class.select-none]': 'resizing()',
    '[class.cursor-col-resize]': 'resizing()',
  },
})
export class ChargebackTableComponent {
  private readonly document = inject(DOCUMENT);

  readonly rows = input.required<readonly ChargebackRow[]>();
  readonly sort = input.required<ChargebackSort>();
  readonly selectedIds = input.required<ReadonlySet<string>>();
  readonly columnWidths = input.required<Record<ColumnKey, number>>();
  readonly scrollRows = input(true);

  readonly sortChange = output<ColumnKey>();
  readonly selectionChange = output<ReadonlySet<string>>();
  readonly columnResize = output<ColumnResize>();
  readonly rowOpen = output<string>();

  protected readonly copy = CHARGEBACKS_CONSTANTS.LIST.TABLE;
  protected readonly labels = COLUMN_LABELS;
  protected readonly columns = TABLE_COLUMNS;
  protected readonly selectColumnWidth = SELECT_COLUMN_WIDTH;
  protected readonly actionColumnWidth = signal(ACTION_COLUMN_WIDTH);
  private readonly actionContents = viewChildren<ElementRef<HTMLElement>>('actionContent');
  protected readonly cellClass = `${CELL_CLASS} border-r`;
  protected readonly lastCellClass = CELL_CLASS;

  protected readonly resizing = signal<ColumnKey | undefined>(undefined);
  private drag?: ResizeDrag;

  protected readonly viewRows = computed(() =>
    this.rows().map((row) => ({
      row,
      linkId: `chargeback-row-${row.caseId}`,
      amount: formatMoneyParts(row.amount, row.currency),
      card: `${row.networkLabel} •••• ${row.cardLastFour}`,
      cardLabel: this.copy.CARD(row.networkLabel, row.cardLastFour),
      location: `${row.dbaName} · ${row.merchantId}`,
      transactionDate: formatDate(row.transactionDate),
      received: formatDate(row.receivedDate),
      lastUpdated: formatDate(row.lastUpdated),
    })),
  );

  protected readonly tableWidth = computed(
    () =>
      SELECT_COLUMN_WIDTH +
      this.actionColumnWidth() +
      TABLE_COLUMNS.reduce((total, column) => total + this.columnWidths()[column.key], 0),
  );

  protected readonly selectedCount = computed(
    () => this.rows().filter((row) => this.selectedIds().has(row.caseId)).length,
  );
  protected readonly allSelected = computed(
    () => this.rows().length > 0 && this.selectedCount() === this.rows().length,
  );
  protected readonly someSelected = computed(() => this.selectedCount() > 0 && !this.allSelected());

  protected readonly footerLabel = computed(() =>
    this.selectedCount()
      ? this.copy.SELECTED(this.selectedCount(), this.rows().length)
      : this.copy.IN_VIEW(this.rows().length),
  );
  protected readonly total = computed(() =>
    formatMoney(sumAmounts(this.rows()), this.rows()[0]?.currency ?? 'USD'),
  );

  constructor() {
    afterRenderEffect(() => {
      const content = Math.max(
        0,
        ...this.actionContents().map(({ nativeElement }) => nativeElement.offsetWidth),
      );
      if (content > 0) {
        this.actionColumnWidth.set(content + ACTION_CELL_INSET);
      }
    });
  }

  protected ariaSort(key: ColumnKey): string | null {
    if (this.sort().key !== key) {
      return null;
    }
    return this.sort().direction === 'asc' ? 'ascending' : 'descending';
  }

  protected iconClass(key: ColumnKey, icon: SortIcon): string {
    const sort = this.sort();
    const current: SortIcon = sort.key === key ? sort.direction : 'column';
    return current === icon ? ICON_VISIBLE : ICON_HIDDEN;
  }

  protected isSelected(caseId: string): boolean {
    return this.selectedIds().has(caseId);
  }

  protected toggleAll(checked: boolean): void {
    this.selectionChange.emit(new Set(checked ? this.rows().map((row) => row.caseId) : []));
  }

  protected toggleRow(caseId: string, checked: boolean): void {
    const next = new Set(this.selectedIds());
    if (checked) {
      next.add(caseId);
    } else {
      next.delete(caseId);
    }
    this.selectionChange.emit(next);
  }

  protected onRowClick(event: MouseEvent, caseId: string): void {
    const target = event.target as Element;
    if (target.closest('a, button, input, label')) {
      return;
    }
    if (this.document.getSelection()?.toString()) {
      return;
    }
    this.rowOpen.emit(caseId);
  }

  protected startResize(event: PointerEvent, column: ColumnConfig): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.drag = {
      key: column.key,
      startX: event.clientX,
      startWidth: this.columnWidths()[column.key],
    };
    this.resizing.set(column.key);
  }

  protected moveResize(event: PointerEvent): void {
    if (!this.drag) {
      return;
    }
    this.columnResize.emit({
      key: this.drag.key,
      width: this.drag.startWidth + event.clientX - this.drag.startX,
    });
  }

  protected endResize(event: PointerEvent): void {
    if (!this.drag) {
      return;
    }
    const target = event.currentTarget as HTMLElement;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
    this.drag = undefined;
    this.resizing.set(undefined);
  }

  protected resetWidth(column: ColumnConfig): void {
    this.columnResize.emit({ key: column.key, width: column.width });
  }

  protected onResizeKey(event: KeyboardEvent, column: ColumnConfig): void {
    const width = this.columnWidths()[column.key];
    const next: Record<string, number> = {
      ArrowLeft: width - RESIZE_STEP,
      ArrowRight: width + RESIZE_STEP,
      Home: column.minWidth,
      End: column.maxWidth,
    };
    if (next[event.key] === undefined) {
      return;
    }
    event.preventDefault();
    this.columnResize.emit({ key: column.key, width: next[event.key] });
  }
}
