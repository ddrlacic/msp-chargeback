import { Directive, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'icon';

const BASE =
  'relative inline-flex shrink-0 items-center justify-center rounded-md whitespace-nowrap transition-[background-color,box-shadow,color] duration-200 ease-in-out disabled:cursor-not-allowed';

const CONTROL =
  'h-control gap-1 px-3 font-semibold after:absolute after:inset-x-0 after:-inset-y-0.5 pointer-coarse:after:-inset-y-1';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: `${CONTROL} bg-brand-primary text-white shadow-button-primary enabled:hover:bg-brand-primary-hover disabled:bg-grayscale-20 disabled:shadow-none`,
  secondary: `${CONTROL} bg-white text-ink-strong shadow-control enabled:hover:bg-canvas enabled:hover:shadow-control-hover disabled:text-ink-placeholder disabled:shadow-field`,
  destructive: `${CONTROL} bg-danger text-white shadow-button-primary enabled:hover:bg-danger-hover`,
  icon: 'size-8 text-ink-subtle after:absolute after:-inset-1 enabled:hover:bg-hover enabled:hover:text-ink enabled:active:bg-pressed disabled:text-ink-placeholder pointer-coarse:after:-inset-1.5',
};

@Directive({
  selector: 'button[appButton]',
  host: { '[class]': 'classes()' },
})
export class ButtonDirective {
  readonly appButton = input<ButtonVariant>('secondary');

  protected readonly classes = computed(() => `${BASE} ${VARIANTS[this.appButton()]}`);
}
