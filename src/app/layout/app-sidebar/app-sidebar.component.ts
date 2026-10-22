import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { filter, map } from 'rxjs';

import { ShellLayout } from '../shell/shell-layout.service';
import { SIDEBAR_COPY, SIDEBAR_ITEMS, SidebarItem } from './sidebar.constants';

const SIDEBAR_CLOSED =
  'invisible -translate-x-full [transition:translate_200ms_var(--ease-drawer),visibility_0s_linear_200ms] motion-reduce:[transition:none]';
const SIDEBAR_OPEN =
  'visible translate-x-0 [transition:translate_240ms_var(--ease-drawer),visibility_0s] motion-reduce:[transition:none]';

@Component({
  selector: 'app-sidebar',
  imports: [LucideAngularModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent {
  private readonly router = inject(Router);
  protected readonly layout = inject(ShellLayout);

  protected readonly items = SIDEBAR_ITEMS;
  protected readonly copy = SIDEBAR_COPY;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  private readonly openGroups = signal<ReadonlySet<string>>(
    new Set(
      SIDEBAR_ITEMS.filter((item) => this.hasActiveChild(item, this.router.url)).map(
        (item) => item.label,
      ),
    ),
  );

  protected readonly sidebarClasses = computed(() =>
    this.layout.sidebarOpen() ? SIDEBAR_OPEN : SIDEBAR_CLOSED,
  );

  protected isGroupOpen(item: SidebarItem): boolean {
    return this.openGroups().has(item.label);
  }

  protected isSectionActive(item: SidebarItem): boolean {
    return this.hasActiveChild(item, this.url());
  }

  protected toggleGroup(item: SidebarItem): void {
    this.openGroups.update((groups) => {
      const next = new Set(groups);
      if (next.has(item.label)) {
        next.delete(item.label);
      } else {
        next.add(item.label);
      }
      return next;
    });
  }

  private hasActiveChild(item: SidebarItem, url: string): boolean {
    return item.children?.some((child) => url.startsWith(child.path)) ?? false;
  }
}
