import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ApiPatient, PatientPayload, PatientsService } from '../../core/patients.service';

export interface Patient {
  id?: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  address: string;
  bloodType: string;
  allergies: string;
  medicalHistory: string;
  insurancePolicy: string;
  status: 'active' | 'inactive';
}

const emptyPatient = (): Patient => ({
  firstName: '', lastName: '', idNumber: '', birthDate: '',
  gender: 'male', phone: '', email: '', address: '',
  bloodType: '', allergies: '', medicalHistory: '',
  insurancePolicy: '', status: 'active'
});

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patients.html',
  styleUrl: './patients.css'
})
export class PatientsComponent implements OnInit {
  patients        = signal<Patient[]>([]);
  searchQuery     = signal('');
  filterStatus    = signal<'all' | 'active' | 'inactive'>('all');
  showModal       = signal(false);
  showDetailModal = signal(false);
  showDeleteModal = signal(false);
  editingId       = signal<string | null>(null);
  detailPatient   = signal<Patient | null>(null);
  deletingId      = signal<string | null>(null);
  form            = signal<Patient>(emptyPatient());
  loading         = signal(false);
  error           = signal('');
  userRole        = '';

  genderOptions = [
    { value: 'male',   label: 'Masculino' },
    { value: 'female', label: 'Femenino'  },
    { value: 'other',  label: 'Otro'      },
  ];

  bloodTypes = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Desconocido'];

  genderLabel: Record<string, string> = {
    male: 'Masculino', female: 'Femenino', other: 'Otro'
  };

  icons: Record<string, string> = {
    plus:   'M12 5v14M5 12h14',
    search: 'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
    edit:   'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    trash:  'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    eye:    'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    close:  'M18 6L6 18M6 6l12 12',
    empty:  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656.126-1.283.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    user:   'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  };

  constructor(
    private patientsService: PatientsService,
    private authService: AuthService
  ) {
    this.userRole = this.authService.getRole();
  }

  ngOnInit(): void {
    this.loadPatients();
  }

  filtered = computed(() => {
    let list = this.patients();
    const q  = this.searchQuery().toLowerCase().trim();
    const st = this.filterStatus();

    if (q) {
      list = list.filter(p =>
        p.firstName.toLowerCase().includes(q)  ||
        p.lastName.toLowerCase().includes(q)   ||
        p.idNumber.toLowerCase().includes(q)   ||
        p.email.toLowerCase().includes(q)
      );
    }
    if (st !== 'all') list = list.filter(p => p.status === st);
    return list;
  });

  counts = computed(() => ({
    all:      this.patients().length,
    active:   this.patients().filter(p => p.status === 'active').length,
    inactive: this.patients().filter(p => p.status === 'inactive').length,
  }));

  fullName(p: Patient) { return `${p.firstName} ${p.lastName}`; }

  initials(p: Patient) {
    return `${p.firstName[0] ?? ''}${p.lastName[0] ?? ''}`.toUpperCase();
  }

  age(birthDate: string): number {
    if (!birthDate) return 0;
    const diff = Date.now() - new Date(birthDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }

  loadPatients() {
    this.loading.set(true);
    this.error.set('');
    this.patientsService.list().subscribe({
      next: response => {
        this.patients.set(response.items.map(patient => this.mapPatient(patient)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los pacientes.');
        this.loading.set(false);
      }
    });
  }

  openCreate() {
    this.editingId.set(null);
    this.form.set(emptyPatient());
    this.showModal.set(true);
  }

  openEdit(p: Patient) {
    this.editingId.set(p.id!);
    this.form.set({ ...p });
    this.showModal.set(true);
  }

  openDetail(p: Patient) {
    this.detailPatient.set(p);
    this.showDetailModal.set(true);
  }

  closeModal()       { this.showModal.set(false); }
  closeDetailModal() { this.showDetailModal.set(false); }

  saveForm() {
    const f = this.form();
    if (!f.firstName || !f.lastName || !f.idNumber) return;

    const payload = this.toPayload(f);
    const request = this.editingId()
      ? this.patientsService.update(this.editingId()!, payload)
      : this.patientsService.create(payload);

    this.error.set('');
    request.subscribe({
      next: () => {
        this.closeModal();
        this.loadPatients();
      },
      error: () => this.error.set('No se pudo guardar el paciente.')
    });
  }

  confirmDelete(id: string) {
    if (!this.canDeletePatient) return;
    this.deletingId.set(id);
    this.showDeleteModal.set(true);
  }

  doDelete() {
    const id = this.deletingId();
    if (!id) return;
    this.patientsService.delete(id).subscribe({
      next: () => {
        this.showDeleteModal.set(false);
        this.deletingId.set(null);
        this.loadPatients();
      },
      error: () => this.error.set('No se pudo eliminar el paciente.')
    });
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.deletingId.set(null);
  }

  updateForm(field: keyof Patient, value: string) {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  isFormValid(): boolean {
    const f = this.form();
    return !!(f.firstName && f.lastName && f.idNumber && f.birthDate && f.phone);
  }

  get canDeletePatient(): boolean {
    return this.userRole === 'admin';
  }

  private mapPatient(api: ApiPatient): Patient {
    return {
      id: api.id,
      firstName: api.first_name,
      lastName: api.last_name,
      idNumber: api.identity_document ?? '',
      birthDate: api.birth_date,
      gender: this.mapGender(api.sex),
      phone: api.emergency_contact_phone ?? '',
      email: '',
      address: '',
      bloodType: '',
      allergies: '',
      medicalHistory: api.medical_notes ?? '',
      insurancePolicy: api.insurance_policy_number ?? '',
      status: 'active'
    };
  }

  private toPayload(patient: Patient): PatientPayload {
    return {
      first_name: patient.firstName,
      last_name: patient.lastName,
      birth_date: patient.birthDate,
      sex: patient.gender,
      identity_document: patient.idNumber,
      insurance_provider: null,
      insurance_policy_number: patient.insurancePolicy || null,
      emergency_contact_name: null,
      emergency_contact_phone: patient.phone || null,
      medical_notes: patient.medicalHistory || null
    };
  }

  private mapGender(value?: string | null): 'male' | 'female' | 'other' {
    if (value === 'female' || value === 'F' || value === 'Femenino') return 'female';
    if (value === 'other') return 'other';
    return 'male';
  }
}

export { PatientsComponent as Patients };
