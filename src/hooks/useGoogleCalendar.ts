import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import GoogleCalendarService, { CalendarSyncStatus } from '../services/googleCalendarService';

export interface UseGoogleCalendarReturn {
  isConnected: boolean;
  isLoading: boolean;
  syncStatus: CalendarSyncStatus | null;
  error: string | null;

  connectToGoogle: () => Promise<void>;
  disconnect: () => Promise<void>;

  performInitialSync: () => Promise<void>;
  syncTasksToCalendar: () => Promise<void>;
  syncCalendarToTasks: () => Promise<void>;

  refreshStatus: () => Promise<void>;
  clearError: () => void;
}

const isInsufficientScopesError = (msg: string) =>
  msg.includes('insufficientPermissions') ||
  msg.includes('insufficient authentication scopes') ||
  msg.includes('Insufficient Permission');

export const useGoogleCalendar = (): UseGoogleCalendarReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<CalendarSyncStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calendarService = GoogleCalendarService.getInstance();

  useEffect(() => {
    refreshStatus();
  }, []);

  const refreshStatus = async () => {
    try {
      const result = await calendarService.getSyncStatus();
      if (result.success && result.data) {
        setSyncStatus(result.data);
        setIsConnected(result.data.google_calendar_connected);
      }
    } catch (err: any) {
      console.error('❌ Errore nell\'aggiornamento dello stato:', err);
    }
  };

  const connectToGoogle = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Step 1: ottieni l'URL di autorizzazione OAuth dal server
      const authResult = await calendarService.authorizeCalendar();
      if (!authResult.success || !authResult.data) {
        throw new Error(authResult.error || 'Impossibile ottenere l\'URL di autorizzazione');
      }

      // Step 2: apri il browser per il flusso OAuth
      const browserResult = await WebBrowser.openAuthSessionAsync(
        authResult.data.authorization_url,
        'mytaskly://'
      );

      if (browserResult.type === 'success') {
        const redirectUrl = browserResult.url;

        // Controlla se il redirect indica un errore
        if (redirectUrl.includes('calendar/error')) {
          const reasonMatch = redirectUrl.match(/reason=([^&]+)/);
          const reason = reasonMatch ? decodeURIComponent(reasonMatch[1]) : 'unknown';
          throw new Error(`Autorizzazione fallita: ${reason}`);
        }

        // Successo: aggiorna lo stato dal server
        await refreshStatus();

        Alert.alert(
          'Google Calendar collegato!',
          'Vuoi sincronizzare i tuoi task esistenti con Google Calendar?',
          [
            { text: 'Più tardi', style: 'cancel' },
            { text: 'Sincronizza', onPress: () => performInitialSync() },
          ]
        );
      } else if (browserResult.type === 'cancel' || browserResult.type === 'dismiss') {
        console.log('ℹ️ Autorizzazione Google Calendar annullata dall\'utente');
      }
    } catch (err: any) {
      console.error('❌ Errore nella connessione a Google Calendar:', err);
      setError(err.message || 'Errore durante la connessione');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await calendarService.disconnectCalendar();
      if (!result.success) {
        throw new Error(result.error || 'Errore durante la disconnessione');
      }

      setIsConnected(false);
      setSyncStatus(null);

      Alert.alert(
        'Disconnessione completata',
        'Google Calendar è stato scollegato con successo.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('❌ Errore nella disconnessione:', err);
      setError(err.message || 'Errore durante la disconnessione');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScopeError = () => {
    setIsConnected(false);
    setSyncStatus(null);
    Alert.alert(
      'Autorizzazione Calendar mancante',
      'Il tuo account non ha i permessi per accedere a Google Calendar. Premi "Collega" per autorizzare l\'accesso.',
      [{ text: 'OK' }]
    );
  };

  const performInitialSync = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await calendarService.performInitialSync();
      if (!result.success) {
        if (result.error && isInsufficientScopesError(result.error)) {
          handleScopeError();
          return;
        }
        throw new Error(result.error || 'Errore durante la sincronizzazione');
      }

      await refreshStatus();

      const created = result.results?.tasksToCalendar?.created_count ?? 0;
      const updated = result.results?.tasksToCalendar?.updated_count ?? 0;
      const imported = result.results?.calendarToTasks?.created_count ?? 0;

      Alert.alert(
        'Sincronizzazione completata!',
        `Task esportati: ${created} creati, ${updated} aggiornati\nEventi importati: ${imported}`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('❌ Errore nella sincronizzazione completa:', err);
      setError(err.message || 'Errore durante la sincronizzazione');
    } finally {
      setIsLoading(false);
    }
  };

  const syncTasksToCalendar = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await calendarService.syncTasksToCalendar();
      if (!result.success) {
        if (result.error && isInsufficientScopesError(result.error)) {
          handleScopeError();
          return;
        }
        throw new Error(result.error || 'Errore nella sincronizzazione dei task');
      }

      await refreshStatus();

      Alert.alert(
        'Task sincronizzati!',
        result.data?.message || 'Sincronizzazione completata.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('❌ Errore nella sincronizzazione task → calendario:', err);
      setError(err.message || 'Errore nella sincronizzazione');
    } finally {
      setIsLoading(false);
    }
  };

  const syncCalendarToTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await calendarService.syncCalendarToTasks();
      if (!result.success) {
        if (result.error && isInsufficientScopesError(result.error)) {
          handleScopeError();
          return;
        }
        throw new Error(result.error || 'Errore nell\'importazione degli eventi');
      }

      await refreshStatus();

      Alert.alert(
        'Eventi importati!',
        result.data?.message || 'Importazione completata.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('❌ Errore nella sincronizzazione calendario → task:', err);
      setError(err.message || 'Errore nell\'importazione');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    isConnected,
    isLoading,
    syncStatus,
    error,
    connectToGoogle,
    disconnect,
    performInitialSync,
    syncTasksToCalendar,
    syncCalendarToTasks,
    refreshStatus,
    clearError,
  };
};
