import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'entregues',
        loadComponent: () =>
          import('./pages/entregues/entregues').then((m) => m.EntreguesComponent),
      },
      {
        path: 'proxima-sprint',
        loadComponent: () =>
          import('./pages/proxima-sprint/proxima-sprint').then((m) => m.ProximaSprintComponent),
      },
      {
        path: 'pendencias',
        loadComponent: () =>
          import('./pages/pendencias/pendencias').then((m) => m.PendenciasComponent),
      },
      {
        path: 'riscos',
        loadComponent: () => import('./pages/riscos/riscos').then((m) => m.RiscosComponent),
      },
      {
        path: 'evolucao',
        redirectTo: '',
        pathMatch: 'full',
      },
      {
        path: 'bizagi',
        loadComponent: () => import('./pages/bizagi/bizagi').then((m) => m.BizagiComponent),
      },
      {
        path: 'bizagi/:id',
        loadComponent: () => import('./pages/bizagi/bizagi').then((m) => m.BizagiComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
