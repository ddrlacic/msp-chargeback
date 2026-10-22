import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

export interface PageBreadcrumb {
  readonly label: string;
  readonly link?: string;
}

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
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly breadcrumbs = input<readonly PageBreadcrumb[]>([]);

  protected readonly titleId = `page-title-${nextPageId++}`;
}
