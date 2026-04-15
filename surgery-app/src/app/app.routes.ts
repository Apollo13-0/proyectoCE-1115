import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell';

export const routes: Routes = [
  { path: '', redirectTo: 'calendar', pathMatch: 'full' },
  {
    path: '', component: ShellComponent,
    children: [
      {
        path: 'calendar',
        loadComponent: () => import('./features/calendar/calendar').then(m => m.CalendarComponent)
      }
    ]
  }
];