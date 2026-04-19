import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

type Role = 'admin' | 'surgeon' | 'anesthesiologist' | 'patient' | 'assistant';

interface StatCard {
  label: string;
  value: string;
  sub: string;
  icon: string;
  color: string;
  roles: Role[];
}

interface RecentSurgery {
  id: number;
  title: string;
  patient: string;
  surgeon: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

interface QuickLink {
  label: string;
  route: string;
  icon: string;
  roles: Role[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {
  userRole = (localStorage.getItem('user_role') ?? 'patient') as Role;
  userEmail = localStorage.getItem('user_email') ?? '';
  greeting = this.getGreeting();
  today = new Date();

  stats: StatCard[] = [
    { label: 'Cirugias hoy', value: '-', sub: 'Todas las salas', icon: 'surgeries', color: 'navy', roles: ['admin'] },
    { label: 'Mis cirugias', value: '-', sub: 'Agenda asignada', icon: 'surgeries', color: 'navy', roles: ['surgeon', 'anesthesiologist', 'assistant'] },
    { label: 'Mis solicitudes', value: '-', sub: 'Estado de atencion', icon: 'calendar', color: 'navy', roles: ['patient'] },
    { label: 'Pacientes activos', value: '-', sub: 'Segun permisos', icon: 'patients', color: 'teal', roles: ['admin', 'surgeon'] },
    { label: 'Equipo disponible', value: '-', sub: 'Catalogo medico', icon: 'team', color: 'sky', roles: ['admin'] },
    { label: 'Documentos', value: '-', sub: 'Acceso autorizado', icon: 'docs', color: 'beige', roles: ['admin', 'surgeon', 'anesthesiologist', 'patient', 'assistant'] },
  ];

  recentSurgeries: RecentSurgery[] = [];

  icons: Record<string, string> = {
    surgeries: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    patients: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    team: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    docs: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    arrow: 'M17 8l4 4m0 0l-4 4m4-4H3',
    plus: 'M12 5v14M5 12h14',
  };

  statusLabel: Record<string, string> = {
    scheduled: 'Programada',
    'in-progress': 'En curso',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };

  quickLinks: QuickLink[] = [
    { label: 'Nueva cirugia', route: '/surgeries', icon: 'surgeries', roles: ['admin', 'surgeon'] },
    { label: 'Mis cirugias', route: '/surgeries', icon: 'surgeries', roles: ['anesthesiologist', 'patient', 'assistant'] },
    { label: 'Ver calendario', route: '/calendar', icon: 'calendar', roles: ['admin', 'surgeon', 'anesthesiologist', 'patient', 'assistant'] },
    { label: 'Gestion pacientes', route: '/patients', icon: 'patients', roles: ['admin', 'surgeon'] },
    { label: 'Equipo medico', route: '/team', icon: 'team', roles: ['admin'] },
    { label: 'Documentos', route: '/documents', icon: 'docs', roles: ['admin', 'surgeon', 'anesthesiologist', 'patient', 'assistant'] },
  ];

  roleLabel: Record<Role, string> = {
    admin: 'Administrador',
    surgeon: 'Cirujano',
    anesthesiologist: 'Anestesiologo',
    patient: 'Paciente',
    assistant: 'Asistente',
  };

  dashboardCopy: Record<Role, { title: string; subtitle: string; empty: string }> = {
    admin: {
      title: 'Resumen institucional',
      subtitle: 'Vista general de cirugias, pacientes, equipo y documentos',
      empty: 'La actividad institucional aparecera aqui cuando se conecten los datos del backend',
    },
    surgeon: {
      title: 'Mis cirugias recientes',
      subtitle: 'Procedimientos donde participa como cirujano principal',
      empty: 'Sus cirugias asignadas apareceran aqui',
    },
    anesthesiologist: {
      title: 'Mis cirugias recientes',
      subtitle: 'Procedimientos donde participa como anestesiologo',
      empty: 'Sus cirugias asignadas apareceran aqui',
    },
    patient: {
      title: 'Mi atencion quirurgica',
      subtitle: 'Solicitudes, documentos y cirugias asociadas a su expediente',
      empty: 'Su informacion quirurgica aparecera aqui',
    },
    assistant: {
      title: 'Mis cirugias recientes',
      subtitle: 'Procedimientos donde participa como asistente',
      empty: 'Sus cirugias asignadas apareceran aqui',
    },
  };

  private getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos dias';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  get displayName(): string {
    return this.userEmail ? this.userEmail.split('@')[0] : this.roleLabel[this.userRole];
  }

  get visibleStats(): StatCard[] {
    return this.stats.filter(stat => stat.roles.includes(this.userRole));
  }

  get visibleQuickLinks(): QuickLink[] {
    return this.quickLinks.filter(link => link.roles.includes(this.userRole));
  }

  get canCreateSurgery(): boolean {
    return ['admin', 'surgeon'].includes(this.userRole);
  }

  get detailRoute(): string {
    return '/surgeries';
  }

  get copy() {
    return this.dashboardCopy[this.userRole];
  }
}
