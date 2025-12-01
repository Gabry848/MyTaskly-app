import { NotificationSnoozeService } from './NotificationSnoozeService';

/**
 * Inizializza il sistema di notifiche all'avvio dell'app
 */
export async function initializeNotificationSystem(): Promise<void> {
  try {
    console.log('🔔 Inizializzazione sistema notifiche...');

    // Reinizializza i timer di snooze salvati
    await NotificationSnoozeService.reinitializeSnoozes();

    console.log('✅ Sistema notifiche inizializzato');
  } catch (error) {
    console.error('❌ Errore nell\'inizializzazione notifiche:', error);
  }
}
