# Push Notifications Troubleshooting Guide

Questo documento serve per analizzare l'app mobile e verificare che le notifiche push siano configurate correttamente.

## Come Funziona il Sistema

```
SERVER (FastAPI)                         APP MOBILE                      DISPOSITIVO
      │                                       │                               │
      │  1. Task creato con end_time          │                               │
      │  2. PostgreSQL trigger → NOTIFY       │                               │
      │  3. Listener riceve evento            │                               │
      │  4. Timer asyncio attende end_time    │                               │
      │  5. Invio a Expo/Firebase ───────────►│◄──── Firebase/APNs ──────────►│
      │                                       │      consegna al SO           │
      │                                       │                               │
      │                                       │  6. SO mostra notifica        │
      │                                       │     (anche con app chiusa!)   │
```

**IMPORTANTE:** Le push notification funzionano anche quando:
- L'app è completamente chiusa
- Il telefono è in sleep/sospensione
- L'utente non sta usando il telefono

Il Sistema Operativo (Android/iOS) gestisce la ricezione, NON l'app.

---

## Checklist per l'App Mobile

### 1. Registrazione Token Push

L'app DEVE ottenere e inviare il token al server. Verificare:

```javascript
// Con Expo
import * as Notifications from 'expo-notifications';

// Ottenere il token
const token = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-expo-project-id' // OBBLIGATORIO per EAS Build
});

// Il token ha questo formato:
// ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
```

**Cosa controllare:**
- [ ] `getExpoPushTokenAsync()` viene chiamato?
- [ ] Il `projectId` è configurato correttamente?
- [ ] Il token viene salvato/loggato per debug?

### 2. Invio Token al Server

Il token DEVE essere inviato al backend dopo il login:

```javascript
// Endpoint del server
POST /notifications/token
Headers: {
  "Authorization": "Bearer <jwt_token>",
  "X-API-Key": "<api_key>"
}
Body: {
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

**Cosa controllare:**
- [ ] La chiamata API viene fatta dopo login/registrazione?
- [ ] La chiamata include l'header `X-API-Key`?
- [ ] La chiamata include il JWT token?
- [ ] Viene gestito il caso di errore?
- [ ] Il token viene re-inviato se cambia?

### 3. Richiesta Permessi

L'utente DEVE accettare i permessi per le notifiche:

```javascript
import * as Notifications from 'expo-notifications';

// Richiedere permessi
const { status: existingStatus } = await Notifications.getPermissionsAsync();
let finalStatus = existingStatus;

if (existingStatus !== 'granted') {
  const { status } = await Notifications.requestPermissionsAsync();
  finalStatus = status;
}

if (finalStatus !== 'granted') {
  // PROBLEMA: Utente ha negato i permessi
  // Mostrare messaggio che spiega perché servono
  return;
}
```

**Cosa controllare:**
- [ ] I permessi vengono richiesti al momento giusto (non al primo avvio)?
- [ ] C'è un messaggio che spiega perché servono le notifiche?
- [ ] Viene gestito il caso `denied`?
- [ ] C'è un modo per l'utente di riabilitarli dalle impostazioni?

### 4. Configurazione Expo/Firebase

#### Per Expo (app.json / app.config.js):

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ],
    "android": {
      "googleServicesFile": "./google-services.json",
      "useNextNotificationsApi": true
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

**Cosa controllare:**
- [ ] Il plugin `expo-notifications` è configurato?
- [ ] `google-services.json` esiste per Android?
- [ ] `GoogleService-Info.plist` esiste per iOS?
- [ ] I file Firebase sono quelli corretti del progetto?

#### Per React Native puro (senza Expo):

```javascript
// android/app/build.gradle
apply plugin: 'com.google.gms.google-services'

