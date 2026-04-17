import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type DocType = 'insurance' | 'medical-note' | 'consent' | 'lab' | 'imaging' | 'other';

export interface MedicalDocument {
  id?: number;
  name: string;
  type: DocType;
  patientName: string;
  surgeryId: string;
  uploadedBy: string;
  uploadedAt: Date;
  size: string;
  notes: string;
  status: 'pending' | 'reviewed' | 'archived';
}

const emptyDoc = (): MedicalDocument => ({
  name: '', type: 'medical-note', patientName: '',
  surgeryId: '', uploadedBy: '', uploadedAt: new Date(),
  size: '', notes: '', status: 'pending'
});

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './documents.html',
  styleUrl: './documents.css'
})
export class DocumentsComponent {

  documents       = signal<MedicalDocument[]>([]);
  searchQuery     = signal('');
  filterType      = signal<DocType | 'all'>('all');
  showModal       = signal(false);
  showDeleteModal = signal(false);
  editingId       = signal<number | null>(null);
  deletingId      = signal<number | null>(null);
  form            = signal<MedicalDocument>(emptyDoc());
  nextId          = 1;
  dragOver        = signal(false);

  typeOptions: { value: DocType; label: string; icon: string }[] = [
    { value: 'insurance',    label: 'Póliza de seguro',   icon: 'shield'   },
    { value: 'medical-note', label: 'Nota médica',        icon: 'note'     },
    { value: 'consent',      label: 'Consentimiento',     icon: 'pen'      },
    { value: 'lab',          label: 'Laboratorio',        icon: 'flask'    },
    { value: 'imaging',      label: 'Imagen médica',      icon: 'scan'     },
    { value: 'other',        label: 'Otro',               icon: 'file'     },
  ];

  statusOptions = [
    { value: 'pending',  label: 'Pendiente' },
    { value: 'reviewed', label: 'Revisado'  },
    { value: 'archived', label: 'Archivado' },
  ];

  typeLabel: Record<string, string> = {
    'insurance':    'Póliza de seguro',
    'medical-note': 'Nota médica',
    'consent':      'Consentimiento',
    'lab':          'Laboratorio',
    'imaging':      'Imagen médica',
    'other':        'Otro',
  };

  statusLabel: Record<string, string> = {
    pending:  'Pendiente',
    reviewed: 'Revisado',
    archived: 'Archivado',
  };

  icons: Record<string, string> = {
    plus:    'M12 5v14M5 12h14',
    search:  'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
    edit:    'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    trash:   'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    close:   'M18 6L6 18M6 6l12 12',
    download:'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
    file:    'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    upload:  'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
    empty:   'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  };

  filtered = computed(() => {
    let list = this.documents();
    const q  = this.searchQuery().toLowerCase().trim();
    const t  = this.filterType();
    if (q) {
      list = list.filter(d =>
        d.name.toLowerCase().includes(q)        ||
        d.patientName.toLowerCase().includes(q) ||
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

  openCreate() {
    this.editingId.set(null);
    this.form.set(emptyDoc());
    this.showModal.set(true);
  }

  openEdit(d: MedicalDocument) {
    this.editingId.set(d.id!);
    this.form.set({ ...d });
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  saveForm() {
    const f = this.form();
    if (!f.name || !f.patientName) return;
    if (this.editingId() !== null) {
      this.documents.update(list =>
        list.map(d => d.id === this.editingId() ? { ...f, id: d.id } : d)
      );
    } else {
      this.documents.update(list => [
        ...list, { ...f, id: this.nextId++, uploadedAt: new Date() }
      ]);
    }
    this.closeModal();
  }

  confirmDelete(id: number) {
    this.deletingId.set(id);
    this.showDeleteModal.set(true);
  }

  doDelete() {
    this.documents.update(list => list.filter(d => d.id !== this.deletingId()));
    this.showDeleteModal.set(false);
    this.deletingId.set(null);
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.deletingId.set(null);
  }

  updateForm(field: keyof MedicalDocument, value: string) {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  isFormValid(): boolean {
    const f = this.form();
    return !!(f.name && f.patientName && f.type);
  }

  onDragOver(e: DragEvent) { e.preventDefault(); this.dragOver.set(true); }
  onDragLeave()            { this.dragOver.set(false); }
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
    const kb = (file.size / 1024).toFixed(1);
    const mb = (file.size / 1024 / 1024).toFixed(2);
    const size = file.size > 1024 * 1024 ? `${mb} MB` : `${kb} KB`;
    this.form.update(f => ({ ...f, name: file.name, size }));
  }
}