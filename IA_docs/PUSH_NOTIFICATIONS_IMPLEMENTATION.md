# 🔔 Sistema di Notifiche Push - Taskly

## 📋 Panoramica

Il sistema di notifiche push è stato implementato utilizzando `expo-notifications` e supporta:

- ✅ **Notifiche Push Remote** (dal backend)
- ✅ **Notifiche Locali Programmate**
- ✅ **Gestione Permessi Automatica**
- ✅ **Debug e Testing Integrato**

## 🚀 Funzionalità Implementate

### 1. **Configurazione Automatica**
- Richiesta automatica dei permessi all'avvio
- Registrazione del token Expo Push
- Invio del token al backend per le notifiche remote

### 2. **Notifiche Remote**
- Ricezione notifiche dal backend quando i task sono in scadenza
- Gestione automatica delle notifiche quando l'app è aperta/chiusa
- Navigazione automatica ai task quando si tocca una notifica

### 3. **Notifiche Locali**
- Programmazione di notifiche per date specifiche
- Cancellazione di notifiche programmate
- Gestione completa del ciclo di vita delle notifiche

### 4. **Debug e Testing**
- Schermata dedicata per il debug (`Settings > Debug Notifiche`)
- Visualizzazione del token Expo
- Test delle notifiche con un pulsante
- Risoluzione problemi integrata

## 📱 Come Utilizzare

### Per gli Sviluppatori

1. **Testare le Notifiche**:
   ```bash
   # Avvia l'app su un dispositivo fisico
   npm start
   # Vai in Settings > Debug Notifiche
   # Premi "Invia Notifica di Test"
   ```

2. **Programmare Notifiche Locali**:
   ```typescript
   import { scheduleLocalNotification } from '../services/notificationService';
   
   const scheduleTaskReminder = async (taskTitle: string, dueDate: Date) => {
     const notificationId = await scheduleLocalNotification(
       'Task in Scadenza!',
       `Il task "${taskTitle}" scade tra poco`,
       dueDate,
       { action: 'open_task', task_id: 123 }
     );
   };
   ```

3. **Gestire Notifiche Remote dal Backend**:
   ```typescript
   // Il sistema invia automaticamente il token al backend
   // Endpoint: POST /notifications/token
   // Body: { token: "ExponentPushToken[...]" }
   ```

### Per gli Utenti

1. **Attivazione**:
   - L'app chiederà automaticamente i permessi al primo avvio
   - Accettare i permessi quando richiesti

2. **Testare**:
   - Andare in `Impostazioni`
   - Toccare `Debug Notifiche`
   - Premere `Invia Notifica di Test`

## 🔧 Configurazione Backend

Il backend deve supportare questi endpoint:

### 1. **Registrazione Token**
```
POST /notifications/token
Headers: Authorization: Bearer <jwt_token>
Body: {
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

### 2. **Invio Notifica di Test**
```
POST /notifications/test-notification
Headers: Authorization: Bearer <jwt_token>
Body: {
  "title": "Test",
  "body": "Messaggio di test",
  "data": { "test": true }
}
```

### 3. **Notifiche Task in Scadenza**
```
POST https://exp.host/--/api/v2/push/send
Headers: {
  "Accept": "application/json",
  "Accept-encoding": "gzip, deflate",
  "Content-Type": "application/json"
}
Body: {
  "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "title": "Task in Scadenza!",
  "body": "Il task 'Completare progetto' scade tra 1 ora",
  "data": {
    "action": "open_task",
    "task_id": 123,
    "notification_type": "task_due"
  }
}
```

## 📂 File Implementati

### Core Services
- `src/services/notificationService.ts` - Servizio principale
- `components/NotificationManager.tsx` - Componente di gestione

### Debug e Testing
- `src/navigation/screens/NotificationDebug.tsx` - Schermata debug
- Settings integrato con sezione notifiche

### Configurazione
- `app.json` - Plugin expo-notifications configurato
- Permessi Android automatici

## 🚨 Requisiti Importanti

### ⚠️ **Dispositivo Fisico Obbligatorio**
Le notifiche push NON funzionano su simulatori. Testare sempre su:
- iPhone/iPad fisico
- Dispositivo Android fisico

### 🌐 **Connessione Backend**
- Il backend deve essere raggiungibile dal dispositivo
- JWT token valido richiesto
- Endpoint `/notifications/*` implementati

### 🔐 **Permessi**
- L'app gestisce automaticamente i permessi
- L'utente deve accettare i permessi quando richiesti
- Controllare le impostazioni del dispositivo se i permessi vengono negati

## 🐛 Risoluzione Problemi

### ❌ Token non visualizzato
1. Controllare permessi nelle impostazioni dispositivo
2. Riavviare l'app
3. Verificare che sia un dispositivo fisico

### ❌ Notifica non ricevuta
1. Verificare connessione al backend
2. Controllare endpoint `/notifications/test-notification`
3. Verificare JWT token valido
4. Controllare log console per errori

### ❌ Errore di invio
1. Verificare URL backend corretto
2. Controllare autenticazione
3. Verificare che il backend supporti gli endpoint richiesti

## 📊 Logs di Debug

Il sistema produce logs dettagliati:

```
🎉 Token Expo ottenuto: ExponentPushToken[...]
✅ Token inviato al backend con successo
📨 Notifica ricevuta: { title: "Test", body: "..." }
👆 Notifica toccata: { ... }
📅 Notifica locale programmata: notification-id-123
```

## 🔄 Prossimi Passi

1. **Integrazione Task**: Collegare le notifiche ai task esistenti
2. **Notifiche Ricorrenti**: Implementare promemoria ricorrenti
3. **Personalizzazione**: Permettere all'utente di configurare le notifiche
4. **Analytics**: Tracciare l'efficacia delle notifiche

---

✨ **Il sistema è ora pronto per essere utilizzato!** Segui la guida per testare e implementare le notifiche nella tua app.
