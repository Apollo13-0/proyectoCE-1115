import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type SurgeryStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface Surgery {
  id?: number;
  title: string;
  patient: string;
  surgeon: string;
  anesthesiologist: string;
  assistants: string;
  type: string;
  date: string;
  time: string;
  duration: number;
  status: SurgeryStatus;
  notes: string;
  operatingRoom: string;
}

const emptySurgery = (): Surgery => ({
  title: '', patient: '', surgeon: '', anesthesiologist: '',
  assistants: '', type: '', date: '', time: '', duration: 60,
  status: 'scheduled', notes: '', operatingRoom: ''
});

@Component({
  selector: 'app-surgeries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './surgeries.html',
  styleUrl: './surgeries.css'
})
export class SurgeriesComponent {

  // ── State ──────────────────────────────────
  surgeries = signal<Surgery[]>([]);
  searchQuery    = signal('');
  filterStatus   = signal<SurgeryStatus | 'all'>('all');
  showModal      = signal(false);
  editingId      = signal<number | null>(null);
  showDeleteModal = signal(false);
  deletingId     = signal<number | null>(null);
  form           = signal<Surgery>(emptySurgery());
  nextId         = 1;

  // ── Options ────────────────────────────────
  surgeryTypes = [
    'General', 'Ortopedia', 'Cardio', 'Ginecología',
    'Neurología', 'Urología', 'Oftalmología', 'ORL',
    'Plástica', 'Traumatología', 'Oncología', 'Otra'
  ];

  operatingRooms = ['Quirófano 1', 'Quirófano 2', 'Quirófano 3', 'Quirófano 4'];

  statusOptions: { value: SurgeryStatus; label: string }[] = [
    { value: 'scheduled',   label: 'Programada'  },
    { value: 'in-progress', label: 'En curso'    },
    { value: 'completed',   label: 'Completada'  },
    { value: 'cancelled',   label: 'Cancelada'   },
  ];

  statusLabel: Record<string, string> = {
    'scheduled':   'Programada',
    'in-progress': 'En curso',
    'completed':   'Completada',
    'cancelled':   'Cancelada',
  };

  // ── Icons ──────────────────────────────────
  icons: Record<string, string> = {
    plus:   'M12 5v14M5 12h14',
    search: 'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
    edit:   'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    trash:  'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    close:  'M18 6L6 18M6 6l12 12',
    empty:  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  };

  // ── Computed ───────────────────────────────
  filtered = computed(() => {
    let list = this.surgeries();
    const q  = this.searchQuery().toLowerCase().trim();
    const st = this.filterStatus();

    if (q) {
      list = list.filter(s =>
        s.title.toLowerCase().includes(q)    ||
        s.patient.toLowerCase().includes(q)  ||
        s.surgeon.toLowerCase().includes(q)
      );
    }
    if (st !== 'all') {
      list = list.filter(s => s.status === st);
    }
    return list;
  });

  counts = computed(() => ({
    all:        this.surgeries().length,
    scheduled:  this.surgeries().filter(s => s.status === 'scheduled').length,
    inProgress: this.surgeries().filter(s => s.status === 'in-progress').length,
    completed:  this.surgeries().filter(s => s.status === 'completed').length,
    cancelled:  this.surgeries().filter(s => s.status === 'cancelled').length,
  }));

  // ── CRUD ───────────────────────────────────
  openCreate() {
    this.editingId.set(null);
    this.form.set(emptySurgery());
    this.showModal.set(true);
  }

  openEdit(s: Surgery) {
    this.editingId.set(s.id!);
    this.form.set({ ...s });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.form.set(emptySurgery());
  }

  saveForm() {
    const f = this.form();
    if (!f.title || !f.patient || !f.surgeon || !f.date) return;

    if (this.editingId() !== null) {
      this.surgeries.update(list =>
        list.map(s => s.id === this.editingId() ? { ...f, id: s.id } : s)
      );
    } else {
      this.surgeries.update(list => [...list, { ...f, id: this.nextId++ }]);
    }
    this.closeModal();
  }

  confirmDelete(id: number) {
    this.deletingId.set(id);
    this.showDeleteModal.set(true);
  }

  doDelete() {
    this.surgeries.update(list => list.filter(s => s.id !== this.deletingId()));
    this.showDeleteModal.set(false);
    this.deletingId.set(null);
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.deletingId.set(null);
  }

  updateForm(field: keyof Surgery, value: string | number) {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  isFormValid(): boolean {
    const f = this.form();
    return !!(f.title && f.patient && f.surgeon && f.anesthesiologist && f.date && f.time && f.type);
  }
}