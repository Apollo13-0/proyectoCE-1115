import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.LoginComponent)
  },

  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/calendar/calendar').then(m => m.CalendarComponent)
      },
      {
        path: 'surgeries',
        loadComponent: () =>
          import('./features/surgeries/surgeries').then(m => m.SurgeriesComponent)
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./features/patients/patients').then(m => m.PatientsComponent)
      },
    ]
  },

  { path: '**', redirectTo: 'dashboard' }
];