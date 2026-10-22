import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

@Injectable()
export class ShellLayout {
  private readonly window = inject(DOCUMENT).defaultView;

  private readonly desktop = signal(true);
  private readonly desktopSidebarOpen = signal(true);

  readonly drawerOpen = signal(false);
  readonly isDesktop = this.desktop.asReadonly();
  readonly sidebarOpen = computed(() =>
    this.desktop() ? this.desktopSidebarOpen() : this.drawerOpen(),
  );

  constructor() {
    const query = this.window?.matchMedia?.(DESKTOP_MEDIA_QUERY);
    if (!query) {
      return;
    }
    this.desktop.set(query.matches);
    const onChange = (event: MediaQueryListEvent) => {
      this.desktop.set(event.matches);
      if (event.matches) {
        this.drawerOpen.set(false);
      }
    };
    query.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', onChange));
  }

  toggleSidebar(): void {
    if (this.desktop()) {
      this.desktopSidebarOpen.update((open) => !open);
      return;
    }
    this.drawerOpen.update((open) => !open);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }
}
