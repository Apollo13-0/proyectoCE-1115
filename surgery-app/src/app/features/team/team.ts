import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiUser, CatalogRole, TeamPayload, TeamService } from '../../core/team.service';

export type MemberRole = CatalogRole;

export interface TeamMember {
  id?: string;
  firstName: string;
  lastName: string;
  role: MemberRole;
  specialty: string;
  licenseNumber: string;
  phone: string;
  email: string;
  password: string;
  status: 'available' | 'busy' | 'inactive';
}

const emptyMember = (): TeamMember => ({
  firstName: '', lastName: '', role: 'surgeon',
  specialty: '', licenseNumber: '', phone: '',
  email: '', password: '', status: 'available'
});

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team.html',
  styleUrl: './team.css'
})
export class TeamComponent implements OnInit {
  members = signal<TeamMember[]>([]);
  searchQuery = signal('');
  filterRole = signal<MemberRole | 'all'>('all');
  showModal = signal(false);
  showDeleteModal = signal(false);
  editingId = signal<string | null>(null);
  deletingId = signal<string | null>(null);
  form = signal<TeamMember>(emptyMember());
  loading = signal(false);
  error = signal('');

  roleOptions: { value: MemberRole; label: string; plural: string }[] = [
    { value: 'surgeon', label: 'Cirujano', plural: 'Cirujanos' },
    { value: 'anesthesiologist', label: 'Anestesiologo', plural: 'Anestesiologos' },
    { value: 'assistant', label: 'Asistente', plural: 'Asistentes' },
  ];

  surgeonSpecialties = [
    'Cirugia General', 'Ortopedia y Traumatologia', 'Cirugia Cardiovascular',
    'Ginecologia y Obstetricia', 'Neurocirugia', 'Urologia',
    'Oftalmologia', 'Otorrinolaringologia', 'Cirugia Plastica', 'Oncologia', 'Otra'
  ];

  anesthSpecialties = [
    'Anestesiologia General', 'Anestesia Pediatrica',
    'Anestesia Cardiaca', 'Anestesia Regional', 'Otra'
  ];

  assistantSpecialties = [
    'Instrumentacion Quirurgica', 'Enfermeria Quirurgica',
    'Tecnico en Anestesia', 'Perfusionista', 'Otra'
  ];

  statusOptions = [
    { value: 'available', label: 'Disponible' },
    { value: 'busy', label: 'Ocupado' },
    { value: 'inactive', label: 'Inactivo' },
  ];

  statusLabel: Record<string, string> = {
    available: 'Disponible',
    busy: 'Ocupado',
    inactive: 'Inactivo',
  };

  roleLabel: Record<string, string> = {
    surgeon: 'Cirujano',
    anesthesiologist: 'Anestesiologo',
    assistant: 'Asistente',
  };

  icons: Record<string, string> = {
    plus: 'M12 5v14M5 12h14',
    search: 'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
    edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    close: 'M18 6L6 18M6 6l12 12',
    empty: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  };

  constructor(private teamService: TeamService) {}

  ngOnInit(): void {
    this.loadMembers();
  }

  get specialtiesForRole(): string[] {
    const role = this.form().role;
    if (role === 'surgeon') return this.surgeonSpecialties;
    if (role === 'anesthesiologist') return this.anesthSpecialties;
    return this.assistantSpecialties;
  }

  filtered = computed(() => {
    let list = this.members();
    const q = this.searchQuery().toLowerCase().trim();
    const r = this.filterRole();
    if (q) {
      list = list.filter(m =>
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        m.specialty.toLowerCase().includes(q) ||
        m.licenseNumber.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
      );
    }
    if (r !== 'all') list = list.filter(m => m.role === r);
    return list;
  });

  counts = computed(() => ({
    all: this.members().length,
    surgeon: this.members().filter(m => m.role === 'surgeon').length,
    anesthesiologist: this.members().filter(m => m.role === 'anesthesiologist').length,
    assistant: this.members().filter(m => m.role === 'assistant').length,
  }));

  loadMembers(): void {
    this.loading.set(true);
    this.error.set('');
    this.teamService.listAll().subscribe({
      next: users => {
        this.members.set(users.map(user => this.mapUser(user)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el catalogo de equipo medico.');
        this.loading.set(false);
      }
    });
  }

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
    this.form.set({ ...m, password: '' });
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  saveForm() {
    if (!this.isFormValid()) return;
    const f = this.form();
    const payload = this.toPayload(f);
    const request = this.editingId()
      ? this.teamService.update(f.role, this.editingId()!, payload)
      : this.teamService.create(f.role, payload as TeamPayload);

    this.error.set('');
    request.subscribe({
      next: () => {
        this.closeModal();
        this.loadMembers();
      },
      error: () => this.error.set('No se pudo guardar el miembro del equipo.')
    });
  }

  confirmDelete(id: string) {
    this.deletingId.set(id);
    this.showDeleteModal.set(true);
  }

  doDelete() {
    const member = this.members().find(m => m.id === this.deletingId());
    if (!member?.id) return;
    this.teamService.delete(member.role, member.id).subscribe({
      next: () => {
        this.showDeleteModal.set(false);
        this.deletingId.set(null);
        this.loadMembers();
      },
      error: () => this.error.set('No se pudo eliminar el miembro del equipo.')
    });
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
    const hasPassword = this.editingId() !== null || !!f.password;
    return !!(f.firstName && f.lastName && f.role && f.email && f.licenseNumber && hasPassword);
  }

  private mapUser(user: ApiUser): TeamMember {
    return {
      id: user.id,
      firstName: user.first_name ?? '',
      lastName: user.last_name ?? '',
      role: this.normalizeRole(user.role),
      specialty: '',
      licenseNumber: user.license_number ?? '',
      phone: user.phone ?? '',
      email: user.email,
      password: '',
      status: user.is_active ? 'available' : 'inactive',
    };
  }

  private normalizeRole(role: ApiUser['role']): MemberRole {
    const roles: Record<ApiUser['role'], MemberRole> = {
      CIRUJANO: 'surgeon',
      ANESTESIOLOGO: 'anesthesiologist',
      ASISTENTE: 'assistant',
    };
    return roles[role];
  }

  private toPayload(member: TeamMember): TeamPayload {
    const payload: TeamPayload = {
      first_name: member.firstName,
      last_name: member.lastName,
      email: member.email,
      phone: member.phone || null,
      license_number: member.licenseNumber || null,
    };
    if (member.password) payload.password = member.password;
    return payload;
  }
}