// ios: GoogleService-Info.plist in Xcode
```

### 5. Gestione Notifiche in Foreground

Quando l'app è APERTA, devi decidere come mostrare le notifiche:

```javascript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,  // Mostra alert anche con app aperta
    shouldPlaySound: true,  // Riproduci suono
    shouldSetBadge: true,   // Aggiorna badge icona
  }),
});
```

**Cosa controllare:**
- [ ] `setNotificationHandler` è configurato?
- [ ] Le notifiche si vedono quando l'app è in foreground?

### 6. Listener per Click su Notifica

Quando l'utente clicca sulla notifica:

```javascript
// Listener per quando l'utente clicca sulla notifica
const responseListener = Notifications.addNotificationResponseReceivedListener(
  (response) => {
    const data = response.notification.request.content.data;
    // data contiene: { task_id, task_title, ... }

    // Navigare alla schermata del task
    navigation.navigate('TaskDetail', { taskId: data.task_id });
  }
);

// Cleanup
return () => {
  Notifications.removeNotificationSubscription(responseListener);
}
```

**Cosa controllare:**
- [ ] Il listener è registrato?
- [ ] La navigazione funziona quando si clicca?
- [ ] Il listener viene rimosso al unmount?

---

## Problemi Comuni e Soluzioni

### Problema 1: Token non viene generato

**Sintomi:** `getExpoPushTokenAsync()` fallisce o restituisce undefined

**Cause possibili:**
- `projectId` mancante o errato
- App non buildata con EAS (development client)
- Simulatore iOS (non supporta push)

**Soluzioni:**
```javascript
// Verificare che sia un dispositivo fisico
import * as Device from 'expo-device';

if (!Device.isDevice) {
  console.log('Push notifications non funzionano sul simulatore');
  return;
}

// Usare projectId da app.json
const token = await Notifications.getExpoPushTokenAsync({
  projectId: Constants.expoConfig?.extra?.eas?.projectId,
});
```

### Problema 2: Token non arriva al server

**Sintomi:** Database ha `fcm_token = NULL` per l'utente

**Debug:**
```javascript
// Loggare il token
console.log('Push Token:', token.data);

// Verificare la risposta del server
const response = await fetch('/notifications/token', { ... });
console.log('Server response:', await response.json());
```

**Verificare sul server:**
```bash
# Controllare i log del server per errori
# Verificare nel database
SELECT id, username, fcm_token FROM users WHERE username = 'test_user';
```

### Problema 3: Notifiche non arrivano con app chiusa

**Sintomi:** Funziona con app aperta, non con app chiusa

**Cause possibili:**
- **Android:** App in "battery optimization" aggressiva
- **iOS:** Permessi non configurati correttamente
- **Entrambi:** Token non valido/scaduto

**Soluzioni Android:**
```javascript
// Verificare e richiedere esclusione da battery optimization
import * as IntentLauncher from 'expo-intent-launcher';

// Mostrare dialog per escludere app da ottimizzazione batteria
IntentLauncher.startActivityAsync(
  IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
);
```

**Soluzioni iOS:**
- Verificare che "Background App Refresh" sia abilitato
- Verificare permessi notifiche nelle Impostazioni

### Problema 4: Notifiche arrivano in ritardo

**Sintomi:** Notifica arriva minuti/ore dopo

**Cause possibili:**
- **Android Doze Mode:** Il sistema ritarda le notifiche per risparmiare batteria
- **Priorità bassa:** La notifica non ha priorità "high"

**Soluzione Server (già implementata):**
Il server invia con priorità alta, ma verificare in `expo_push_service.py`:
```python
PushMessage(
    to=expo_token,
    title=title,
    body=body,
    data=data,
    priority='high',  # IMPORTANTE per Android
    sound="default"
)
```

### Problema 5: Notifiche non mostrano contenuto su iOS

**Sintomi:** Notifica arriva ma mostra solo "Nuova notifica"

**Causa:** iOS richiede che `title` e `body` siano sempre presenti

**Verifica server:** Il payload deve avere sempre:
```python
{
    "title": "Titolo task",  # NON può essere vuoto
    "body": "Descrizione",   # NON può essere vuoto
    "data": { ... }
}
```

### Problema 6: Token cambia e vecchio non funziona

**Sintomi:** Funzionava, poi ha smesso

**Causa:** Il token Expo/FCM può cambiare in alcuni casi:
- Reinstallazione app
- Clear data app
- Aggiornamento major di Firebase SDK

**Soluzione:**
```javascript
// Listener per cambio token
Notifications.addPushTokenListener((token) => {
  // Re-inviare al server
  sendTokenToServer(token.data);
});
```

---

## Debug dal Server

### Verificare Token Utente

```bash
# Endpoint di debug
GET /notifications/debug/user-info
Authorization: Bearer <jwt_token>
X-API-Key: <api_key>

