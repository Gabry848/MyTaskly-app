import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from './axiosInstance';
import { STORAGE_KEYS } from '../constants/authConstants';

export interface CalendarSyncStatus {
  google_calendar_connected: boolean;
  total_tasks: number;
  synced_tasks: number;
  sync_percentage: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
}

export interface CalendarEventsResponse {
  events: CalendarEvent[];
  total: number;
  period: string;
}

export interface SyncResponse {
  message: string;
  synced_count: number;
}

class GoogleCalendarService {
  private static instance: GoogleCalendarService;

  static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  private async getAuthHeaders() {
    const bearerToken = await AsyncStorage.getItem(STORAGE_KEYS.BEARER_TOKEN);
    return {
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/json'
    };
  }


  /**
   * Verifica lo stato della connessione a Google Calendar
   */
  async getSyncStatus(): Promise<{ success: boolean; data?: CalendarSyncStatus; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axiosInstance.get('/calendar/sync-status', { headers });
      console.log('✅ Stato di sincronizzazione recuperato:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('❌ Errore nel recupero dello stato di sincronizzazione:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Errore nel recupero dello stato'
      };
    }
  }

  /**
   * Ottiene gli eventi del calendario per i prossimi giorni
   */
  async getCalendarEvents(daysAhead: number = 30): Promise<{ success: boolean; data?: CalendarEventsResponse; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axiosInstance.get(`/calendar/events?days_ahead=${daysAhead}`, { headers });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('❌ Errore nel recupero degli eventi del calendario:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Errore nel recupero degli eventi'
      };
    }
  }

  /**
   * Sincronizza i task verso Google Calendar
   */
  async syncTasksToCalendar(): Promise<{ success: boolean; data?: SyncResponse; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axiosInstance.post('/calendar/sync-tasks-to-calendar', {}, { headers });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('❌ Errore nella sincronizzazione task → calendario:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Errore nella sincronizzazione'
      };
    }
  }

  /**
   * Sincronizza Google Calendar verso task MyTaskly
   */
  async syncCalendarToTasks(daysAhead: number = 30): Promise<{ success: boolean; data?: SyncResponse; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axiosInstance.post(`/calendar/sync-calendar-to-tasks?days_ahead=${daysAhead}`, {}, { headers });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('❌ Errore nella sincronizzazione calendario → task:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Errore nella sincronizzazione'
      };
    }
  }

  /**
   * Crea un evento calendario da un task specifico
   */
  async createEventFromTask(taskId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axiosInstance.post(`/calendar/create-event-from-task/${taskId}`, {}, { headers });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('❌ Errore nella creazione evento da task:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Errore nella creazione evento'
      };
    }
  }

  /**
   * Rimuove l'evento calendario associato a un task
   */
  async removeEventFromTask(taskId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axiosInstance.delete(`/calendar/remove-event-from-task/${taskId}`, { headers });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('❌ Errore nella rimozione evento da task:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Errore nella rimozione evento'
      };
    }
  }

  /**
   * Esegue una sincronizzazione completa iniziale
   * Prima sincronizza i task esistenti verso il calendario,
   * poi importa gli eventi del calendario come task
   */
  async performInitialSync(daysAhead: number = 30): Promise<{ success: boolean; results?: any; error?: string }> {
    try {
      console.log('🔄 Avvio sincronizzazione iniziale...');

      // Prima sincronizza i task verso il calendario
      const taskToCalendarResult = await this.syncTasksToCalendar();
      if (!taskToCalendarResult.success) {
        throw new Error(`Errore sincronizzazione task → calendario: ${taskToCalendarResult.error}`);
      }

      // Poi importa gli eventi del calendario come task
      const calendarToTasksResult = await this.syncCalendarToTasks(daysAhead);
      if (!calendarToTasksResult.success) {
        throw new Error(`Errore sincronizzazione calendario → task: ${calendarToTasksResult.error}`);
      }

      console.log('✅ Sincronizzazione iniziale completata');

      return {
        success: true,
        results: {
          tasksToCalendar: taskToCalendarResult.data,
          calendarToTasks: calendarToTasksResult.data
        }
      };
    } catch (error: any) {
      console.error('❌ Errore durante la sincronizzazione iniziale:', error);
      return {
        success: false,
        error: error.message || 'Errore durante la sincronizzazione iniziale'
      };
    }
  }
}

export default GoogleCalendarService;