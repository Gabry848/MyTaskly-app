import dayjs, { Dayjs } from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export type CountdownStatus = 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'noDeadline';

export interface TaskCountdown {
  status: CountdownStatus;
  isOverdue: boolean;
  isToday: boolean;
  daysUntil: number;
  hoursUntil: number;
  minutesUntil: number;
  label: string;
  color: string;
  icon: string;
  formattedDate: string;
}

/**
 * Servizio per calcolare il countdown verso la scadenza del task
 */
export class TaskCountdownService {
  /**
   * Calcola il countdown per un task
   */
  static calculateCountdown(endTime: string | null): TaskCountdown {
    if (!endTime) {
      return {
        status: 'noDeadline',
        isOverdue: false,
        isToday: false,
        daysUntil: 0,
        hoursUntil: 0,
        minutesUntil: 0,
        label: 'Nessuna scadenza',
        color: '#999',
        icon: 'inbox',
        formattedDate: 'N/A',
      };
    }

    const now = dayjs();
    const deadline = dayjs(endTime);
    const today = now.startOf('day');
    const tomorrow = today.add(1, 'day');

    // Controlla se è scaduto
    if (deadline.isBefore(now)) {
      const diff = now.diff(deadline);
      const dur = dayjs.duration(diff);

      return {
        status: 'overdue',
        isOverdue: true,
        isToday: false,
        daysUntil: Math.floor(dur.asDays()),
        hoursUntil: dur.hours(),
        minutesUntil: dur.minutes(),
        label: `Scaduto da ${Math.floor(dur.asDays())}d`,
        color: '#D32F2F',
        icon: 'error',
        formattedDate: deadline.format('D MMM HH:mm'),
      };
    }

    // Controlla se è oggi
    if (deadline.startOf('day').isSame(today)) {
      const diff = deadline.diff(now);
      const dur = dayjs.duration(diff);

      return {
        status: 'today',
        isOverdue: false,
        isToday: true,
        daysUntil: 0,
        hoursUntil: dur.hours(),
        minutesUntil: dur.minutes(),
        label: `Oggi alle ${deadline.format('HH:mm')}`,
        color: '#FF9800',
        icon: 'today',
        formattedDate: deadline.format('HH:mm'),
      };
    }

    // Controlla se è domani
    if (deadline.startOf('day').isSame(tomorrow)) {
      return {
        status: 'tomorrow',
        isOverdue: false,
        isToday: false,
        daysUntil: 1,
        hoursUntil: 0,
        minutesUntil: 0,
        label: `Domani alle ${deadline.format('HH:mm')}`,
        color: '#FFC107',
        icon: 'schedule',
        formattedDate: deadline.format('D MMM HH:mm'),
      };
    }

    // Altrimenti è un giorno futuro
    const diff = deadline.diff(now);
    const dur = dayjs.duration(diff);

    return {
      status: 'upcoming',
      isOverdue: false,
      isToday: false,
      daysUntil: Math.floor(dur.asDays()),
      hoursUntil: dur.hours(),
      minutesUntil: dur.minutes(),
      label: `${Math.floor(dur.asDays())}d ${dur.hours()}h`,
      color: '#4CAF50',
      icon: 'calendar-month',
      formattedDate: deadline.format('D MMM HH:mm'),
    };
  }

  /**
   * Ritorna il colore basato sulla priorità
   */
  static getCountdownColor(deadline: string | null): string {
    const countdown = this.calculateCountdown(deadline);
    return countdown.color;
  }

  /**
   * Ritorna il label del countdown
   */
  static getCountdownLabel(deadline: string | null): string {
    const countdown = this.calculateCountdown(deadline);
    return countdown.label;
  }

  /**
   * Formatta la data in modo leggibile
   */
  static formatCountdownDate(deadline: string | null): string {
    const countdown = this.calculateCountdown(deadline);
    return countdown.formattedDate;
  }

  /**
   * Controlla se un task è in ritardo
   */
  static isTaskOverdue(deadline: string | null): boolean {
    const countdown = this.calculateCountdown(deadline);
    return countdown.isOverdue;
  }

  /**
   * Controlla se un task scade oggi
   */
  static isTaskToday(deadline: string | null): boolean {
    const countdown = this.calculateCountdown(deadline);
    return countdown.isToday;
  }

  /**
   * Controlla se un task è critico (scade entro 24 ore)
   */
  static isTaskCritical(deadline: string | null): boolean {
    if (!deadline) return false;
    const now = dayjs();
    const deadline_date = dayjs(deadline);
    const diff = deadline_date.diff(now, 'hour');
    return diff <= 24 && diff > 0;
  }

  /**
   * Ritorna il numero di giorni rimanenti
   */
  static getDaysRemaining(deadline: string | null): number {
    if (!deadline) return -1;
    const countdown = this.calculateCountdown(deadline);
    return countdown.daysUntil;
  }

  /**
   * Ritorna il numero di ore rimanenti
   */
  static getHoursRemaining(deadline: string | null): number {
    if (!deadline) return -1;
    const now = dayjs();
    const deadline_date = dayjs(deadline);
    return Math.max(0, deadline_date.diff(now, 'hour'));
  }
}
