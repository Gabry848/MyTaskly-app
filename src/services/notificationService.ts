import { useState, useEffect, useRef } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from './axiosInstance';
import eventEmitter from '../utils/eventEmitter';
import { STORAGE_KEYS } from '../constants/authConstants';
import i18n from './i18n';

// Controllo se siamo in Expo Go o Development Build
const isExpoGo = Constants.appOwnership === 'expo';

// Chiave per salvare il token pendente in AsyncStorage
const PENDING_TOKEN_KEY = '@MyTaskly:pendingNotificationToken';

// ⚙️ CONFIGURA COME GESTIRE LE NOTIFICHE
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('🔔 Notifica ricevuta:', notification.request.content.title);
    return {
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});


/**
 * Funzione per verificare e richiedere l'esclusione dalla battery optimization
 * CRITICO per ricevere notifiche in stand-by su Android
 */
export async function checkBatteryOptimization(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    console.log('🔋 Verifica battery optimization...');

    // Mostra un alert educativo all'utente
    Alert.alert(
      '🔋 Impostazioni Batteria Importanti',
      'Per ricevere notifiche anche quando il telefono è in stand-by, devi disabilitare l\'ottimizzazione della batteria per MyTaskly.\n\nQuesto permetterà all\'app di svegliarsi per mostrarti le notifiche dei task in scadenza.',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Apri Impostazioni',
          onPress: async () => {
            try {
              // Apri le impostazioni dell'app
              await Linking.openSettings();
              console.log('✅ Impostazioni aperte');
            } catch (error) {
              console.error('❌ Errore apertura impostazioni:', error);
              Alert.alert(
                'Errore',
                'Non è stato possibile aprire le impostazioni automaticamente.\n\nApri manualmente: Impostazioni > App > MyTaskly > Batteria > Non ottimizzare'
              );
            }
          },
        },
      ]
    );
  } catch (error) {
    console.error('❌ Errore verifica battery optimization:', error);
  }
}

/**
 * Funzione per ottenere i permessi e il token push
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  console.log('🔍 Inizio registrazione notifiche push...');
  console.log('📱 Device.isDevice:', Device.isDevice);
  console.log('📱 Constants.appOwnership:', Constants.appOwnership);
  console.log('📱 Constants.executionEnvironment:', Constants.executionEnvironment);

  // ⚠️ Controllo compatibilità con Expo Go
  if (isExpoGo) {
    console.log('ℹ️ Modalità Expo Go: le notifiche push remote non sono supportate');
    // Non mostriamo più l'Alert automatico per non disturbare l'utente
    return;
  }

  // 📱 Configura il canale Android (obbligatorio)
  if (Platform.OS === 'android') {
    console.log('📱 Configurazione canale Android...');
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Task Reminders',
      description: 'Notifiche per i promemoria dei task',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true, // Bypassare la modalità Non Disturbare
    });
    console.log('✅ Canale Android configurato con priorità massima');
  }

  // 📋 Controlla se è un dispositivo fisico
  if (Device.isDevice) {
    console.log('📋 Dispositivo fisico rilevato');
    
    // Verifica permessi esistenti
    console.log('📋 Controllo permessi esistenti...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('📋 Status permessi esistenti:', existingStatus);
    let finalStatus = existingStatus;
    
    // Richiedi permessi se non li hai
    if (existingStatus !== 'granted') {
      console.log('📋 Richiesta permessi...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('📋 Nuovo status permessi:', finalStatus);
    }
    
    // Se non hai i permessi, avvisa l'utente
    if (finalStatus !== 'granted') {
      console.log('❌ Permessi notifiche non concessi');
      Alert.alert(
        'Permessi Notifiche', 
        'Le notifiche sono necessarie per ricevere aggiornamenti sui tuoi task!'
      );
      return;
    }
    
    console.log('✅ Permessi notifiche concessi');

    // 🎯 OTTIENI IL TOKEN EXPO
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId 
                   ?? Constants?.easConfig?.projectId;
    
    console.log('🎯 Project ID trovato:', projectId);
    
    if (!projectId) {
      console.log('❌ Project ID non trovato');
      Alert.alert('Errore', 'Project ID non trovato');
      return;
    }

    try {
      console.log('🎯 Richiesta token Expo Push...');
      // Questo è il token che devi inviare al backend!
      const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
      token = tokenResult.data;
      console.log('🎉 Token Expo ottenuto:', token);
    } catch (e) {
      console.error('❌ Errore nell\'ottenere il token:', e);
      console.error('❌ Stack trace:', e instanceof Error ? e.stack : 'No stack trace');
      if (isExpoGo) {
        Alert.alert(
          'Errore Token Push',
          'Impossibile ottenere il token push in Expo Go.\nUsa un development build per le notifiche push.'
        );
      } else {
        Alert.alert(
          'Errore Token Push',
          `Impossibile ottenere il token push.\nErrore: ${e instanceof Error ? e.message : e}`
        );
      }
    }
  } else {
    console.log('❌ Non è un dispositivo fisico');
    Alert.alert('Errore', 'Le notifiche funzionano solo su dispositivi fisici');
  }

  console.log('🔍 Fine registrazione notifiche push, token:', token ? 'OTTENUTO' : 'NON OTTENUTO');
  return token;
}

/**
 * Funzione per inviare il token al backend
 * Se l'invio fallisce, salva il token in AsyncStorage per ritentare successivamente
 */
