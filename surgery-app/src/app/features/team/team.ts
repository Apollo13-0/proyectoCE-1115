import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type MemberRole = 'surgeon' | 'anesthesiologist' | 'assistant';

export interface TeamMember {
  id?: number;
  firstName: string;
  lastName: string;
  role: MemberRole;
  specialty: string;
  licenseNumber: string;
  phone: string;
  email: string;
  status: 'available' | 'busy' | 'inactive';
}

const emptyMember = (): TeamMember => ({
  firstName: '', lastName: '', role: 'surgeon',
  specialty: '', licenseNumber: '', phone: '',
  email: '', status: 'available'
});

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team.html',
  styleUrl: './team.css'
})
export class TeamComponent {

  members         = signal<TeamMember[]>([]);
  searchQuery     = signal('');
  filterRole      = signal<MemberRole | 'all'>('all');
  showModal       = signal(false);
  showDeleteModal = signal(false);
  editingId       = signal<number | null>(null);
  deletingId      = signal<number | null>(null);
  form            = signal<TeamMember>(emptyMember());
  nextId          = 1;

  roleOptions: { value: MemberRole; label: string; plural: string }[] = [
    { value: 'surgeon',           label: 'Cirujano',       plural: 'Cirujanos'       },
    { value: 'anesthesiologist',  label: 'Anestesiólogo',  plural: 'Anestesiólogos'  },
    { value: 'assistant',         label: 'Asistente',      plural: 'Asistentes'      },
  ];

  surgeonSpecialties = [
    'Cirugía General', 'Ortopedia y Traumatología', 'Cirugía Cardiovascular',
    'Ginecología y Obstetricia', 'Neurociugía', 'Urología',
    'Oftalmología', 'Otorrinolaringología', 'Cirugía Plástica', 'Oncología', 'Otra'
  ];

  anesthSpecialties = [
    'Anestesiología General', 'Anestesia Pediátrica',
    'Anestesia Cardíaca', 'Anestesia Regional', 'Otra'
  ];

  assistantSpecialties = [
    'Instrumentación Quirúrgica', 'Enfermería Quirúrgica',
    'Técnico en Anestesia', 'Perfusionista', 'Otra'
  ];

  statusOptions = [
    { value: 'available', label: 'Disponible' },
    { value: 'busy',      label: 'Ocupado'    },
    { value: 'inactive',  label: 'Inactivo'   },
  ];

  statusLabel: Record<string, string> = {
    available: 'Disponible',
    busy:      'Ocupado',
    inactive:  'Inactivo',
  };

  roleLabel: Record<string, string> = {
    surgeon:          'Cirujano',
    anesthesiologist: 'Anestesiólogo',
    assistant:        'Asistente',
  };

  icons: Record<string, string> = {
    plus:   'M12 5v14M5 12h14',
    search: 'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
    edit:   'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    trash:  'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    close:  'M18 6L6 18M6 6l12 12',
    empty:  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  };

  get specialtiesForRole(): string[] {
    const role = this.form().role;
    if (role === 'surgeon')          return this.surgeonSpecialties;
    if (role === 'anesthesiologist') return this.anesthSpecialties;
    return this.assistantSpecialties;
  }

  filtered = computed(() => {
    let list = this.members();
    const q  = this.searchQuery().toLowerCase().trim();
    const r  = this.filterRole();
    if (q) {
      list = list.filter(m =>
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q)  ||
        m.specialty.toLowerCase().includes(q) ||
        m.licenseNumber.toLowerCase().includes(q)
      );
    }
    if (r !== 'all') list = list.filter(m => m.role === r);
    return list;
  });

  counts = computed(() => ({
    all:              this.members().length,
    surgeon:          this.members().filter(m => m.role === 'surgeon').length,
    anesthesiologist: this.members().filter(m => m.role === 'anesthesiologist').length,
    assistant:        this.members().filter(m => m.role === 'assistant').length,
  }));

  fullName(m: TeamMember) { return `${m.firstName} ${m.lastName}`; }

  initials(m: TeamMember) {
    return `${m.firstName[0] ?? ''}${m.lastName[0] ?? ''}`.toUpperCase();
  }

  openCreate() {
    this.editingId.set(null);
    this.form.set(emptyMember());
    this.showModal.set(true);
  }

  openEdit(m: TeamMember) {
    this.editingId.set(m.id!);
    this.form.set({ ...m });
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  saveForm() {
    const f = this.form();
    if (!f.firstName || !f.lastName || !f.licenseNumber) return;
    if (this.editingId() !== null) {
      this.members.update(list =>
        list.map(m => m.id === this.editingId() ? { ...f, id: m.id } : m)
      );
    } else {
      this.members.update(list => [...list, { ...f, id: this.nextId++ }]);
    }
    this.closeModal();
  }

  confirmDelete(id: number) {
    this.deletingId.set(id);
    this.showDeleteModal.set(true);
  }

  doDelete() {
    this.members.update(list => list.filter(m => m.id !== this.deletingId()));
    this.showDeleteModal.set(false);
    this.deletingId.set(null);
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.deletingId.set(null);
  }

  updateForm(field: keyof TeamMember, value: string) {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  isFormValid(): boolean {
    const f = this.form();
    return !!(f.firstName && f.lastName && f.role && f.licenseNumber && f.phone);
  }
}