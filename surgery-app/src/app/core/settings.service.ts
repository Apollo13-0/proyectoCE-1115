import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface AppSettings {
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalEmail: string;
  timezone: string;
  sessionTimeout: string;
  maxLoginAttempts: string;
  requireTwoFactor: boolean;
  passwordMinLength: string;
  passwordExpireDays: string;
  notifyNewSurgery: boolean;
  notifyStatusChange: boolean;
  notifyNewDocument: boolean;
  notifyNewUser: boolean;
  emailNotifications: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  constructor(private http: HttpClient) {}

  get(): Observable<AppSettings> {
    return this.http.get<AppSettings>('/api/settings/');
  }

  update(settings: AppSettings): Observable<AppSettings> {
    return this.http.put<AppSettings>('/api/settings/', settings);
  }
}
