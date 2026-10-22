import { ActivatedRouteSnapshot, Routes } from '@angular/router';

import { CHARGEBACKS_CONSTANTS } from './features/chargebacks/chargebacks.constants';
import { getPlaceholderLinks } from './layout/app-sidebar/sidebar.constants';
import { ShellComponent } from './layout/shell/shell.component';

const placeholderRoutes: Routes = getPlaceholderLinks().map((link) => ({
  path: link.path.slice(1),
  title: link.label,
  data: { pageTitle: link.label },
  loadComponent: () =>
    import('./layout/placeholder-page/placeholder-page.component').then(
      (m) => m.PlaceholderPageComponent,
    ),
}));

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'chargebacks' },
      {
        path: 'chargebacks',
        title: CHARGEBACKS_CONSTANTS.LIST.TITLE,
        loadComponent: () =>
          import('./features/chargebacks/chargebacks.component').then(
            (m) => m.ChargebacksComponent,
          ),
      },
      {
        path: 'chargebacks/:caseId',
        title: (route: ActivatedRouteSnapshot) =>
          CHARGEBACKS_CONSTANTS.CASE.TITLE(route.paramMap.get('caseId') ?? ''),
        loadComponent: () =>
          import('./features/chargebacks/chargeback-case/chargeback-case.component').then(
            (m) => m.ChargebackCaseComponent,
          ),
      },
      ...placeholderRoutes,
    ],
  },
  { path: '**', redirectTo: '' },
];