export async function sendTokenToBackend(token: string, isAuthenticated: boolean = false): Promise<boolean> {
  // Verifica se l'utente è autenticato prima di inviare
  if (!isAuthenticated) {
    console.log('⏸️ Utente non autenticato, salvataggio token per invio successivo');
    try {
      await AsyncStorage.setItem(PENDING_TOKEN_KEY, token);
      console.log('💾 Token salvato in AsyncStorage');
    } catch (error) {
      console.error('❌ Errore nel salvare il token:', error);
    }
    return false;
  }

  try {
    console.log('📤 Tentativo di invio token al backend...');
    const response = await axiosInstance.post('/notifications/token', {
      token: token
    });

    if (response.status === 200) {
      console.log('✅ Token inviato al backend con successo');
      // Rimuovi il token pendente se l'invio ha successo
      try {
        await AsyncStorage.removeItem(PENDING_TOKEN_KEY);
        console.log('🗑️ Token pendente rimosso da AsyncStorage');
      } catch (error) {
        console.error('❌ Errore nella rimozione del token pendente:', error);
      }
      return true;
    } else {
      console.error('❌ Errore nell\'invio del token al backend');
      // Salva il token per ritentare successivamente
      await AsyncStorage.setItem(PENDING_TOKEN_KEY, token);
      return false;
    }
  } catch (error) {
    console.error('❌ Errore nella richiesta:', error);
    // Salva il token per ritentare successivamente
    try {
      await AsyncStorage.setItem(PENDING_TOKEN_KEY, token);
      console.log('💾 Token salvato per retry futuro');
    } catch (storageError) {
      console.error('❌ Errore nel salvare il token per retry:', storageError);
    }
    return false;
  }
}

/**
 * Funzione per ritentare l'invio di un token pendente al backend
 * Viene chiamata quando l'utente effettua il login o all'avvio dell'app se è autenticato
 */
export async function retryPendingTokenSend(isAuthenticated: boolean): Promise<boolean> {
  if (!isAuthenticated) {
    console.log('⏸️ Utente non autenticato, skip retry token');
    return false;
  }

  try {
    const pendingToken = await AsyncStorage.getItem(PENDING_TOKEN_KEY);
    
    if (pendingToken) {
      console.log('🔄 Trovato token pendente, tentativo di invio al backend...');
      const success = await sendTokenToBackend(pendingToken, isAuthenticated);
      
      if (success) {
        console.log('✅ Token pendente inviato con successo');
        return true;
      } else {
        console.log('❌ Retry invio token fallito, verrà ritentato al prossimo login');
        return false;
      }
    } else {
      console.log('ℹ️ Nessun token pendente da inviare');
      return true;
    }
  } catch (error) {
    console.error('❌ Errore nel retry del token pendente:', error);
    return false;
  }
}

