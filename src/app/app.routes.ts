import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './guards/auth.guard';
import { ShellComponent } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'resumo-sprints',
        loadComponent: () =>
          import('./pages/resumo-sprints/resumo-sprints').then((m) => m.ResumoSprintsComponent),
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
        path: 'tarefas-em-risco',
        loadComponent: () =>
          import('./pages/tarefas-em-risco/tarefas-em-risco').then(
            (m) => m.TarefasEmRiscoComponent,
          ),
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
        redirectTo: '/bizagi',
      },
      {
        path: 'power-bi',
        loadComponent: () => import('./pages/power-bi/power-bi').then((m) => m.PowerBiComponent),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: '', redirectTo: 'projetos', pathMatch: 'full' },
          {
            path: 'projetos',
            loadComponent: () =>
              import('./pages/admin-projetos/admin-projetos').then((m) => m.AdminProjetosComponent),
          },
          {
            path: 'atividades',
            loadComponent: () =>
              import('./pages/admin-atividades/admin-atividades').then(
                (m) => m.AdminAtividadesComponent,
              ),
          },
          {
            path: 'sprints',
            loadComponent: () =>
              import('./pages/admin-sprints/admin-sprints').then((m) => m.AdminSprintsComponent),
          },
          {
            path: 'proxima-sprint',
            loadComponent: () =>
              import('./pages/admin-proxima-sprint/admin-proxima-sprint').then(
                (m) => m.AdminProximaSprintComponent,
              ),
          },
          {
            path: 'fluxos',
            loadComponent: () =>
              import('./pages/admin-fluxos/admin-fluxos').then((m) => m.AdminFluxosComponent),
          },
          {
            path: 'pendencias',
            loadComponent: () =>
              import('./pages/admin-pendencias/admin-pendencias').then(
                (m) => m.AdminPendenciasComponent,
              ),
          },
          {
            path: 'tarefas-em-risco',
            loadComponent: () =>
              import('./pages/admin-impactos/admin-impactos').then(
                (m) => m.AdminImpactosComponent,
              ),
          },
          {
            path: 'riscos',
            loadComponent: () =>
              import('./pages/admin-riscos/admin-riscos').then((m) => m.AdminRiscosComponent),
          },
          {
            path: 'projetos/:id/atividades',
            redirectTo: ({ params }) =>
              inject(Router).createUrlTree(['/admin/atividades'], {
                queryParams: { projeto: params['id'] },
              }),
          },
          { path: 'importacoes', redirectTo: 'projetos' },
          {
            path: 'usuarios',
            loadComponent: () =>
              import('./pages/admin-usuarios/admin-usuarios').then((m) => m.AdminUsuariosComponent),
          },
          {
            path: 'acessos',
            loadComponent: () =>
              import('./pages/admin-acessos/admin-acessos').then((m) => m.AdminAcessosComponent),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
