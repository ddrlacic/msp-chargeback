import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { ShellLayout } from '../shell/shell-layout.service';
import { HEADER_COPY } from './app-header.constants';

@Component({
  selector: 'app-header',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-header.component.html',
})
export class AppHeaderComponent {
  protected readonly layout = inject(ShellLayout);

  protected readonly copy = HEADER_COPY;
}
