import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ApiSurgery, ApiSurgeryStatus, SurgeryPayload, SurgeriesService } from '../../core/surgeries.service';

interface SurgeryView {
  id: string;
  title: string;
  patient: string;
  surgeon: string;
  anesthesiologist: string;
  assistants: string;
  date: string;
  dateLabel: string;
  time: string;
  endTime: string;
  duration: number;
  status: ApiSurgeryStatus;
  notes: string;
  postopNotes: string;
  operatingRoom: string;
}

interface SurgeryForm {
  id?: string;
  patientId: string;
  leadSurgeonId: string;
  anesthesiologistId: string;
  surgeryType: string;
  date: string;
  startTime: string;
  endTime: string;
  operatingRoom: string;
  preopNotes: string;
  postopNotes: string;
  status: ApiSurgeryStatus;
}

const emptyForm = (): SurgeryForm => ({
  patientId: '',
  leadSurgeonId: '',
  anesthesiologistId: '',
  surgeryType: '',
  date: '',
  startTime: '',
  endTime: '',
  operatingRoom: '',
  preopNotes: '',
  postopNotes: '',
  status: 'PROGRAMADA',
});

@Component({
  selector: 'app-surgeries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './surgeries.html',
  styleUrl: './surgeries.css'
})
export class SurgeriesComponent implements OnInit {
  surgeries = signal<SurgeryView[]>([]);
  selectedSurgery = signal<SurgeryView | null>(null);
  searchQuery = signal('');
  filterStatus = signal<ApiSurgeryStatus | 'all'>('all');
  dateFrom = signal('');
  dateTo = signal('');
  loading = signal(false);
  error = signal('');
  updatingId = signal<string | null>(null);
  showFormModal = signal(false);
  showDeleteModal = signal(false);
  deletingId = signal<string | null>(null);
  form = signal<SurgeryForm>(emptyForm());

  userRole = '';

  statusOptions: { value: ApiSurgeryStatus; label: string }[] = [
    { value: 'SOLICITADA', label: 'Solicitada' },
    { value: 'PENDIENTE_VALIDACION', label: 'Pendiente validacion' },
    { value: 'PROGRAMADA', label: 'Programada' },
    { value: 'EN_CURSO', label: 'En curso' },
    { value: 'COMPLETADA', label: 'Completada' },
    { value: 'CANCELADA', label: 'Cancelada' },
  ];

  statusLabel: Record<ApiSurgeryStatus, string> = {
    SOLICITADA: 'Solicitada',
    PENDIENTE_VALIDACION: 'Pendiente validacion',
    PROGRAMADA: 'Programada',
    EN_CURSO: 'En curso',
    COMPLETADA: 'Completada',
    CANCELADA: 'Cancelada',
  };

  statusClass: Record<ApiSurgeryStatus, string> = {
    SOLICITADA: 'scheduled',
    PENDIENTE_VALIDACION: 'scheduled',
    PROGRAMADA: 'scheduled',
    EN_CURSO: 'in-progress',
    COMPLETADA: 'completed',
    CANCELADA: 'cancelled',
  };

  icons: Record<string, string> = {
    plus: 'M12 5v14M5 12h14',
    edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    search: 'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
    eye: 'M1.5 12s4-7 10.5-7 10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z M12 15a3 3 0 100-6 3 3 0 000 6z',
    empty: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    close: 'M18 6L6 18M6 6l12 12',
    refresh: 'M4 4v6h6M20 20v-6h-6M20 9A8 8 0 006.3 4.3L4 10m16 4l-2.3 5.7A8 8 0 014 15',
  };

