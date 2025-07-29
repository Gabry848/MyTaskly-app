# Implementazione Timezone in Axios Interceptor

## Sommario
È stata implementata una funzionalità nell'intercettore Axios che rileva automaticamente il timezone del dispositivo e lo invia al server dopo ogni login riuscito.

## Implementazione

### 1. Modifica ai file principali

#### `src/services/axiosInterceptor.ts`
- Aggiunta funzione `getDeviceTimezone()` che utilizza `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Aggiunta funzione `sendTimezoneToServer()` che invia il timezone all'endpoint `/api/notifications/timezone`
- Modificato l'intercettore delle risposte per rilevare login riusciti e triggerare l'invio del timezone

#### `src/constants/authConstants.ts`
- Aggiunto endpoint `TIMEZONE: "/api/notifications/timezone"` alla lista degli endpoint API

### 2. Logica di funzionamento

```typescript
// 1. Rilevamento timezone del dispositivo
const getDeviceTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    return 'UTC'; // Fallback sicuro
  }
};

// 2. Invio timezone al server
const sendTimezoneToServer = async (bearerToken: string): Promise<void> => {
  const timezone = getDeviceTimezone();
  await axios.post('/api/notifications/timezone', 
    { timezone }, 
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
};
```

### 3. Trigger automatico

L'intercettore rileva automaticamente:
- Richieste a URL contenenti `/auth/login` o `/login`
- Risposta con status 200
- Presenza di un bearer token nella risposta (`bearerToken`, `access_token`, o `token`)

Quando tutte le condizioni sono soddisfatte, invia automaticamente il timezone al server.

### 4. Formato JSON inviato

```json
{
  "timezone": "Europe/Rome"
}
```

### 5. Headers della richiesta

```
Authorization: Bearer <token>
Content-Type: application/json
```

## Caratteristiche

### ✅ Vantaggi
- **Automatico**: Non richiede modifiche al codice esistente del login
- **Non bloccante**: L'invio del timezone avviene in background
- **Robusto**: Gestisce errori senza interrompere il flusso di login
- **Cross-platform**: Funziona su iOS, Android e Web
- **Fallback sicuro**: Usa UTC se il timezone non può essere rilevato

### 🔧 Configurabile
- Endpoint timezone configurabile in `authConstants.ts`
- Logica di rilevamento URL estendibile
- Gestione errori personalizzabile

### 🚀 Performance
- Esecuzione asincrona (non blocca la UI)
- Chiamata singola per login
- Cached dal browser per richieste successive

## Test

È stato creato `test/test_timezone.js` che verifica:
- ✅ Rilevamento timezone del dispositivo
- ✅ Formattazione JSON corretta
- ✅ Rilevamento URL di login
- ✅ Pulizia token Bearer

Per eseguire i test:
```bash
node test/test_timezone.js
```

## Supporto timezone

La funzione supporta tutti i timezone IANA, esempi:
- `Europe/Rome`
- `America/New_York`
- `Asia/Tokyo`
- `UTC`

## Compatibilità

- ✅ React Native (iOS/Android)
- ✅ Expo
- ✅ Web browsers
- ✅ Node.js environments

## Note tecniche

1. **Sicurezza**: Il token viene automaticamente pulito (rimozione prefisso "Bearer " se presente)
2. **Resilienza**: Errori nell'invio timezone non compromettono il login
3. **Logging**: Tutto è tracciato nei log per debugging
4. **Evita loop**: L'endpoint timezone non triggera se stesso

L'implementazione è completa e pronta per la produzione! 🎉
