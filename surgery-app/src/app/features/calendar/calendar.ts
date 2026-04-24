import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SurgeriesService, ApiSurgery } from '../../core/surgeries.service';
import { HttpErrorResponse } from '@angular/common/http';

interface Surgery {
  id: string;
  title: string;
  patient: string;
  surgeon: string;
  type: string;
  time: string;
  duration: number;
  status: 'PROGRAMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA' | 'SOLICITADA' | 'PENDIENTE_VALIDACION';
  date: Date;
  scheduledStart: Date;
  scheduledEnd: Date;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  surgeries: Surgery[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css'
})
export class CalendarComponent implements OnInit {

  today       = new Date();
  currentDate = signal(new Date());
  selectedDay = signal<CalendarDay | null>(null);
  isLoading = signal(false);

  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  monthNames = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];

  surgeries: Surgery[] = [];

  constructor(private surgeriesService: SurgeriesService) {}

  ngOnInit() {
    this.loadSurgeries();
  }

  private loadSurgeries() {
    const date = this.currentDate();
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    const year = date.getFullYear();
    
    console.log(`Loading surgeries for ${month}/${year}`);
    this.isLoading.set(true);
    this.surgeriesService.getCalendarData(month, year).subscribe({
      next: (apiSurgeries: ApiSurgery[]) => {
        console.log(`Loaded ${apiSurgeries.length} surgeries`, apiSurgeries);
        this.surgeries = apiSurgeries.map(s => this.mapApiSurgery(s));
        console.log('Mapped surgeries:', this.surgeries);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading surgeries:', error);
        this.surgeries = [];
        this.isLoading.set(false);
      }
    });
  }

  private mapApiSurgery(apiSurgery: ApiSurgery): Surgery {
    const scheduledStart = new Date(apiSurgery.scheduled_start);
    const scheduledEnd = new Date(apiSurgery.scheduled_end);
    const duration = Math.round((scheduledEnd.getTime() - scheduledStart.getTime()) / (1000 * 60)); // minutes
    
    console.log(`Surgery ${apiSurgery.id}: scheduled_start="${apiSurgery.scheduled_start}" -> Date: ${scheduledStart.toString()}`);
    
    const statusMap: Record<string, Surgery['status']> = {
      'SOLICITADA': 'SOLICITADA',
      'PENDIENTE_VALIDACION': 'PENDIENTE_VALIDACION',
      'PROGRAMADA': 'PROGRAMADA',
      'EN_CURSO': 'EN_CURSO',
      'COMPLETADA': 'COMPLETADA',
      'CANCELADA': 'CANCELADA'
    };
    
    return {
      id: apiSurgery.id,
      title: apiSurgery.surgery_type,
      patient: apiSurgery.patient_name || 'N/A',
      surgeon: apiSurgery.surgeon_name || 'N/A',
      type: apiSurgery.surgery_type,
      time: scheduledStart.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      duration: duration,
      status: statusMap[apiSurgery.status] || 'PROGRAMADA',
      date: scheduledStart,
      scheduledStart: scheduledStart,
      scheduledEnd: scheduledEnd
    };
  }

  private dateOf(offsetDays: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private makeDay(date: Date, isCurrentMonth: boolean): CalendarDay {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = date.getTime() === today.getTime();
    
    // Get year, month, day of the calendar cell
    const cellYear = date.getFullYear();
    const cellMonth = date.getMonth();
    const cellDate = date.getDate();
    
    const surgeries = this.surgeries.filter(s => {
      // Get year, month, day of the surgery's scheduled start
      const surgeryDate = new Date(s.date);
      const surgeryYear = surgeryDate.getFullYear();
      const surgeryMonth = surgeryDate.getMonth();
      const surgeryDay = surgeryDate.getDate();
      
      // Compare year, month, and day separately (handles timezone issues)
      return surgeryYear === cellYear && surgeryMonth === cellMonth && surgeryDay === cellDate;
    });
    
    return { date, isCurrentMonth, isToday, surgeries };
  }

  calendarDays = computed<CalendarDay[]>(() => {
    const ref      = this.currentDate();
    const year     = ref.getFullYear();
    const month    = ref.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const days: CalendarDay[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(this.makeDay(new Date(year, month, -firstDay.getDay() + i + 1), false));
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(this.makeDay(new Date(year, month, d), true));
    }
    for (let i = 1; i <= 42 - days.length; i++) {
      days.push(this.makeDay(new Date(year, month + 1, i), false));
    }
    return days;
  });

  currentMonthLabel = computed(() => {
    const d = this.currentDate();
    return `${this.monthNames[d.getMonth()]} ${d.getFullYear()}`;
  });

  monthlySummary = computed(() => {
    const d     = this.currentDate();
    const month = d.getMonth();
    const year  = d.getFullYear();
    const ms    = this.surgeries.filter(s => {
      const sd = new Date(s.date);
      return sd.getMonth() === month && sd.getFullYear() === year;
    });
    return {
      total:      ms.length,
      scheduled:  ms.filter(s => s.status === 'PROGRAMADA').length,
      completed:  ms.filter(s => s.status === 'COMPLETADA').length,
      inProgress: ms.filter(s => s.status === 'EN_CURSO').length,
      cancelled:  ms.filter(s => s.status === 'CANCELADA').length,
    };
  });

  isSelectedDay(day: CalendarDay): boolean {
    const sel = this.selectedDay();
    if (!sel) return false;
    return sel.date.getTime() === day.date.getTime();
  }

  prevMonth() {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() - 1);
    this.currentDate.set(d);
    this.selectedDay.set(null);
    this.loadSurgeries();
  }

  nextMonth() {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() + 1);
    this.currentDate.set(d);
    this.selectedDay.set(null);
    this.loadSurgeries();
  }

  goToday() {
    this.currentDate.set(new Date());
    this.selectedDay.set(null);
    this.loadSurgeries();
  }

  selectDay(day: CalendarDay) {
    if (this.isSelectedDay(day)) {
      this.selectedDay.set(null);
    } else {
      this.selectedDay.set(day);
    }
  }

  statusLabel: Record<string, string> = {
    'PROGRAMADA':             'Programada',
    'EN_CURSO':               'En curso',
    'COMPLETADA':             'Completada',
    'CANCELADA':              'Cancelada',
    'SOLICITADA':             'Solicitada',
    'PENDIENTE_VALIDACION':   'Pendiente validación',
  };
}
