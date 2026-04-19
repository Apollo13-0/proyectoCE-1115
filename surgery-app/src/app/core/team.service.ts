import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

export type CatalogRole = 'surgeon' | 'anesthesiologist' | 'assistant';

export interface ApiUser {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  role: 'CIRUJANO' | 'ANESTESIOLOGO' | 'ASISTENTE';
  license_number?: string | null;
  is_active: boolean;
  created_at: string;
}

interface PaginatedUsers {
  items: ApiUser[];
  total: number;
  page: number;
  size: number;
}

export interface TeamPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  license_number?: string | null;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private endpoints: Record<CatalogRole, string> = {
    surgeon: 'surgeons',
    anesthesiologist: 'anesthesiologists',
    assistant: 'assistants',
  };

  constructor(private http: HttpClient) {}

  listAll(): Observable<ApiUser[]> {
    return forkJoin([
      this.listByRole('surgeon'),
      this.listByRole('anesthesiologist'),
      this.listByRole('assistant'),
    ]).pipe(map(groups => groups.flat()));
  }

  create(role: CatalogRole, payload: TeamPayload): Observable<ApiUser> {
    return this.http.post<ApiUser>(`/api/users/${this.endpoints[role]}`, payload);
  }

  update(role: CatalogRole, id: string, payload: Partial<TeamPayload>): Observable<ApiUser> {
    return this.http.put<ApiUser>(`/api/users/${this.endpoints[role]}/${id}`, payload);
  }

  delete(role: CatalogRole, id: string): Observable<void> {
    return this.http.delete<void>(`/api/users/${this.endpoints[role]}/${id}`);
  }

  private listByRole(role: CatalogRole): Observable<ApiUser[]> {
    const params = new HttpParams().set('page', 1).set('size', 100);
    return this.http
      .get<PaginatedUsers>(`/api/users/${this.endpoints[role]}`, { params })
      .pipe(map(response => response.items));
  }
}
