import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type ApiDocumentType =
  | 'POLIZA_SEGURO'
  | 'NOTA_MEDICA'
  | 'CONSENTIMIENTO_INFORMADO'
  | 'EXAMEN_PREOP'
  | 'OTRO';

export interface ApiDocument {
  id: string;
  document_type: ApiDocumentType;
  notes?: string | null;
  patient_id?: string | null;
  surgery_id?: string | null;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  uploaded_by_user_id: string;
  uploaded_at: string;
}

interface PaginatedDocuments {
  items: ApiDocument[];
  total: number;
  page: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  constructor(private http: HttpClient) {}

  list(page = 1, size = 100): Observable<PaginatedDocuments> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<PaginatedDocuments>('/api/documents/', { params });
  }

  upload(data: {
    file: File;
    documentType: ApiDocumentType;
    patientId?: string;
    surgeryId?: string;
    notes?: string;
  }): Observable<ApiDocument> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('document_type', data.documentType);
    if (data.patientId) formData.append('patient_id', data.patientId);
    if (data.surgeryId) formData.append('surgery_id', data.surgeryId);
    if (data.notes) formData.append('notes', data.notes);

    return this.http.post<ApiDocument>('/api/documents/upload', formData);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/documents/${id}`);
  }

  download(id: string): Observable<Blob> {
    return this.http.get(`/api/documents/${id}/download`, { responseType: 'blob' });
  }
}
