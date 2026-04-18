import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type ApiSurgeryStatus =
  | 'SOLICITADA'
  | 'PENDIENTE_VALIDACION'
  | 'PROGRAMADA'
  | 'EN_CURSO'
  | 'COMPLETADA'
  | 'CANCELADA';

export interface ApiSurgery {
  id: string;
  patient_id: string;
  lead_surgeon_id: string;
  anesthesiologist_id: string;
  surgery_type: string;
  status: ApiSurgeryStatus;
  scheduled_start: string;
  scheduled_end: string;
  operating_room?: string | null;
  preop_notes?: string | null;
  postop_notes?: string | null;
  created_at: string;
  patient_name?: string | null;
  surgeon_name?: string | null;
  anesthesiologist_name?: string | null;
  assistants: { id: string; name: string; role: string }[];
}

export interface PaginatedSurgeries {
  items: ApiSurgery[];
  total: number;
  page: number;
  size: number;
}

export interface SurgeryPayload {
  patient_id: string;
  lead_surgeon_id: string;
  anesthesiologist_id: string;
  surgery_type: string;
  scheduled_start: string;
  scheduled_end: string;
  operating_room?: string | null;
  preop_notes?: string | null;
  postop_notes?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SurgeriesService {
  constructor(private http: HttpClient) {}

  list(page = 1, size = 100): Observable<PaginatedSurgeries> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<PaginatedSurgeries>('/api/surgeries/', { params });
  }

  getById(id: string): Observable<ApiSurgery> {
    return this.http.get<ApiSurgery>(`/api/surgeries/${id}`);
  }

  updateStatus(id: string, status: ApiSurgeryStatus): Observable<ApiSurgery> {
    return this.http.patch<ApiSurgery>(`/api/surgeries/${id}/status`, { status });
  }

  create(payload: SurgeryPayload): Observable<ApiSurgery> {
    return this.http.post<ApiSurgery>('/api/surgeries/', payload);
  }

  update(id: string, payload: Partial<SurgeryPayload> & { status?: ApiSurgeryStatus }): Observable<ApiSurgery> {
    return this.http.put<ApiSurgery>(`/api/surgeries/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/surgeries/${id}`);
  }
}
