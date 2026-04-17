import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type UserRole = 'admin' | 'surgeon' | 'anesthesiologist' | 'patient';

export interface AppUser {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  createdAt: Date;
  lastLogin?: Date;
}

const emptyUser = (): AppUser => ({
  firstName: '', lastName: '', email: '',
  role: 'patient', status: 'active', createdAt: new Date()
});

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class UsersComponent {

  users           = signal<AppUser[]>([]);
  searchQuery     = signal('');
  filterRole      = signal<UserRole | 'all'>('all');
  showModal       = signal(false);
  showDeleteModal = signal(false);
  editingId       = signal<number | null>(null);
  deletingId      = signal<number | null>(null);
  form            = signal<AppUser>(emptyUser());
  newPassword     = signal('');
  showPassword    = signal(false);
  nextId          = 1;

  roleOptions: { value: UserRole; label: string }[] = [
    { value: 'admin',            label: 'Administrador'  },
    { value: 'surgeon',          label: 'Cirujano'       },
    { value: 'anesthesiologist', label: 'Anestesiólogo'  },
    { value: 'patient',          label: 'Paciente'       },
  ];

  roleLabel: Record<string, string> = {
    admin:            'Administrador',
    surgeon:          'Cirujano',
    anesthesiologist: 'Anestesiólogo',
    patient:          'Paciente',
  };

  icons: Record<string, string> = {
    plus:   'M12 5v14M5 12h14',
    search: 'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
    edit:   'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    trash:  'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    close:  'M18 6L6 18M6 6l12 12',
    empty:  'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    eye:    'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    eyeOff: 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21',
  };

  filtered = computed(() => {
    let list = this.users();
    const q  = this.searchQuery().toLowerCase().trim();
    const r  = this.filterRole();
    if (q) {
      list = list.filter(u =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q)  ||
        u.email.toLowerCase().includes(q)
      );
    }
    if (r !== 'all') list = list.filter(u => u.role === r);
    return list;
  });

  counts = computed(() => ({
    all:             this.users().length,
    admin:           this.users().filter(u => u.role === 'admin').length,
    surgeon:         this.users().filter(u => u.role === 'surgeon').length,
    anesthesiologist:this.users().filter(u => u.role === 'anesthesiologist').length,
    patient:         this.users().filter(u => u.role === 'patient').length,
  }));

  fullName(u: AppUser) { return `${u.firstName} ${u.lastName}`; }

  initials(u: AppUser) {
    return `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();
  }

  openCreate() {
    this.editingId.set(null);
    this.form.set(emptyUser());
    this.newPassword.set('');
    this.showModal.set(true);
  }

  openEdit(u: AppUser) {
    this.editingId.set(u.id!);
    this.form.set({ ...u });
    this.newPassword.set('');
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  saveForm() {
    const f = this.form();
    if (!f.firstName || !f.lastName || !f.email || !f.role) return;
    if (this.editingId() !== null) {
      this.users.update(list =>
        list.map(u => u.id === this.editingId() ? { ...f, id: u.id } : u)
      );
    } else {
      this.users.update(list => [
        ...list, { ...f, id: this.nextId++, createdAt: new Date() }
      ]);
    }
    this.closeModal();
  }

  confirmDelete(id: number) {
    this.deletingId.set(id);
    this.showDeleteModal.set(true);
  }

  doDelete() {
    this.users.update(list => list.filter(u => u.id !== this.deletingId()));
    this.showDeleteModal.set(false);
    this.deletingId.set(null);
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.deletingId.set(null);
  }

  updateForm(field: keyof AppUser, value: string) {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  isFormValid(): boolean {
    const f = this.form();
    const isNew = this.editingId() === null;
    return !!(f.firstName && f.lastName && f.email && f.role &&
      (!isNew || this.newPassword().length >= 8));
  }
}