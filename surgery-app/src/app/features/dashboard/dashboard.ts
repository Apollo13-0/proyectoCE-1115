import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface StatCard {
  label: string;
  value: string;
  sub: string;
  icon: string;
  color: string;
}

interface RecentSurgery {
  id: number;
  title: string;
  patient: string;
  surgeon: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {

  userRole  = localStorage.getItem('user_role')  ?? 'admin';
  userEmail = localStorage.getItem('user_email') ?? '';

  greeting = this.getGreeting();

  private getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  today = new Date();

  // Stats — vacías hasta conectar al backend
  stats: StatCard[] = [
    { label: 'Cirugías hoy',       value: '—', sub: 'Pendiente de API', icon: 'surgeries', color: 'navy'  },
    { label: 'Pacientes activos',  value: '—', sub: 'Pendiente de API', icon: 'patients',  color: 'teal'  },
    { label: 'Equipo disponible',  value: '—', sub: 'Pendiente de API', icon: 'team',      color: 'sky'   },
    { label: 'Docs. pendientes',   value: '—', sub: 'Pendiente de API', icon: 'docs',      color: 'beige' },
  ];

  // Recent surgeries — vacías hasta conectar al backend
  recentSurgeries: RecentSurgery[] = [];

  // SVG icon paths
  icons: Record<string, string> = {
    surgeries: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    patients:  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    team:      'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    docs:      'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    calendar:  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    arrow:     'M17 8l4 4m0 0l-4 4m4-4H3',
    plus:      'M12 5v14M5 12h14',
  };

  statusLabel: Record<string, string> = {
    'scheduled':   'Programada',
    'in-progress': 'En curso',
    'completed':   'Completada',
    'cancelled':   'Cancelada',
  };

  quickLinks = [
    { label: 'Nueva cirugía',    route: '/surgeries',  icon: 'surgeries' },
    { label: 'Ver calendario',   route: '/calendar',   icon: 'calendar'  },
    { label: 'Gestión pacientes',route: '/patients',   icon: 'patients'  },
    { label: 'Documentos',       route: '/documents',  icon: 'docs'      },
  ];
}