import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Chargebacks',
    loadComponent: () =>
      import('./features/chargebacks/chargebacks.component').then((m) => m.ChargebacksComponent),
  },
  { path: '**', redirectTo: '' },
];
