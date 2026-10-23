import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { ButtonDirective } from '../../shared/components/button/button.directive';
import { ShellLayout } from '../shell/shell-layout.service';
import { SCENARIO_PANEL_ID } from '../scenario-panel/scenario-panel.constants';
import { HEADER_COPY } from './app-header.constants';

@Component({
  selector: 'app-header',
  imports: [ButtonDirective, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-header.component.html',
})
export class AppHeaderComponent {
  protected readonly layout = inject(ShellLayout);

  protected readonly copy = HEADER_COPY;
  protected readonly scenarioPanelId = SCENARIO_PANEL_ID;
}
