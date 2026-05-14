import axiosInstance from './axiosInstance';

export interface WeeklySummarySettings {
  enabled: boolean;
  day: number; // 0-6, dove 0 = Domenica
  hour: number; // 0-23
  last_sent_date?: string;
  next_scheduled_date?: string;
}

/**
 * Ottiene le impostazioni correnti del riepilogo settimanale
 */
export async function getWeeklySummarySettings(): Promise<WeeklySummarySettings> {
  const response = await axiosInstance.get('/notifications/weekly-summary-settings');
  return response.data;
}

/**
 * Aggiorna le impostazioni del riepilogo settimanale
 */
export async function updateWeeklySummarySettings(
  settings: Partial<WeeklySummarySettings>
): Promise<WeeklySummarySettings> {
  const response = await axiosInstance.put('/notifications/weekly-summary-settings', settings);
  return response.data;
}
