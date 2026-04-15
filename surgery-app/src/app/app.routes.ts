import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },

  {
    path: 'politica-cookies',
    loadComponent: () => import('./features/policies/cookie-policy/cookie-policy').then(m => m.CookiePolicyComponent)
  },

  {
    path: 'politicas',
    loadComponent: () => import('./features/policies/security-policy/security-policy').then(m => m.SecurityPolicyComponent)
  },

  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'calendar',
        loadComponent: () => import('./features/calendar/calendar').then(m => m.CalendarComponent)
      },
      {
        path: 'surgeries',
        loadComponent: () => import('./features/surgeries/surgeries').then(m => m.SurgeriesComponent)
      },
      {
        path: 'patients',
        loadComponent: () => import('./features/patients/patients').then(m => m.PatientsComponent)
      },
      {
        path: 'team',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () => import('./features/team/team').then(m => m.TeamComponent)
      },
      {
        path: 'documents',
        loadComponent: () => import('./features/documents/documents').then(m => m.DocumentsComponent)
      },
      {
        path: 'users',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () => import('./features/users/users').then(m => m.UsersComponent)
      },
      {
        path: 'settings',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () => import('./features/settings/settings').then(m => m.SettingsComponent)
      },
    ]
  },

  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then(m => m.NotFoundComponent)
  }
];