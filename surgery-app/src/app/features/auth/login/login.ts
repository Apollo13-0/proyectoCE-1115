import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

type Role = 'admin' | 'surgeon' | 'anesthesiologist' | 'patient';

interface DemoUser {
  label: string;
  email: string;
  password: string;
  role: Role;
  icon: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  email    = '';
  password = '';
  loading  = signal(false);
  error    = signal('');
  showPass = signal(false);
  cookieAccepted = signal(!!localStorage.getItem('cookies_accepted'));

  demoUsers: DemoUser[] = [
    { label: 'Administrador', email: 'admin@surgical.cr',         password: 'Admin1234!',   role: 'admin',            icon: '⚙️' },
    { label: 'Cirujano',      email: 'cirujano@surgical.cr',      password: 'Surgeon1234!', role: 'surgeon',          icon: '🔪' },
    { label: 'Anestesiólogo', email: 'anestesiologo@surgical.cr', password: 'Anest1234!',   role: 'anesthesiologist', icon: '💉' },
    { label: 'Paciente',      email: 'paciente@surgical.cr',      password: 'Patient1234!', role: 'patient',          icon: '🏥' },
  ];

  private credentials: Record<string, { password: string; role: Role }> = {
    'admin@surgical.cr':         { password: 'Admin1234!',   role: 'admin' },
    'cirujano@surgical.cr':      { password: 'Surgeon1234!', role: 'surgeon' },
    'anestesiologo@surgical.cr': { password: 'Anest1234!',   role: 'anesthesiologist' },
    'paciente@surgical.cr':      { password: 'Patient1234!', role: 'patient' },
  };

  constructor(private router: Router) {}

  acceptCookies(): void {
    localStorage.setItem('cookies_accepted', 'true');
    this.cookieAccepted.set(true);
  }

  declineCookies(): void {
    this.cookieAccepted.set(true);
  }

  fillDemo(user: DemoUser): void {
    this.email    = user.email;
    this.password = user.password;
    this.error.set('');
  }

  async onSubmit(): Promise<void> {
    this.error.set('');

    if (!this.email || !this.password) {
      this.error.set('Por favor ingrese su correo y contraseña.');
      return;
    }

    this.loading.set(true);
    await new Promise(r => setTimeout(r, 900));

    const match = this.credentials[this.email.toLowerCase().trim()];

    if (!match || match.password !== this.password) {
      this.error.set('Correo o contraseña incorrectos.');
      this.loading.set(false);
      return;
    }

    localStorage.setItem('user_role',  match.role);
    localStorage.setItem('user_email', this.email);
    this.loading.set(false);
    this.router.navigate(['/dashboard']);
  }
}