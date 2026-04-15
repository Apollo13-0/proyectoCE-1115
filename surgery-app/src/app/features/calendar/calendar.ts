import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Surgery {
  id: number;
  title: string;
  patient: string;
  surgeon: string;
  type: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  date: Date;
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
export class CalendarComponent {

  today       = new Date();
  currentDate = signal(new Date());
  selectedDay = signal<CalendarDay | null>(null);

  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  monthNames = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];

  surgeries: Surgery[] = [];

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
    const surgeries = this.surgeries.filter(s => {
      const sd = new Date(s.date);
      sd.setHours(0, 0, 0, 0);
      return sd.getTime() === date.getTime();
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
      scheduled:  ms.filter(s => s.status === 'scheduled').length,
      completed:  ms.filter(s => s.status === 'completed').length,
      inProgress: ms.filter(s => s.status === 'in-progress').length,
      cancelled:  ms.filter(s => s.status === 'cancelled').length,
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
  }

  nextMonth() {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() + 1);
    this.currentDate.set(d);
    this.selectedDay.set(null);
  }

  goToday() {
    this.currentDate.set(new Date());
    this.selectedDay.set(null);
  }

  selectDay(day: CalendarDay) {
    if (this.isSelectedDay(day)) {
      this.selectedDay.set(null);
    } else {
      this.selectedDay.set(day);
    }
  }

  statusLabel: Record<string, string> = {
    'scheduled':   'Programada',
    'in-progress': 'En curso',
    'completed':   'Completada',
    'cancelled':   'Cancelada',
  };
}