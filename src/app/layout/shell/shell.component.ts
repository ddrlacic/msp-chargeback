import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppHeaderComponent } from '../app-header/app-header.component';
import { AppSidebarComponent } from '../app-sidebar/app-sidebar.component';
import { ScenarioPanelComponent } from '../scenario-panel/scenario-panel.component';
import { ShellLayout } from './shell-layout.service';

@Component({
  selector: 'app-shell',
  imports: [AppHeaderComponent, AppSidebarComponent, RouterOutlet, ScenarioPanelComponent],
  providers: [ShellLayout],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.component.html',
  host: {
    class: 'block',
    '(document:keydown.escape)': 'layout.closeDrawer()',
  },
})
export class ShellComponent {
  protected readonly layout = inject(ShellLayout);
}