/**
 * Funzione per programmare una notifica locale
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  triggerDate: Date,
  data?: any
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
    
    console.log('📅 Notifica locale programmata:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('❌ Errore nella programmazione della notifica locale:', error);
    return null;
  }
}

/**
 * Funzione per cancellare una notifica programmata
 */
export async function cancelLocalNotification(notificationId: string): Promise<boolean> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('🗑️ Notifica locale cancellata:', notificationId);
    return true;
  } catch (error) {
    console.error('❌ Errore nella cancellazione della notifica:', error);
    return false;
  }
}

/**
 * Funzione per ottenere tutte le notifiche programmate
 */
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('📋 Notifiche programmate:', notifications.length);
    return notifications;
  } catch (error) {
    console.error('❌ Errore nel recupero delle notifiche programmate:', error);
    return [];
  }
}

/**
 * Funzione per inviare una notifica di test
 */
export async function sendTestNotification(): Promise<boolean> {
  // Se siamo in Expo Go, mostra un modal invece di inviare notifica push
  if (isExpoGo) {
    console.log('📱 Simulazione notifica push (Expo Go mode)');
    
    return true;
  }

  // Altrimenti invia una notifica push tramite backend
  try {
    const response = await axiosInstance.post('/notifications/test-notification', {
      title: '🧪 Test Mytaskly',
      body: 'Notifica di test funziona! 🎉',
      data: { test: true }
    });

    if (response.status === 200) {
      console.log('✅ Notifica di test inviata');
      return true;
    } else {
      console.error('❌ Errore nell\'invio della notifica di test');
      return false;
    }
  } catch (error) {
    console.error('❌ Errore nella richiesta di test:', error);
    return false;
  }
}

/**
 * Hook personalizzato per gestire le notifiche
 */
