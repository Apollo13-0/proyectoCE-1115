import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ApiDocument, ApiDocumentType, DocumentsService } from '../../core/documents.service';
import { ApiPatient, PatientsService } from '../../core/patients.service';
import { ApiSurgery, SurgeriesService } from '../../core/surgeries.service';

export type DocType = ApiDocumentType;

export interface MedicalDocument {
  id?: string;
  name: string;
  type: DocType;
  patientId: string;
  surgeryId: string;
  uploadedBy: string;
  uploadedAt: Date;
  size: string;
  notes: string;
  status: 'available';
}

const emptyDoc = (): MedicalDocument => ({
  name: '', type: 'NOTA_MEDICA', patientId: '',
  surgeryId: '', uploadedBy: '', uploadedAt: new Date(),
  size: '', notes: '', status: 'available'
});

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './documents.html',
  styleUrl: './documents.css'
})
export class DocumentsComponent implements OnInit {
  documents = signal<MedicalDocument[]>([]);
  searchQuery = signal('');
  filterType = signal<DocType | 'all'>('all');
  showModal = signal(false);
  showDeleteModal = signal(false);
  deletingId = signal<string | null>(null);
  form = signal<MedicalDocument>(emptyDoc());
  dragOver = signal(false);
  selectedFile = signal<File | null>(null);
  loading = signal(false);
  error = signal('');
  userRole = '';
  userId = '';
  patients = signal<ApiPatient[]>([]);
  surgeries = signal<ApiSurgery[]>([]);

  typeOptions: { value: DocType; label: string; icon: string }[] = [
    { value: 'POLIZA_SEGURO', label: 'Poliza de seguro', icon: 'shield' },
    { value: 'NOTA_MEDICA', label: 'Nota medica', icon: 'note' },
    { value: 'CONSENTIMIENTO_INFORMADO', label: 'Consentimiento', icon: 'pen' },
    { value: 'EXAMEN_PREOP', label: 'Examen preoperatorio', icon: 'flask' },
    { value: 'OTRO', label: 'Otro', icon: 'file' },
  ];

  typeLabel: Record<DocType, string> = {
    POLIZA_SEGURO: 'Poliza de seguro',
    NOTA_MEDICA: 'Nota medica',
    CONSENTIMIENTO_INFORMADO: 'Consentimiento',
    EXAMEN_PREOP: 'Examen preoperatorio',
    OTRO: 'Otro',
  };

  statusLabel: Record<string, string> = {
    available: 'Disponible',
  };

  icons: Record<string, string> = {
    plus: 'M12 5v14M5 12h14',
    search: 'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
    trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    close: 'M18 6L6 18M6 6l12 12',
    download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
    file: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    upload: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
    empty: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  };

  constructor(
    private documentsService: DocumentsService,
    private authService: AuthService,
    private patientsService: PatientsService,
    private surgeriesService: SurgeriesService
  ) {
    this.userRole = this.authService.getRole();
    this.userId = this.authService.getUserId();
  }

  ngOnInit(): void {
    this.loadDocuments();
    this.loadSelectors();
  }

