import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

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
    { label: 'Administrador', email: 'admin@hospital.local',         password: 'Admin2026!',   role: 'admin',            icon: '⚙️' },
    { label: 'Cirujano',      email: 'laura.solis@hospital.local',      password: 'LauraSolis2026!', role: 'surgeon',          icon: '🔪' },
    { label: 'Anestesiólogo', email: 'diego.mora@hospital.local', password: 'DiegoMora2026!',   role: 'anesthesiologist', icon: '💉' },
    { label: 'Paciente',      email: 'carlos.rojas@correo.com',      password: 'CarlosRojas2026!', role: 'patient',          icon: '🏥' },
  ];

  private credentials: Record<string, { password: string; role: Role }> = {
    'admin@hospital.local':         { password: 'Admin2026!',   role: 'admin' },
    'laura.solis@hospital.local':      { password: 'LauraSolis2026!', role: 'surgeon' },
    'diego.mora@hospital.local': { password: 'DiegoMora2026!',   role: 'anesthesiologist' },
    'carlos.rojas@correo.com':      { password: 'CarlosRojas2026!', role: 'patient' },
  };

  constructor(private router: Router, private authService: AuthService) {}

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

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Correo o contraseña incorrectos.');
        console.error('Login error:', err);
      }
    });
  }
}