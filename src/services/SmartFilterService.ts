import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export interface SmartFilter {
  id: string;
  name: string;
  icon: string;
  description: string;
  filter: (tasks: any[]) => any[];
}

const STORAGE_KEY = 'smart_filters_last_used';

/**
 * Servizio per gestire i filtri intelligenti dei task
 */
export class SmartFilterService {
  /**
   * Ritorna tutti i filtri intelligenti disponibili
   */
  static getAvailableFilters(): SmartFilter[] {
    const now = dayjs();
    const today = now.startOf('day');
    const tomorrow = today.add(1, 'day');
    const weekStart = now.startOf('week');
    const weekEnd = weekStart.add(7, 'days');

    return [
      {
        id: 'overdue-today',
        name: 'Scaduti Oggi',
        icon: 'alert-circle',
        description: 'Task scaduti o in scadenza oggi',
        filter: (tasks: any[]) => {
          return tasks.filter(task => {
            if (task.status === 'Completato' || !task.end_time) return false;
            const dueDate = dayjs(task.end_time);
            return dueDate.isSameOrBefore(today, 'day');
          });
        }
      },
      {
        id: 'due-tomorrow',
        name: 'Scadenza Domani',
        icon: 'calendar',
        description: 'Task che scadono domani',
        filter: (tasks: any[]) => {
          return tasks.filter(task => {
            if (task.status === 'Completato' || !task.end_time) return false;
            const dueDate = dayjs(task.end_time).startOf('day');
            return dueDate.isSame(tomorrow, 'day');
          });
        }
      },
      {
        id: 'this-week',
        name: 'Questa Settimana',
        icon: 'calendar-week',
        description: 'Task da completare questa settimana',
        filter: (tasks: any[]) => {
          return tasks.filter(task => {
            if (task.status === 'Completato' || !task.end_time) return false;
            const dueDate = dayjs(task.end_time).startOf('day');
            return dueDate.isBetween(weekStart, weekEnd, null, '[]');
          });
        }
      },
      {
        id: 'high-priority',
        name: 'Alta Priorità',
        icon: 'star',
        description: 'Task ad alta priorità non completati',
        filter: (tasks: any[]) => {
          return tasks.filter(
            task => task.status !== 'Completato' && task.priority >= 4
          );
        }
      },
      {
        id: 'high-urgent',
        name: 'Urgente + Alta',
        icon: 'alert',
        description: 'Task urgenti con alta priorità',
        filter: (tasks: any[]) => {
          const now = dayjs();
          return tasks.filter(task => {
            if (task.status === 'Completato' || !task.end_time) return false;
            const dueDate = dayjs(task.end_time);
            const isUrgent = dueDate.isBefore(now.add(1, 'day'));
            const isHighPriority = task.priority >= 4;
            return isUrgent && isHighPriority;
          });
        }
      },
      {
        id: 'this-month',
        name: 'Questo Mese',
        icon: 'calendar-month',
        description: 'Task del mese corrente',
        filter: (tasks: any[]) => {
          const monthStart = now.startOf('month');
          const monthEnd = now.endOf('month');
          return tasks.filter(task => {
            if (task.status === 'Completato' || !task.end_time) return false;
            const dueDate = dayjs(task.end_time).startOf('day');
            return dueDate.isBetween(monthStart, monthEnd, null, '[]');
          });
        }
      },
      {
        id: 'completed-today',
        name: 'Completati Oggi',
        icon: 'check-circle',
        description: 'Task completati oggi',
        filter: (tasks: any[]) => {
          return tasks.filter(task => {
            if (task.status !== 'Completato' || !task.updated_at) return false;
            const completedDate = dayjs(task.updated_at).startOf('day');
            return completedDate.isSame(today, 'day');
          });
        }
      },
      {
        id: 'no-deadline',
        name: 'Senza Scadenza',
        icon: 'inbox',
        description: 'Task senza data di scadenza',
        filter: (tasks: any[]) => {
          return tasks.filter(task => task.status !== 'Completato' && !task.end_time);
        }
      },
    ];
  }

  /**
   * Applica un filtro intelligente ai task
   */
  static applySmartFilter(filterId: string, tasks: any[]): any[] {
    const filters = this.getAvailableFilters();
    const filter = filters.find(f => f.id === filterId);
    if (!filter) return tasks;
    return filter.filter(tasks);
  }

  /**
   * Ritorna i filtri intelligenti con il conteggio dei risultati
   */
  static getFiltersWithCounts(tasks: any[]): Array<SmartFilter & { count: number }> {
    const filters = this.getAvailableFilters();
    return filters.map(filter => ({
      ...filter,
      count: filter.filter(tasks).length
    })).filter(f => f.count > 0);
  }

  /**
   * Salva l'ultimo filtro usato
   */
  static async saveLastUsedFilter(filterId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, filterId);
    } catch (error) {
      console.warn('Errore salvataggio ultimo filtro:', error);
    }
  }

  /**
   * Recupera l'ultimo filtro usato
   */
  static async getLastUsedFilter(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Errore recupero ultimo filtro:', error);
      return null;
    }
  }
}