export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState<boolean>(false);
  const [showBatteryPrompt, setShowBatteryPrompt] = useState<boolean>(false);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // 🔄 Controlla se l'utente è già autenticato e ha già concesso i permessi notifiche
    const initializeNotifications = async () => {
      try {
        const { checkAndRefreshAuth } = await import('./authService');
        const authResult = await checkAndRefreshAuth();
        
        if (authResult.isAuthenticated) {
          setIsAuthenticated(true);
          console.log('✅ Utente già autenticato all\'avvio');
          
          // Se già autenticato, registra normalmente (permessi già concessi in precedenza)
          const permissionAsked = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_PERMISSION_ASKED);
          if (permissionAsked === 'true') {
            const token = await registerForPushNotificationsAsync();
            if (token) {
              setExpoPushToken(token);
            }
          }
          
          // Riprova a inviare il token pendente se esiste
          await retryPendingTokenSend(true);
        }
      } catch (error) {
        console.error('❌ Errore nel controllo autenticazione:', error);
      }
    };
    
    initializeNotifications();

    // 👂 ASCOLTA EVENTI DI LOGIN per mostrare il prompt notifiche al primo login
    const handleLoginSuccess = async () => {
      console.log('🔐 Login riuscito, verifica permessi notifiche...');
      setIsAuthenticated(true);
      
      // Controlla se il prompt notifiche è già stato mostrato
      const permissionAsked = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_PERMISSION_ASKED);
      
      if (!permissionAsked) {
        // Primo login: mostra il custom modal per i permessi notifiche
        console.log('🔔 Primo login, mostra prompt notifiche...');
        setTimeout(() => {
          setShowNotificationPrompt(true);
        }, 2000); // Ritardo per non sovrapporre con la notifica di login riuscito
      } else {
        // Login successivi: registra normalmente senza prompt
        const token = await registerForPushNotificationsAsync();
        if (token) {
          setExpoPushToken(token);
          await sendTokenToBackend(token, true);
        }
      }
      
      // Riprova anche con eventuali token pendenti
      await retryPendingTokenSend(true);
    };

    const handleLogoutSuccess = () => {
      console.log('🔓 Logout effettuato');
      setIsAuthenticated(false);
    };

    eventEmitter.on('loginSuccess', handleLoginSuccess);
    eventEmitter.on('logoutSuccess', handleLogoutSuccess);

    // 📨 ASCOLTA NOTIFICHE RICEVUTE (quando l'app è aperta)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      
      // Puoi fare azioni specifiche qui
      if (notification.request.content.data?.notification_type === 'task_due_reminder') {
        Alert.alert(
          notification.request.content.title || 'Task in Scadenza!', 
          notification.request.content.body || 'Hai un task in scadenza'
        );
      }
    });

    // 👆 ASCOLTA QUANDO L'UTENTE TOCCA UNA NOTIFICA
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notifica toccata:', response);
      
      const notificationData = response.notification.request.content.data;
      
      // Se è una notifica di task, potresti voler navigare al task
      if (notificationData?.action === 'open_task' && notificationData?.task_id) {
        console.log(`📝 Apri task con ID: ${notificationData.task_id}`);
        // Qui potresti implementare la navigazione al task specifico
        // navigation.navigate('TaskDetail', { taskId: notificationData.task_id });
      }
    });

    // 🧹 CLEANUP
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      eventEmitter.off('loginSuccess', handleLoginSuccess);
      eventEmitter.off('logoutSuccess', handleLogoutSuccess);
    };
  }, [expoPushToken]); // Dipendenza da expoPushToken per avere sempre il token aggiornato nel listener

  // Handler: utente accetta le notifiche
  const handleNotificationAccept = async () => {
    setShowNotificationPrompt(false);
    console.log('✅ Utente ha accettato di abilitare le notifiche');
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PERMISSION_ASKED, 'true');
    const token = await registerForPushNotificationsAsync();
    if (token) {
      setExpoPushToken(token);
      await sendTokenToBackend(token, true);
      // Dopo aver ottenuto le notifiche, mostra battery prompt su Android (solo una volta)
      if (Platform.OS === 'android') {
        const batteryPromptShown = await AsyncStorage.getItem('@MyTaskly:batteryPromptShown');
        if (!batteryPromptShown) {
          setTimeout(() => setShowBatteryPrompt(true), 600);
        }
      }
    }
  };

  // Handler: utente rimanda le notifiche
  const handleNotificationDismiss = async () => {
    setShowNotificationPrompt(false);
    console.log('⏸️ Utente ha rimandato i permessi notifiche');
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PERMISSION_ASKED, 'true');
  };

  // Handler: utente apre impostazioni batteria
  const handleBatteryAccept = async () => {
    setShowBatteryPrompt(false);
    await AsyncStorage.setItem('@MyTaskly:batteryPromptShown', 'true');
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('❌ Errore apertura impostazioni:', error);
    }
  };

  // Handler: utente salta l'ottimizzazione batteria
  const handleBatteryDismiss = async () => {
    setShowBatteryPrompt(false);
    await AsyncStorage.setItem('@MyTaskly:batteryPromptShown', 'true');
    console.log('⏭️ Utente ha saltato battery optimization');
  };

  return {
    expoPushToken,
    notification,
    showNotificationPrompt,
    showBatteryPrompt,
    handleNotificationAccept,
    handleNotificationDismiss,
    handleBatteryAccept,
    handleBatteryDismiss,
    sendTestNotification: () => sendTestNotification(),
    checkBatteryOptimization: () => checkBatteryOptimization(),
  };
}
