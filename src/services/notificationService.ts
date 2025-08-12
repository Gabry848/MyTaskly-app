import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import axiosInstance from './axiosInstance';

// Controllo se siamo in Expo Go o Development Build
const isExpoGo = Constants.appOwnership === 'expo';
const isDevBuild = Constants.executionEnvironment === 'standalone';

// ⚙️ CONFIGURA COME GESTIRE LE NOTIFICHE
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,    // Mostra il popup quando l'app è aperta
    shouldPlaySound: true,    // Riproduce il suono
    shouldSetBadge: true,     // Aggiorna il badge dell'app
    shouldShowBanner: true,   // Mostra il banner
    shouldShowList: true,     // Mostra nella lista notifiche
  }),
});

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
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    console.log('✅ Canale Android configurato');
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
 */
export async function sendTokenToBackend(token: string): Promise<boolean> {
  try {
    const response = await axiosInstance.post('/notifications/token', {
      token: token
    });

    if (response.status === 200) {
      console.log('✅ Token inviato al backend con successo');
      return true;
    } else {
      console.error('❌ Errore nell\'invio del token al backend');
      return false;
    }
  } catch (error) {
    console.error('❌ Errore nella richiesta:', error);
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
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // 🎯 REGISTRA PER LE NOTIFICHE ALL'AVVIO
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        // Invia il token al backend solo se abbiamo un token valido
        sendTokenToBackend(token).then(success => {
          if (success) {
            Alert.alert('Successo', 'Notifiche push attivate!');
          } else {
            Alert.alert('Errore', 'Impossibile attivare le notifiche push');
          }
        });
      } else if (isExpoGo) {
        // In Expo Go, modalità silenziosa
        console.log('ℹ️ Modalità Expo Go attiva');
      }
    });

    // 📨 ASCOLTA NOTIFICHE RICEVUTE (quando l'app è aperta)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📨 Notifica ricevuta:', notification);
      setNotification(notification);
      
      // Puoi fare azioni specifiche qui
      if (notification.request.content.data?.notification_type === 'task_due') {
        Alert.alert(
          '⏰ Task in Scadenza!', 
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
    };
  }, []);

  return {
    expoPushToken,
    notification,
    sendTestNotification: () => sendTestNotification(),
  };
}
