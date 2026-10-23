import { Directive, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'invisible-simple' | 'icon';
export type ButtonSize = 'default' | 'small';

const BASE =
  'relative inline-flex shrink-0 items-center justify-center rounded-md whitespace-nowrap transition-[background-color,box-shadow,color] duration-200 ease-in-out disabled:cursor-not-allowed';

const SIZES: Record<ButtonSize, string> = {
  default:
    'h-control gap-1 px-3 font-semibold after:absolute after:inset-x-0 after:-inset-y-0.5 pointer-coarse:after:-inset-y-1',
  small:
    'h-7 gap-1 px-2.5 font-semibold after:absolute after:inset-x-0 after:-inset-y-1.5 pointer-coarse:after:-inset-y-2',
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-primary text-white shadow-button-primary enabled:hover:bg-brand-primary-hover disabled:bg-grayscale-20 disabled:shadow-none',
  secondary:
    'bg-white text-ink-strong shadow-control enabled:hover:bg-canvas enabled:hover:shadow-control-hover disabled:text-ink-placeholder disabled:shadow-field',
  destructive: 'bg-danger text-white shadow-button-primary enabled:hover:bg-danger-hover',
  'invisible-simple':
    'font-normal! text-ink-strong enabled:hover:bg-hover enabled:active:bg-pressed disabled:text-ink-placeholder',
  icon: 'text-ink-subtle enabled:hover:bg-hover enabled:hover:text-ink enabled:active:bg-pressed disabled:text-ink-placeholder',
};

const ICON_SIZES: Record<ButtonSize, string> = {
  default: 'size-8 after:absolute after:-inset-1 pointer-coarse:after:-inset-1.5',
  small: 'size-6 after:absolute after:-inset-2 pointer-coarse:after:-inset-2.5',
};

@Directive({
  selector: 'button[appButton]',
  host: { '[class]': 'classes()' },
})
export class ButtonDirective {
  readonly appButton = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('default');

  protected readonly classes = computed(() => {
    const variant = this.appButton();
    const size = variant === 'icon' ? ICON_SIZES[this.size()] : SIZES[this.size()];
    return `${BASE} ${size} ${VARIANTS[variant]}`;
  });
}
