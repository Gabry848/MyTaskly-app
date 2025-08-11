import axiosInstance from './axiosInstance';

export interface VoiceSettings {
  voice_model: 'base' | 'advanced';
  voice_gender: 'female' | 'male';
  voice_quality: 'low' | 'medium' | 'high' | 'ultra';
}

/**
 * Recupera le impostazioni vocali correnti dell'utente
 * @returns {Promise<VoiceSettings>} Le impostazioni vocali dell'utente
 */
export async function getVoiceSettings(): Promise<VoiceSettings> {
  try {
    const response = await axiosInstance.get('/auth/voice-settings');
    return response.data;
  } catch (error: any) {
    console.error('Errore nel recupero delle impostazioni vocali:', error);
    
    // Restituisci impostazioni di default in caso di errore
    return {
      voice_model: 'base',
      voice_gender: 'female',
      voice_quality: 'medium'
    };
  }
}

/**
 * Aggiorna le impostazioni vocali dell'utente
 * @param {VoiceSettings} settings Le nuove impostazioni vocali
 * @returns {Promise<boolean>} True se l'aggiornamento è riuscito
 */
export async function updateVoiceSettings(settings: VoiceSettings): Promise<boolean> {
  try {
    const response = await axiosInstance.put('/auth/voice-settings', settings);
    return response.status === 200;
  } catch (error: any) {
    console.error('Errore nell\'aggiornamento delle impostazioni vocali:', error);
    return false;
  }
}

/**
 * Valori validi per le impostazioni vocali
 */
export const VOICE_SETTINGS_OPTIONS = {
  voice_model: [
    { label: 'Base', value: 'base' as const },
    { label: 'Avanzato', value: 'advanced' as const }
  ],
  voice_gender: [
    { label: 'Femminile', value: 'female' as const },
    { label: 'Maschile', value: 'male' as const }
  ],
  voice_quality: [
    { label: 'Bassa', value: 'low' as const },
    { label: 'Media', value: 'medium' as const },
    { label: 'Alta', value: 'high' as const },
    { label: 'Ultra', value: 'ultra' as const }
  ]
};
