import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class SettingsComponent {

  activeTab = signal<'general' | 'security' | 'notifications' | 'system'>('general');

  saved = signal(false);

  // General settings
  hospitalName    = signal('Hospital SurgicalOS');
  hospitalAddress = signal('');
  hospitalPhone   = signal('');
  hospitalEmail   = signal('');
  timezone        = signal('America/Costa_Rica');

  // Security settings
  sessionTimeout      = signal('60');
  maxLoginAttempts    = signal('5');
  requireTwoFactor    = signal(false);
  passwordMinLength   = signal('8');
  passwordExpireDays  = signal('90');

  // Notification settings
  notifyNewSurgery    = signal(true);
  notifyStatusChange  = signal(true);
  notifyNewDocument   = signal(false);
  notifyNewUser       = signal(true);
  emailNotifications  = signal(true);

  // System
  appVersion  = '1.0.0';
  buildDate   = 'I Semestre 2026';
  institution = 'Instituto Tecnológico de Costa Rica';
  course      = 'CE-1115 Seguridad de la Información';
  professor   = 'MSc. Andrés Vargas Rivera';

  tabs = [
    { key: 'general',       label: 'General',        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { key: 'security',      label: 'Seguridad',       icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { key: 'notifications', label: 'Notificaciones',  icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { key: 'system',        label: 'Sistema',         icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v10m0 0h10M9 13H5a2 2 0 00-2 2v4a2 2 0 002 2h4m0-6v6m0 0h10a2 2 0 002-2v-4a2 2 0 00-2-2H13' },
  ];

  saveSettings() {
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2500);
  }
}