import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import GoogleCalendarService, { CalendarSyncStatus } from '../services/googleCalendarService';
import { signInWithGoogle, isGoogleSignedIn, signOutFromGoogle } from '../services/googleSignInService';

export interface UseGoogleCalendarReturn {
  // Stati
  isConnected: boolean;
  isLoading: boolean;
  syncStatus: CalendarSyncStatus | null;
  error: string | null;

  // Azioni di connessione
  connectToGoogle: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Azioni di sincronizzazione
  performInitialSync: () => Promise<void>;
  syncTasksToCalendar: () => Promise<void>;
  syncCalendarToTasks: () => Promise<void>;
  
  // Utilità
  refreshStatus: () => Promise<void>;
  clearError: () => void;
}

export const useGoogleCalendar = (): UseGoogleCalendarReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<CalendarSyncStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calendarService = GoogleCalendarService.getInstance();

  // Controlla lo stato iniziale di connessione
  useEffect(() => {
    checkInitialConnectionStatus();
  }, []);

  const checkInitialConnectionStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Controlla se l'utente è loggato con Google
      const isGoogleLogged = await isGoogleSignedIn();
      
      if (isGoogleLogged) {
        // Se è loggato, verifica lo stato di sincronizzazione con il server
        const statusResult = await calendarService.getSyncStatus();
        
        if (statusResult.success && statusResult.data) {
          setIsConnected(statusResult.data.google_calendar_connected);
          setSyncStatus(statusResult.data);
        } else {
          setIsConnected(false);
          if (statusResult.error && !statusResult.error.includes('non ha autorizzato')) {
            setError(statusResult.error);
          }
        }
      } else {
        setIsConnected(false);
      }
    } catch (error: any) {
      console.error('❌ Errore nel controllo stato iniziale:', error);
      setError('Errore nel controllo dello stato di connessione');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const connectToGoogle = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Esegui il login con Google
      const signInResult = await signInWithGoogle();
      
      if (!signInResult.success) {
        throw new Error(signInResult.message || 'Errore durante il login con Google');
      }

      // Il server usa OAuth2 web, ma noi usiamo Google Sign-In SDK
      // Dobbiamo informare il server che abbiamo effettuato l'accesso con Google
      console.log('✅ Google Sign-In completato, ora controllo connessione server...');
      
      const statusResult = await calendarService.getSyncStatus();
      
      if (statusResult.success && statusResult.data) {
        setIsConnected(statusResult.data.google_calendar_connected);
        setSyncStatus(statusResult.data);

        if (statusResult.data.google_calendar_connected) {
          // Connessione già riconosciuta dal server
          Alert.alert(
            'Connessione riuscita!',
            'Vuoi sincronizzare i tuoi task esistenti con Google Calendar?',
            [
              { text: 'Più tardi', style: 'cancel' },
              { text: 'Sincronizza', onPress: () => performInitialSync() }
            ]
          );
        } else {
          // Il server non riconosce la connessione Google
          // Questo è normale perché usa OAuth2 web, non Google Sign-In SDK
          console.log('⚠️ Il server non ha riconosciuto la connessione Google (normale per Google Sign-In SDK)');
          
          // Per ora mostriamo un messaggio che la connessione è avvenuta lato client
          // ma il server necessita di integrazione aggiuntiva
          Alert.alert(
            'Connessione Google completata',
            'La connessione con Google è stata effettuata. Tuttavia, il server necessita di configurazione aggiuntiva per riconoscere i token Google Sign-In.\n\nContattare lo sviluppatore per completare l\'integrazione.',
            [{ text: 'OK' }]
          );
          
          // Impostiamo comunque come connesso lato client perché Google Sign-In è riuscito
          setIsConnected(true);
        }
      } else {
        // Errore nella chiamata al server
        console.log('⚠️ Errore chiamata server, ma Google Sign-In riuscito');
        Alert.alert(
          'Connessione Google completata',
          'La connessione con Google è stata effettuata correttamente. Le funzionalità di sincronizzazione potrebbero necessitare di configurazione server aggiuntiva.',
          [{ text: 'OK' }]
        );
        
        // Impostiamo come connesso perché Google Sign-In è riuscito
        setIsConnected(true);
      }

    } catch (error: any) {
      console.error('❌ Errore nella connessione a Google Calendar:', error);
      setError(error.message || 'Errore durante la connessione');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Esegui il logout da Google
      const signOutResult = await signOutFromGoogle();
      
      if (!signOutResult.success) {
        throw new Error(signOutResult.message || 'Errore durante la disconnessione');
      }

      // Aggiorna lo stato locale
      setIsConnected(false);
      setSyncStatus(null);

      Alert.alert(
        'Disconnessione completata',
        'Il tuo account Google Calendar è stato disconnesso con successo.',
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      console.error('❌ Errore nella disconnessione:', error);
      setError(error.message || 'Errore durante la disconnessione');
    } finally {
      setIsLoading(false);
    }
  };

  const performInitialSync = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const syncResult = await calendarService.performInitialSync();
      
      if (!syncResult.success) {
        throw new Error(syncResult.error || 'Errore durante la sincronizzazione iniziale');
      }

      // Aggiorna lo stato dopo la sincronizzazione
      await refreshStatus();

      Alert.alert(
        'Sincronizzazione completata!',
        `Task sincronizzati: ${syncResult.results?.tasksToCalendar?.synced_count || 0}\n` +
        `Eventi importati: ${syncResult.results?.calendarToTasks?.synced_count || 0}`,
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      console.error('❌ Errore nella sincronizzazione iniziale:', error);
      setError(error.message || 'Errore durante la sincronizzazione iniziale');
    } finally {
      setIsLoading(false);
    }
  };

  const syncTasksToCalendar = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const syncResult = await calendarService.syncTasksToCalendar();
      
      if (!syncResult.success) {
        throw new Error(syncResult.error || 'Errore durante la sincronizzazione dei task');
      }

      await refreshStatus();

      Alert.alert(
        'Task sincronizzati!',
        `${syncResult.data?.synced_count || 0} task sono stati sincronizzati con Google Calendar.`,
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      console.error('❌ Errore nella sincronizzazione task → calendario:', error);
      setError(error.message || 'Errore durante la sincronizzazione dei task');
    } finally {
      setIsLoading(false);
    }
  };

  const syncCalendarToTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const syncResult = await calendarService.syncCalendarToTasks();
      
      if (!syncResult.success) {
        throw new Error(syncResult.error || 'Errore durante l\'importazione degli eventi');
      }

      await refreshStatus();

      Alert.alert(
        'Eventi importati!',
        `${syncResult.data?.synced_count || 0} eventi sono stati importati come task.`,
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      console.error('❌ Errore nella sincronizzazione calendario → task:', error);
      setError(error.message || 'Errore durante l\'importazione degli eventi');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStatus = async () => {
    try {
      const statusResult = await calendarService.getSyncStatus();
      
      if (statusResult.success && statusResult.data) {
        setSyncStatus(statusResult.data);
        setIsConnected(statusResult.data.google_calendar_connected);
      }
    } catch (error: any) {
      console.error('❌ Errore nell\'aggiornamento dello stato:', error);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    // Stati
    isConnected,
    isLoading,
    syncStatus,
    error,

    // Azioni
    connectToGoogle,
    disconnect,
    performInitialSync,
    syncTasksToCalendar,
    syncCalendarToTasks,
    
    // Utilità
    refreshStatus,
    clearError,
  };
};