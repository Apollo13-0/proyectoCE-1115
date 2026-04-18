import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Router } from '@angular/router';

type LoginResponse = string | {
  access_token?: string;
  token?: string;
};

interface TokenPayload {
  id?: string;
  sub?: string;
  role?: string;
  exp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly ROLE_KEY = 'user_role';
  private readonly EMAIL_KEY = 'user_email';
  private readonly USER_ID_KEY = 'user_id';

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      map(response => {
        const token = typeof response === 'string'
          ? response
          : response.access_token ?? response.token;

        if (!token) {
          throw new Error('Login response did not include a token.');
        }

        localStorage.setItem(this.TOKEN_KEY, token);
        this.storeSessionData(token);
        return response;
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.EMAIL_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const payload = this.decodeToken(token);
    return !!payload?.exp && payload.exp * 1000 > Date.now();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRole(): string {
    return localStorage.getItem(this.ROLE_KEY) ?? '';
  }

  getEmail(): string {
    return localStorage.getItem(this.EMAIL_KEY) ?? '';
  }

  getUserId(): string {
    return localStorage.getItem(this.USER_ID_KEY) ?? '';
  }

  private storeSessionData(token: string): void {
    const payload = this.decodeToken(token);
    const role = this.normalizeRole(payload?.role);

    if (payload?.sub) {
      localStorage.setItem(this.EMAIL_KEY, payload.sub);
    }

    if (payload?.id) {
      localStorage.setItem(this.USER_ID_KEY, payload.id);
    }

    if (role) {
      localStorage.setItem(this.ROLE_KEY, role);
    }
  }

  private decodeToken(token: string): TokenPayload | null {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map(char => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private normalizeRole(role?: string): string {
    const roles: Record<string, string> = {
      ADMIN: 'admin',
      CIRUJANO: 'surgeon',
      ANESTESIOLOGO: 'anesthesiologist',
      PACIENTE: 'patient',
      ASISTENTE: 'assistant',
    };

    return role ? roles[role] ?? role.toLowerCase() : '';
  }
}
