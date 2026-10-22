import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { CheckboxComponent } from '../checkbox/checkbox.component';

export interface FilterMenuOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
}

const VIEWPORT_MARGIN = 8;

let nextFilterMenuId = 0;

@Component({
  selector: 'app-filter-menu',
  imports: [CheckboxComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filter-menu.component.html',
  host: {
    class: 'relative inline-flex',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
    '(keydown.escape)': 'closeAndFocusTrigger()',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class FilterMenuComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly label = input.required<string>();
  readonly options = input.required<readonly FilterMenuOption[]>();
  readonly selected = input.required<readonly string[]>();
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly valueLabel = input<string>();

  readonly selectedChange = output<readonly string[]>();

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  protected readonly id = `filter-menu-${nextFilterMenuId++}`;
  protected readonly open = signal(false);
  protected readonly alignEnd = signal(false);
  protected readonly active = computed(() => Boolean(this.valueLabel()));
  protected readonly accessibleName = computed(() => {
    const value = this.valueLabel();
    return value ? `${this.label()}, ${value}` : this.label();
  });

  protected toggle(): void {
    if (this.open()) {
      this.open.set(false);
      return;
    }
    const trigger = this.trigger().nativeElement.getBoundingClientRect();
    const panelWidth = this.panel().nativeElement.offsetWidth;
    const viewportWidth = this.host.nativeElement.ownerDocument.documentElement.clientWidth;
    this.alignEnd.set(trigger.left + panelWidth > viewportWidth - VIEWPORT_MARGIN);
    this.open.set(true);
    afterNextRender(() => this.focusFirstOption(), { injector: this.injector });
  }

  protected isSelected(value: string): boolean {
    return this.selected().includes(value);
  }

  protected toggleValue(value: string, checked: boolean): void {
    const without = this.selected().filter((item) => item !== value);
    this.selectedChange.emit(checked ? [...without, value] : without);
  }

  protected selectValue(value: string): void {
    this.selectedChange.emit([value]);
  }

  protected onOptionClick(event: MouseEvent): void {
    if (event.detail > 0) {
      this.closeAndFocusTrigger();
    }
  }

  protected closeAndFocusTrigger(): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.trigger().nativeElement.focus();
  }

  protected onDocumentPointerDown(event: PointerEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (this.open() && next && !this.host.nativeElement.contains(next)) {
      this.open.set(false);
    }
  }

  private focusFirstOption(): void {
    const inputs = [...this.panel().nativeElement.querySelectorAll('input')];
    (inputs.find((item) => item.checked) ?? inputs[0])?.focus();
  }
}
