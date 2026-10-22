import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { CHARGEBACKS_PATH } from '../app-sidebar/sidebar.constants';
import { PageComponent } from '../page/page.component';

export const PLACEHOLDER_COPY = {
  HEADING: 'This page is not in the prototype',
  MESSAGE: 'Chargebacks is the only working page',
  ACTION: 'Go to chargebacks',
} as const;

@Component({
  selector: 'app-placeholder-page',
  imports: [LucideAngularModule, PageComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './placeholder-page.component.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
})
export class PlaceholderPageComponent {
  readonly pageTitle = input.required<string>();

  protected readonly copy = PLACEHOLDER_COPY;
  protected readonly chargebacksPath = CHARGEBACKS_PATH;
}
