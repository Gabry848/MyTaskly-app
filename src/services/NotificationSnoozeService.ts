import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'snoozed_notifications';
const SNOOZE_DURATIONS = {
  '5min': 5 * 60 * 1000,
  '15min': 15 * 60 * 1000,
  '1hour': 60 * 60 * 1000,
  '1day': 24 * 60 * 60 * 1000,
} as const;

export type SnoozeDuration = keyof typeof SNOOZE_DURATIONS;

export interface SnoozedNotification {
  id: string;
  originalNotificationId: string;
  taskId: string;
  taskTitle: string;
  snoozedAt: number;
  resendAt: number;
  snoozeDuration: SnoozeDuration;
  notificationData: any;
}

/**
 * Servizio per gestire l'snooze delle notifiche
 */
export class NotificationSnoozeService {
  private static snoozeTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Ritorna le durate di snooze disponibili
   */
  static getAvailableSnoozes(): Array<{ duration: SnoozeDuration; label: string; minutes: number }> {
    return [
      { duration: '5min', label: '5 minuti', minutes: 5 },
      { duration: '15min', label: '15 minuti', minutes: 15 },
      { duration: '1hour', label: '1 ora', minutes: 60 },
      { duration: '1day', label: '1 giorno', minutes: 24 * 60 },
    ];
  }

  /**
   * Posticipa una notifica
   */
  static async snoozeNotification(
    taskId: string,
    taskTitle: string,
    snoozeDuration: SnoozeDuration,
    notificationData: any = {}
  ): Promise<void> {
    const snoozeId = uuidv4();
    const durationMs = SNOOZE_DURATIONS[snoozeDuration];
    const resendAt = Date.now() + durationMs;

    const snoozedNotification: SnoozedNotification = {
      id: snoozeId,
      originalNotificationId: '',
      taskId,
      taskTitle,
      snoozedAt: Date.now(),
      resendAt,
      snoozeDuration,
      notificationData,
    };

    try {
      // Salva nel storage
      const existing = await this.getSnoozedNotifications();
      const updated = [...existing, snoozedNotification];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Imposta il timer per re-inviare la notifica
      this.scheduleSnoozeTimer(snoozeId, taskId, taskTitle, durationMs, notificationData);

      console.log(`⏱️ Notifica posticipata per ${snoozeDuration}`);
    } catch (error) {
      console.error('Errore nel salvataggio notifica posticipata:', error);
    }
  }

  /**
   * Imposta un timer per re-inviare la notifica dopo lo snooze
   */
  private static scheduleSnoozeTimer(
    snoozeId: string,
    taskId: string,
    taskTitle: string,
    durationMs: number,
    notificationData: any
  ): void {
    // Cancella timer precedente se esiste
    if (this.snoozeTimers.has(snoozeId)) {
      clearTimeout(this.snoozeTimers.get(snoozeId)!);
    }

    const timer = setTimeout(async () => {
      try {
        // Invia la notifica
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Promemoria Attività',
            body: taskTitle,
            data: {
              taskId,
              ...notificationData,
            },
            badge: 1,
            sound: 'default',
            vibrate: [100, 100, 100],
          },
          trigger: null, // Invia immediatamente
        });

        // Rimuovi dal storage
        await this.removeSnoozedNotification(snoozeId);
        this.snoozeTimers.delete(snoozeId);

        console.log(`🔔 Notifica re-inviata per ${taskTitle}`);
      } catch (error) {
        console.error('Errore nell\'invio notifica posticipata:', error);
      }
    }, durationMs);

    this.snoozeTimers.set(snoozeId, timer);
  }

  /**
   * Recupera tutte le notifiche posticipate
   */
  static async getSnoozedNotifications(): Promise<SnoozedNotification[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Errore nel recupero notifiche posticipate:', error);
      return [];
    }
  }

  /**
   * Rimuove una notifica posticipata
   */
  static async removeSnoozedNotification(snoozeId: string): Promise<void> {
    try {
      const existing = await this.getSnoozedNotifications();
      const updated = existing.filter(n => n.id !== snoozeId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Errore nella rimozione notifica posticipata:', error);
    }
  }

  /**
   * Cancella uno snooze (non reinvia la notifica)
   */
  static async cancelSnooze(snoozeId: string): Promise<void> {
    try {
      if (this.snoozeTimers.has(snoozeId)) {
        clearTimeout(this.snoozeTimers.get(snoozeId)!);
        this.snoozeTimers.delete(snoozeId);
      }
      await this.removeSnoozedNotification(snoozeId);
      console.log(`❌ Snooze cancellato per ${snoozeId}`);
    } catch (error) {
      console.error('Errore nella cancellazione dello snooze:', error);
    }
  }

  /**
   * Reinizializza gli snooze al restart dell'app
   */
  static async reinitializeSnoozes(): Promise<void> {
    try {
      const snoozed = await this.getSnoozedNotifications();
      const now = Date.now();

      for (const notification of snoozed) {
        const remainingTime = notification.resendAt - now;

        if (remainingTime > 0) {
          // Richedula il timer
          this.scheduleSnoozeTimer(
            notification.id,
            notification.taskId,
            notification.taskTitle,
            remainingTime,
            notification.notificationData
          );
          console.log(`⏱️ Snooze ri-inizializzato per ${notification.taskTitle}`);
        } else {
          // Il tempo è passato, invia la notifica subito
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Promemoria Attività',
              body: notification.taskTitle,
              data: {
                taskId: notification.taskId,
                ...notification.notificationData,
              },
              badge: 1,
              sound: 'default',
              vibrate: [100, 100, 100],
            },
            trigger: null,
          });
          await this.removeSnoozedNotification(notification.id);
        }
      }
    } catch (error) {
      console.error('Errore nella reinizializzazione snooze:', error);
    }
  }

  /**
   * Ritorna il numero di notifiche posticipate
   */
  static async getSnoozedCount(): Promise<number> {
    const snoozed = await this.getSnoozedNotifications();
    return snoozed.length;
  }

  /**
   * Ottiene il label per una durata
   */
  static getSnoozeLabel(duration: SnoozeDuration): string {
    const snooze = this.getAvailableSnoozes().find(s => s.duration === duration);
    return snooze?.label || duration;
  }
}
