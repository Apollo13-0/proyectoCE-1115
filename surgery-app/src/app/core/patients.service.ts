import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ApiPatient {
  id: string;
  user_id?: string | null;
  first_name: string;
  last_name: string;
  birth_date: string;
  sex?: string | null;
  identity_document?: string | null;
  insurance_provider?: string | null;
  insurance_policy_number?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  medical_notes?: string | null;
  created_at?: string;
}

export interface PaginatedPatients {
  items: ApiPatient[];
  total: number;
  page: number;
  size: number;
}

export interface PatientPayload {
  first_name: string;
  last_name: string;
  birth_date: string;
  sex?: string | null;
  identity_document?: string | null;
  insurance_provider?: string | null;
  insurance_policy_number?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  medical_notes?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PatientsService {
  constructor(private http: HttpClient) {}

  list(page = 1, size = 100): Observable<PaginatedPatients> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<PaginatedPatients>('/api/patients/', { params });
  }

  create(payload: PatientPayload): Observable<ApiPatient> {
    return this.http.post<ApiPatient>('/api/patients/', payload);
  }

  update(id: string, payload: Partial<PatientPayload>): Observable<ApiPatient> {
    return this.http.put<ApiPatient>(`/api/patients/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/patients/${id}`);
  }
}
