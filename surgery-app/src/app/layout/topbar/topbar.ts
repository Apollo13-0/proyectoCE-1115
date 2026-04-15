import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';

interface Breadcrumb { label: string; route?: string; }

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css'
})
export class TopbarComponent {

  pageTitle   = 'Dashboard';
  breadcrumbs: Breadcrumb[] = [];
  today = new Date();

  userRole  = localStorage.getItem('user_role')  ?? 'admin';
  userEmail = localStorage.getItem('user_email') ?? 'admin@surgical.cr';

  userInitials = computed(() => {
    const parts = this.userEmail.split('@')[0].split('.');
    return parts.map((p: string) => p[0].toUpperCase()).join('').slice(0, 2);
  });

  roleLabel: Record<string, string> = {
    admin:            'Administrador',
    surgeon:          'Cirujano',
    anesthesiologist: 'Anestesiólogo',
    patient:          'Paciente',
  };

  routeTitles: Record<string, string> = {
    '/dashboard':  'Dashboard',
    '/calendar':   'Calendario',
    '/surgeries':  'Cirugías',
    '/patients':   'Pacientes',
    '/team':       'Equipo médico',
    '/documents':  'Documentos',
    '/users':      'Usuarios',
    '/settings':   'Configuración',
  };

  showNotifications = false;

  notifications = [
    { text: 'Cirugía #1042 programada para mañana',  time: 'hace 5 min',  unread: true  },
    { text: 'Dr. Mora confirmó disponibilidad',       time: 'hace 18 min', unread: true  },
    { text: 'Nuevo paciente registrado: Juan Pérez',  time: 'hace 1h',     unread: false },
  ];

  get unreadCount() {
    return this.notifications.filter(n => n.unread).length;
  }

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.pageTitle = this.routeTitles[e.urlAfterRedirects] ?? 'SurgicalOS';
        this.buildBreadcrumbs(e.urlAfterRedirects);
      });

    // Set initial title
    const current = this.router.url;
    this.pageTitle = this.routeTitles[current] ?? 'Dashboard';
    this.buildBreadcrumbs(current);
  }

  buildBreadcrumbs(url: string) {
    this.breadcrumbs = [
      { label: 'Inicio', route: '/dashboard' },
      { label: this.routeTitles[url] ?? '' }
    ].filter(b => b.label);
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  markAllRead() {
    this.notifications.forEach(n => n.unread = false);
  }
}