  filtered = computed(() => {
    let list = this.surgeries();
    const q = this.searchQuery().toLowerCase().trim();
    const st = this.filterStatus();
    const from = this.dateFrom();
    const to = this.dateTo();

    if (q) {
      list = list.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.patient.toLowerCase().includes(q) ||
        s.surgeon.toLowerCase().includes(q) ||
        s.anesthesiologist.toLowerCase().includes(q) ||
        s.operatingRoom.toLowerCase().includes(q)
      );
    }

    if (st !== 'all') {
      list = list.filter(s => s.status === st);
    }

    if (from) {
      list = list.filter(s => s.date >= from);
    }

    if (to) {
      list = list.filter(s => s.date <= to);
    }

    return list;
  });

  counts = computed(() => ({
    all: this.surgeries().length,
    requested: this.surgeries().filter(s => s.status === 'SOLICITADA').length,
    pending: this.surgeries().filter(s => s.status === 'PENDIENTE_VALIDACION').length,
    scheduled: this.surgeries().filter(s => s.status === 'PROGRAMADA').length,
    inProgress: this.surgeries().filter(s => s.status === 'EN_CURSO').length,
    completed: this.surgeries().filter(s => s.status === 'COMPLETADA').length,
    cancelled: this.surgeries().filter(s => s.status === 'CANCELADA').length,
  }));

  constructor(
    private surgeriesService: SurgeriesService,
    private authService: AuthService
  ) {
    this.userRole = this.authService.getRole();
  }

  ngOnInit(): void {
    this.loadSurgeries();
  }

  loadSurgeries(): void {
    this.loading.set(true);
    this.error.set('');

    this.surgeriesService.list().subscribe({
      next: response => {
        this.surgeries.set(response.items.map(item => this.mapSurgery(item)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las cirugias.');
        this.loading.set(false);
      }
    });
  }

  openDetail(surgery: SurgeryView): void {
    this.error.set('');
    this.surgeriesService.getById(surgery.id).subscribe({
      next: response => this.selectedSurgery.set(this.mapSurgery(response)),
      error: () => this.error.set('No se pudo cargar el detalle de la cirugia.')
    });
  }

  closeDetail(): void {
    this.selectedSurgery.set(null);
  }

  updateStatus(surgery: SurgeryView, status: ApiSurgeryStatus): void {
    if (!this.canChangeStatus || surgery.status === status) return;

    this.updatingId.set(surgery.id);
    this.error.set('');

    this.surgeriesService.updateStatus(surgery.id, status).subscribe({
      next: response => {
        const updated = this.mapSurgery(response);
        this.surgeries.update(list => list.map(item => item.id === updated.id ? updated : item));
        if (this.selectedSurgery()?.id === updated.id) {
          this.selectedSurgery.set(updated);
        }
        this.updatingId.set(null);
      },
      error: () => {
        this.error.set('No tiene permisos para cambiar el estado o el cambio no es valido.');
        this.updatingId.set(null);
      }
    });
  }

  openCreate(): void {
    if (!this.canManageSurgery) return;
    this.form.set(emptyForm());
    this.showFormModal.set(true);
  }

  openEdit(surgery: SurgeryView): void {
    if (!this.canManageSurgery) return;
    this.surgeriesService.getById(surgery.id).subscribe({
      next: api => {
        const start = new Date(api.scheduled_start);
        const end = new Date(api.scheduled_end);
        this.form.set({
          id: api.id,
          patientId: api.patient_id,
          leadSurgeonId: api.lead_surgeon_id,
          anesthesiologistId: api.anesthesiologist_id,
          surgeryType: api.surgery_type,
          date: api.scheduled_start.slice(0, 10),
          startTime: this.toInputTime(start),
          endTime: this.toInputTime(end),
          operatingRoom: api.operating_room ?? '',
          preopNotes: api.preop_notes ?? '',
          postopNotes: api.postop_notes ?? '',
          status: api.status,
        });
        this.showFormModal.set(true);
      },
      error: () => this.error.set('No se pudo cargar la cirugia para editar.')
    });
  }

  closeForm(): void {
    this.showFormModal.set(false);
    this.form.set(emptyForm());
  }

  saveForm(): void {
    if (!this.isFormValid()) return;
    const f = this.form();
    const payload = this.toPayload(f);
    const request = f.id
      ? this.surgeriesService.update(f.id, { ...payload, status: f.status })
      : this.surgeriesService.create(payload);

    this.error.set('');
    request.subscribe({
      next: () => {
        this.closeForm();
        this.loadSurgeries();
      },
      error: () => this.error.set('No se pudo guardar la cirugia. Revise permisos e IDs.')
    });
  }

  confirmDelete(id: string): void {
    if (!this.canDeleteSurgery) return;
    this.deletingId.set(id);
    this.showDeleteModal.set(true);
  }

  doDelete(): void {
    const id = this.deletingId();
    if (!id) return;
    this.surgeriesService.delete(id).subscribe({
      next: () => {
        this.showDeleteModal.set(false);
        this.deletingId.set(null);
        this.loadSurgeries();
      },
      error: () => this.error.set('No se pudo eliminar la cirugia.')
    });
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.deletingId.set(null);
  }

  updateForm(field: keyof SurgeryForm, value: string): void {
    this.form.update(form => ({ ...form, [field]: value }));
  }

  isFormValid(): boolean {
    const f = this.form();
    return !!(f.patientId && f.leadSurgeonId && f.anesthesiologistId && f.surgeryType && f.date && f.startTime && f.endTime);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.filterStatus.set('all');
    this.dateFrom.set('');
    this.dateTo.set('');
  }

  get canChangeStatus(): boolean {
    return ['admin', 'surgeon'].includes(this.userRole);
  }

  get canManageSurgery(): boolean {
    return ['admin', 'surgeon'].includes(this.userRole);
  }

  get canDeleteSurgery(): boolean {
    return this.userRole === 'admin';
  }

  get scopeText(): string {
    return this.userRole === 'admin'
      ? 'Todas las cirugias registradas'
      : 'Solo cirugias asociadas a su usuario';
  }

  private mapSurgery(api: ApiSurgery): SurgeryView {
    const start = new Date(api.scheduled_start);
    const end = new Date(api.scheduled_end);
    const durationMs = end.getTime() - start.getTime();

    return {
      id: api.id,
      title: api.surgery_type,
      patient: api.patient_name ?? '-',
      surgeon: api.surgeon_name ?? '-',
      anesthesiologist: api.anesthesiologist_name ?? '-',
      assistants: api.assistants?.map(a => a.name).join(', ') || '-',
      date: api.scheduled_start.slice(0, 10),
      dateLabel: this.formatDate(api.scheduled_start.slice(0, 10)),
      time: this.toTime(start),
      endTime: this.toTime(end),
      duration: Number.isFinite(durationMs) ? Math.max(Math.round(durationMs / 60000), 0) : 0,
      status: api.status,
      notes: api.preop_notes ?? '',
      postopNotes: api.postop_notes ?? '',
      operatingRoom: api.operating_room ?? '-',
    };
  }

  private toTime(date: Date): string {
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
  }

  private toInputTime(date: Date): string {
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  private toPayload(form: SurgeryForm): SurgeryPayload {
    return {
      patient_id: form.patientId,
      lead_surgeon_id: form.leadSurgeonId,
      anesthesiologist_id: form.anesthesiologistId,
      surgery_type: form.surgeryType,
      scheduled_start: `${form.date}T${form.startTime}:00`,
      scheduled_end: `${form.date}T${form.endTime}:00`,
      operating_room: form.operatingRoom || null,
      preop_notes: form.preopNotes || null,
      postop_notes: form.postopNotes || null,
    };
  }

  private formatDate(value: string): string {
    const [year, month, day] = value.split('-');
    return day && month && year ? `${day}/${month}/${year}` : value;
  }
}
