import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type ApiUserRole = 'ADMIN' | 'CIRUJANO' | 'ANESTESIOLOGO' | 'PACIENTE' | 'ASISTENTE';

export interface ApiAppUser {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  role: ApiUserRole;
  license_number?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PaginatedAppUsers {
  items: ApiAppUser[];
  total: number;
  page: number;
  size: number;
}

export interface AppUserPayload {
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  role: ApiUserRole;
  license_number?: string | null;
  is_active?: boolean;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  constructor(private http: HttpClient) {}

  list(page = 1, size = 100): Observable<PaginatedAppUsers> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<PaginatedAppUsers>('/api/users/', { params });
  }

  create(payload: AppUserPayload): Observable<ApiAppUser> {
    return this.http.post<ApiAppUser>('/api/users/', payload);
  }

  update(id: string, payload: Partial<AppUserPayload>): Observable<ApiAppUser> {
    return this.http.put<ApiAppUser>(`/api/users/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/users/${id}`);
  }
}
