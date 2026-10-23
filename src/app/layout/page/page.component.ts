import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

export interface PageBreadcrumb {
  readonly label: string;
  readonly link?: string;
}

const COMPACT_AFTER = 8;

const PAGE_COPY = {
  BACK: (label: string) => `Back to ${label}`,
} as const;

let nextPageId = 0;

@Component({
  selector: 'app-page',
  imports: [LucideAngularModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page.component.html',
  host: {
    class: 'flex min-h-0 flex-1 flex-col p-2 sm:p-4',
  },
})
export class PageComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly breadcrumbs = input<readonly PageBreadcrumb[]>([]);

  private readonly header = viewChild.required<ElementRef<HTMLElement>>('header');
  private readonly content = viewChild.required<ElementRef<HTMLElement>>('content');
  private readonly scrollTops = new WeakMap<Element, number>();

  protected readonly titleId = `page-title-${nextPageId++}`;
  protected readonly compact = signal(false);
  protected readonly copy = PAGE_COPY;
  protected readonly hasBreadcrumbs = computed(() => this.breadcrumbs().length > 0);
  protected readonly parent = computed(() =>
    this.breadcrumbs()
      .slice(0, -1)
      .reverse()
      .find((crumb) => crumb.link !== undefined),
  );
  protected readonly slim = computed(() => this.hasBreadcrumbs() || this.compact());

  constructor() {
    afterNextRender(() => {
      const content = this.content().nativeElement;
      const onScroll = (event: Event) => {
        if (event.target instanceof Element) {
          this.updateCompact(event.target);
        }
      };
      content.addEventListener('scroll', onScroll, { capture: true, passive: true });
      this.destroyRef.onDestroy(() =>
        content.removeEventListener('scroll', onScroll, { capture: true }),
      );
    });
  }

  private updateCompact(scroller: Element): void {
    const top = scroller.scrollTop;
    if (this.hasBreadcrumbs() || this.scrollTops.get(scroller) === top) {
      return;
    }
    this.scrollTops.set(scroller, top);
    if (top <= 0) {
      this.compact.set(false);
      return;
    }
    if (this.compact() || top <= COMPACT_AFTER) {
      return;
    }
    const overflow = scroller.scrollHeight - scroller.clientHeight;
    if (overflow > this.header().nativeElement.offsetHeight) {
      this.compact.set(true);
    }
  }
}