  filtered = computed(() => {
    let list = this.documents();
    const q = this.searchQuery().toLowerCase().trim();
    const t = this.filterType();
    if (q) {
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.patientId.toLowerCase().includes(q) ||
        d.surgeryId.toLowerCase().includes(q) ||
        d.uploadedBy.toLowerCase().includes(q)
      );
    }
    if (t !== 'all') list = list.filter(d => d.type === t);
    return list;
  });

  counts = computed(() => {
    const docs = this.documents();
    const result: Record<string, number> = { all: docs.length };
    this.typeOptions.forEach(t => {
      result[t.value] = docs.filter(d => d.type === t.value).length;
    });
    return result;
  });

  loadDocuments(): void {
    this.loading.set(true);
    this.error.set('');
    this.documentsService.list().subscribe({
      next: response => {
        this.documents.set(response.items.map(doc => this.mapDocument(doc)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los documentos.');
        this.loading.set(false);
      }
    });
  }

  openCreate() {
    this.form.set(emptyDoc());
    this.selectedFile.set(null);
    this.showModal.set(true);
  }

  loadSelectors(): void {
    this.patientsService.list().subscribe({
      next: response => this.patients.set(response.items),
      error: () => this.error.set('No se pudo cargar la lista de pacientes.')
    });

    this.surgeriesService.list().subscribe({
      next: response => this.surgeries.set(response.items),
      error: () => this.error.set('No se pudo cargar la lista de cirugias.')
    });
  }

  closeModal() { this.showModal.set(false); }

  saveForm() {
    const file = this.selectedFile();
    const f = this.form();
    if (!file || !this.isFormValid()) return;

    this.error.set('');
    this.documentsService.upload({
      file,
      documentType: f.type,
      patientId: f.patientId,
      surgeryId: f.surgeryId,
      notes: f.notes,
    }).subscribe({
      next: () => {
        this.closeModal();
        this.loadDocuments();
      },
      error: () => this.error.set('No se pudo subir el documento. Revise permisos, IDs y formato PDF.')
    });
  }

  confirmDelete(id: string) {
    this.deletingId.set(id);
    this.showDeleteModal.set(true);
  }

  doDelete() {
    const id = this.deletingId();
    if (!id) return;
    this.documentsService.delete(id).subscribe({
      next: () => {
        this.showDeleteModal.set(false);
        this.deletingId.set(null);
        this.loadDocuments();
      },
      error: () => this.error.set('No se pudo eliminar el documento.')
    });
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.deletingId.set(null);
  }

  download(d: MedicalDocument): void {
    if (!d.id) return;
    this.documentsService.download(d.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      },
      error: () => this.error.set('No se pudo descargar el documento.')
    });
  }

  canDelete(d: MedicalDocument): boolean {
    return this.userRole === 'admin' || d.uploadedBy === this.userId;
  }

  patientLabel(patient: ApiPatient): string {
    const document = patient.identity_document ? ` - ${patient.identity_document}` : '';
    return `${patient.first_name} ${patient.last_name}${document}`;
  }

  surgeryLabel(surgery: ApiSurgery): string {
    const date = surgery.scheduled_start?.slice(0, 10) ?? '';
    return `${date} - ${surgery.surgery_type} - ${surgery.patient_name ?? 'Paciente'}`;
  }

  patientDisplay(id: string): string {
    if (!id) return '-';
    const patient = this.patients().find(item => item.id === id);
    return patient ? this.patientLabel(patient) : id;
  }

  surgeryDisplay(id: string): string {
    if (!id) return '-';
    const surgery = this.surgeries().find(item => item.id === id);
    return surgery ? this.surgeryLabel(surgery) : id;
  }

  updateForm(field: keyof MedicalDocument, value: string) {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  isFormValid(): boolean {
    const f = this.form();
    return !!(this.selectedFile() && f.name && f.type && (f.patientId || f.surgeryId));
  }

  onDragOver(e: DragEvent) { e.preventDefault(); this.dragOver.set(true); }
  onDragLeave() { this.dragOver.set(false); }
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.handleFile(file);
  }

  onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.handleFile(file);
  }

  private handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      this.error.set('Solo se permiten archivos PDF.');
      return;
    }
    const kb = (file.size / 1024).toFixed(1);
    const mb = (file.size / 1024 / 1024).toFixed(2);
    const size = file.size > 1024 * 1024 ? `${mb} MB` : `${kb} KB`;
    this.selectedFile.set(file);
    this.form.update(f => ({ ...f, name: file.name, size }));
  }

  private mapDocument(doc: ApiDocument): MedicalDocument {
    return {
      id: doc.id,
      name: doc.file_name,
      type: doc.document_type,
      patientId: doc.patient_id ?? '',
      surgeryId: doc.surgery_id ?? '',
      uploadedBy: doc.uploaded_by_user_id,
      uploadedAt: new Date(doc.uploaded_at),
      size: this.formatSize(doc.file_size_bytes),
      notes: doc.notes ?? '',
      status: 'available',
    };
  }

  private formatSize(bytes: number): string {
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
}
