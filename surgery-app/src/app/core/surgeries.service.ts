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

export interface SurgeryDocument {
  id: string;
  file_name: string;
  document_type: string;
  file_size_bytes: number;
  uploaded_at: string;
  notes?: string;
}

export interface DropdownOption {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class SurgeriesService {
  constructor(private http: HttpClient) {}

  // Dropdown lists
  getPatients(): Observable<DropdownOption[]> {
    return this.http.get<DropdownOption[]>('/api/patients/dropdown');
  }

  getSurgeons(): Observable<DropdownOption[]> {
    return this.http.get<DropdownOption[]>('/api/users/surgeons/dropdown');
  }

  getAnesthesiologists(): Observable<DropdownOption[]> {
    return this.http.get<DropdownOption[]>('/api/users/anesthesiologists/dropdown');
  }

  getAssistants(): Observable<DropdownOption[]> {
    return this.http.get<DropdownOption[]>('/api/users/assistants/dropdown');
  }

  getSurgeryTypes(): Observable<DropdownOption[]> {
    return this.http.get<DropdownOption[]>('/api/surgeries/types');
  }

  // Surgery operations
  list(page = 1, size = 100): Observable<PaginatedSurgeries> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<PaginatedSurgeries>('/api/surgeries/', { params });
  }

  getCalendarData(month: number, year: number): Observable<ApiSurgery[]> {
    const params = new HttpParams()
      .set('month', month)
      .set('year', year);

    return this.http.get<ApiSurgery[]>('/api/surgeries/calendar', { params });
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

  uploadDocuments(surgeryId: string, files: File[]): Observable<any[]> {
    return new Observable(observer => {
      const uploadPromises = files.map(file => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('surgery_id', surgeryId);
        formData.append('document_type', 'DOCUMENTO_CIRUGIA');
        return this.http.post<any>('/api/documents/upload', formData).toPromise();
      });

      Promise.all(uploadPromises)
        .then(results => {
          observer.next(results);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  assignAssistants(surgeryId: string, assistantIds: string[]): Observable<any> {
    return this.http.post(`/api/surgeries/${surgeryId}/assistants`, { assistant_ids: assistantIds });
  }

  getSurgeryDocuments(surgeryId: string): Observable<SurgeryDocument[]> {
    return this.http.get<SurgeryDocument[]>(`/api/surgeries/${surgeryId}/documents`);
  }

  downloadDocument(docId: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = `/api/documents/${docId}/download`;
    link.download = fileName;
    link.click();
  }
}
