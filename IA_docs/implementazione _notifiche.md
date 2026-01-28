Ti spiego passo passo cosa devi implementare nella tua app Expo per ricevere le notifiche push dal tuo backend! 🚀

## 📱 **Passo 1: Installazione Dipendenze**

Nella cartella del tuo progetto Expo, esegui:

```bash
npx expo install expo-notifications expo-device expo-constants
```

## 📝 **Passo 2: Configurazione Base dell'App**

Nel tuo file principale dell'app (es. `App.js` o `App.tsx`):

```javascript
import { useState, useEffect, useRef } from 'react';
import { Text, View, Button, Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// ⚙️ CONFIGURA COME GESTIRE LE NOTIFICHE
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,    // Mostra il popup quando l'app è aperta
    shouldPlaySound: true,    // Riproduce il suono
    shouldSetBadge: true,     // Aggiorna il badge dell'app
  }),
});
```

## 🔑 **Passo 3: Funzione per Ottenere i Permessi e il Token**

```javascript
async function registerForPushNotificationsAsync() {
  let token;

  // 📱 Configura il canale Android (obbligatorio)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // 📋 Controlla se è un dispositivo fisico
  if (Device.isDevice) {
    // Verifica permessi esistenti
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // Richiedi permessi se non li hai
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // Se non hai i permessi, avvisa l'utente
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permessi Notifiche', 
        'Le notifiche sono necessarie per ricevere aggiornamenti sui tuoi task!'
      );
      return;
    }
    
    // 🎯 OTTIENI IL TOKEN EXPO
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId 
                   ?? Constants?.easConfig?.projectId;
    
    if (!projectId) {
      Alert.alert('Errore', 'Project ID non trovato');
      return;
    }

    try {
      // Questo è il token che devi inviare al backend!
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('🎉 Token Expo ottenuto:', token);
    } catch (e) {
      console.error('❌ Errore nell\'ottenere il token:', e);
    }
  } else {
    Alert.alert('Errore', 'Le notifiche funzionano solo su dispositivi fisici');
  }

  return token;
}
```

## 📤 **Passo 4: Inviare il Token al Tuo Backend**

```javascript
async function sendTokenToBackend(token, userJWTToken) {
  try {
    // 🔄 SOSTITUISCI CON L'URL DEL TUO BACKEND
    const response = await fetch('http://TUO-BACKEND-URL/api/notifications/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userJWTToken}`,  // Il tuo token JWT di autenticazione
      },
      body: JSON.stringify({
        token: token  // Il token Expo che hai ottenuto
      }),
    });

    if (response.ok) {
      console.log('✅ Token inviato al backend con successo');
      Alert.alert('Successo', 'Notifiche attivate!');
    } else {
      console.error('❌ Errore nell\'invio del token al backend');
      Alert.alert('Errore', 'Impossibile attivare le notifiche');
    }
  } catch (error) {
    console.error('❌ Errore nella richiesta:', error);
    Alert.alert('Errore', 'Problema di connessione');
  }
}
```

## 👂 **Passo 5: Ascoltare le Notifiche Ricevute**

```javascript
export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // 🎯 REGISTRA PER LE NOTIFICHE ALL'AVVIO
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        // Invia il token al backend (sostituisci con il tuo JWT)
        sendTokenToBackend(token, 'IL_TUO_JWT_TOKEN_QUI');
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
          notification.request.content.body
        );
      }
    });

    // 👆 ASCOLTA QUANDO L'UTENTE TOCCA UNA NOTIFICA
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {     
      const notificationData = response.notification.request.content.data;
      
      // Se è una notifica di task, naviga al task
      if (notificationData?.action === 'open_task' && notificationData?.task_id) {
        handleOpenTask(notificationData.task_id);
      }
    });

    // 🧹 CLEANUP
    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const handleOpenTask = (taskId) => {
    // 🧭 IMPLEMENTA LA NAVIGAZIONE AL TASK
    console.log(`📝 Apri task con ID: ${taskId}`);
    // Se usi React Navigation:
    // navigation.navigate('TaskDetail', { taskId });
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        📱 Mytaskly Notifications
      </Text>
      
      {/* Mostra il token */}
      <View style={{ backgroundColor: '#f0f0f0', padding: 10, marginBottom: 20, borderRadius: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Expo Push Token:</Text>
        <Text style={{ fontSize: 10, marginTop: 5 }}>{expoPushToken}</Text>
      </View>

      {/* Mostra l'ultima notifica ricevuta */}
      {notification && (
        <View style={{ backgroundColor: '#e6f3ff', padding: 10, marginBottom: 20, borderRadius: 8 }}>
          <Text style={{ fontWeight: 'bold' }}>📨 Ultima Notifica:</Text>
          <Text>📋 {notification.request.content.title}</Text>
          <Text>💬 {notification.request.content.body}</Text>
        </View>
      )}
    </View>
  );
}
```

## 🧪 **Passo 6: Testare con Notifica di Prova**

Aggiungi un pulsante per testare:

```javascript
const sendTestNotification = async () => {
  if (!expoPushToken) {
    Alert.alert('Errore', 'Token non disponibile');
    return;
  }

  try {
    const response = await fetch('http://TUO-BACKEND-URL/api/notifications/test-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${IL_TUO_JWT_TOKEN}`,
      },
      body: JSON.stringify({
        user_id: 1, // Il tuo user ID
        title: '🧪 Test Mytaskly',
        body: 'Notifica di test funziona! 🎉',
        data: { test: true }
      }),
    });

    if (response.ok) {
      Alert.alert('✅ Successo', 'Notifica di test inviata!');
    }
  } catch (error) {
    Alert.alert('❌ Errore', 'Impossibile inviare la notifica di test');
  }
};

// Nel tuo render, aggiungi:
<Button title="🧪 Invia Test" onPress={sendTestNotification} />
```

## 🔧 **Valori da Personalizzare**

Sostituisci questi valori con i tuoi:

1. **`http://TUO-BACKEND-URL`** → URL del tuo server (es: `http://192.168.1.100:8000`)
2. **`IL_TUO_JWT_TOKEN`** → Token di autenticazione del tuo utente
3. **`user_id`** → ID dell'utente loggato
4. **Navigazione** → Integra con il tuo sistema di navigazione

## 🎯 **Risultato Finale**

Quando tutto è configurato:

1. ✅ L'app richiede i permessi per le notifiche
2. ✅ Ottiene automaticamente l'`ExpoPushToken`
3. ✅ Invia il token al tuo backend
4. ✅ Riceve notifiche quando i task sono in scadenza
5. ✅ Permette di aprire task specifici toccando la notifica

## 🚨 **Note Importanti**

- 📱 **Dispositivo fisico obbligatorio**: Le notifiche non funzionano su simulatore
- 🌐 **URL corretto**: Usa l'IP della tua macchina se testi in locale
- 🔐 **Autenticazione**: Assicurati di avere un JWT valido
- 📍 **Fuso orario**: Il sistema gestisce automaticamente i fusi orari

Ora sei pronto per ricevere le notifiche push nella tua app Expo! 🎊

Similar code found with 1 license type