# Risposta:
{
  "fcm_token": "ExponentPushToken[xxx...]",
  "token_type": "expo",
  "timezone": "Europe/Rome",
  ...
}
```

### Inviare Notifica di Test

```bash
# Endpoint di test
POST /notifications/test-notification
Authorization: Bearer <jwt_token>
X-API-Key: <api_key>
Body: {
  "title": "Test",
  "body": "Questa è una notifica di test",
  "data": {"test": "true"}
}
```

### Verificare Stato Scheduler

```bash
# Controllare notifiche pendenti
GET /notifications/notification-status/{task_id}

# Risposta:
{
  "notification_sent": false,
  "notification_scheduled": true,
  "end_time": "2024-01-15T10:00:00Z"
}
```

---

## Configurazione Android Specifica

### AndroidManifest.xml (se React Native puro)

```xml
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>

<application>
  <!-- Canale notifiche default -->
  <meta-data
    android:name="com.google.firebase.messaging.default_notification_channel_id"
    android:value="default"/>
</application>
```

### Notification Channel (Android 8+)

```javascript
// Creare canale notifiche
if (Platform.OS === 'android') {
  await Notifications.setNotificationChannelAsync('task-reminders', {
    name: 'Task Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    sound: 'default',
  });
}
```

---

## Configurazione iOS Specifica

### Info.plist

```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

### Capabilities in Xcode

1. Aprire progetto in Xcode
2. Selezionare target
3. Tab "Signing & Capabilities"
4. Aggiungere "Push Notifications"
5. Aggiungere "Background Modes" → selezionare "Remote notifications"

---

## Test Checklist Finale

### Sul Dispositivo:
- [ ] Permessi notifiche abilitati (Impostazioni > App > Notifiche)
- [ ] App non in "risparmio batteria aggressivo"
- [ ] Connessione internet attiva
- [ ] Google Play Services aggiornato (Android)

### Nell'App:
- [ ] Token generato correttamente
- [ ] Token inviato al server
- [ ] Server risponde 200 OK
- [ ] Notification handler configurato
- [ ] Listener per click configurato

### Sul Server:
- [ ] Token salvato nel database
- [ ] PostgreSQL triggers applicati
- [ ] Notification listener attivo
- [ ] Test notification funziona

### Test End-to-End:
1. Creare task con `end_time` tra 1 minuto
2. Chiudere completamente l'app
3. Aspettare che arrivi la notifica
4. Cliccare sulla notifica
5. Verificare che apra l'app sul task giusto

---

## Contatti Debug

**Endpoint debug server:** `GET /notifications/debug/user-info`

**Log server:** Controllare stdout per errori di invio notifiche

**Database query:**
```sql
-- Verificare token utente
SELECT id, username, fcm_token, timezone FROM users WHERE id = <user_id>;

-- Verificare task e stato notifica
SELECT id, title, end_time, notification_sent, retry_count
FROM tasks WHERE user_id = <user_id> ORDER BY end_time DESC;

-- Verificare storico notifiche
SELECT * FROM notifications WHERE user_id = <user_id> ORDER BY notification_date DESC;
```
