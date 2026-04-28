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

  list(
    page = 1,
    size = 100,
    filters?: {
      date_from?: string;
      date_to?: string;
      status?: ApiSurgeryStatus;
      surgery_type?: string;
      patient_id?: string;
      surgeon_id?: string;
      anesthesiologist_id?: string;
    }
  ): Observable<PaginatedSurgeries> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value) {
          params = params.set(key, value);
        }
      }
    }

    return this.http.get<PaginatedSurgeries>('/api/surgeries/', { params });
  }

  getCalendarData(month: number, year: number): Observable<ApiSurgery[]> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    const pad = (value: number) => value.toString().padStart(2, '0');
    const format = (date: Date) =>
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

    return new Observable<ApiSurgery[]>(subscriber => {
      this.list(1, 100, {
        date_from: format(start),
        date_to: format(end),
      }).subscribe({
        next: response => {
          subscriber.next(response.items);
          subscriber.complete();
        },
        error: error => subscriber.error(error),
      });
    });
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
