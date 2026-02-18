import axiosInstance from './axiosInstance';

export interface NotificationSettings {
  push_enabled: boolean;
  push_token_type: string | null;
  telegram_enabled: boolean;
  telegram_chat_id: number | null;
  timezone: string;
  telegram_reminder_minutes: 5 | 10 | 15 | 30 | 60;
  push_notifications_enabled: boolean;
  telegram_notifications_enabled: boolean;
}

export interface NotificationSettingsUpdate {
  timezone?: string;
  telegram_reminder_minutes?: 5 | 10 | 15 | 30 | 60;
  push_notifications_enabled?: boolean;
  telegram_notifications_enabled?: boolean;
}

export const TELEGRAM_REMINDER_OPTIONS: Array<{ label: string; value: 5 | 10 | 15 | 30 | 60 }> = [
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '60 min', value: 60 },
];

/**
 * Recupera le impostazioni di notifica correnti dell'utente
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  const response = await axiosInstance.get('/notifications/settings');
  return response.data;
}

/**
 * Aggiorna le impostazioni di notifica dell'utente
 * Invia automaticamente il timezone del dispositivo se incluso nell'update
 */
export async function updateNotificationSettings(
  update: NotificationSettingsUpdate
): Promise<NotificationSettings> {
  const response = await axiosInstance.put('/notifications/settings', update);
  return response.data;
}

/**
 * Sincronizza il timezone del dispositivo con il backend
 */
export async function syncTimezone(timezone: string): Promise<NotificationSettings> {
  return updateNotificationSettings({ timezone });
}
