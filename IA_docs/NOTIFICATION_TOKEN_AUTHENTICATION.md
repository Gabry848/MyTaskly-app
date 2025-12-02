# 🔔 Sistema di Invio Token Notifiche con Autenticazione

## 📋 Panoramica

Il sistema di notifiche push è stato modificato per inviare il token Expo al backend **solo dopo un login corretto** e ritentare automaticamente l'invio ad ogni apertura dell'app se il primo tentativo fallisce.

## 🎯 Funzionalità Implementate

### 1. **Invio Token Solo Dopo Login**
- Il token push viene ottenuto all'avvio dell'app
- **NON viene inviato immediatamente** al backend
- L'invio avviene solo quando `isAuthenticated === true`

### 2. **Salvataggio Token Pendente**
- Se l'invio fallisce o l'utente non è autenticato, il token viene salvato in AsyncStorage
- Chiave di storage: `@MyTaskly:pendingNotificationToken`
- Il token rimane salvato fino all'invio riuscito

### 3. **Retry Automatico**
- **All'apertura dell'app**: Se l'utente è già autenticato, viene ritentato l'invio del token pendente
- **Al login**: Quando l'utente effettua il login, il sistema tenta di inviare sia il token corrente che eventuali token pendenti
- Il token viene rimosso da AsyncStorage solo dopo un invio riuscito

## 🔧 Modifiche Apportate

### File Modificato: `src/services/notificationService.ts`

#### 1. **Nuovi Import**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import eventEmitter from '../utils/eventEmitter';
```

#### 2. **Nuova Costante**
```typescript
const PENDING_TOKEN_KEY = '@MyTaskly:pendingNotificationToken';
```

#### 3. **Funzione `sendTokenToBackend` Modificata**
```typescript
export async function sendTokenToBackend(token: string, isAuthenticated: boolean = false): Promise<boolean>
```

**Comportamento:**
- Verifica se l'utente è autenticato prima di inviare
- Se non autenticato, salva il token in AsyncStorage per retry futuro
- Se l'invio ha successo, rimuove il token pendente
- Se l'invio fallisce, mantiene il token salvato per retry

#### 4. **Nuova Funzione `retryPendingTokenSend`**
```typescript
export async function retryPendingTokenSend(isAuthenticated: boolean): Promise<boolean>
```

**Comportamento:**
- Controlla se esiste un token pendente in AsyncStorage
- Se esiste e l'utente è autenticato, tenta l'invio al backend
- Rimuove il token se l'invio ha successo
- Mantiene il token se l'invio fallisce

#### 5. **Hook `useNotifications` Aggiornato**

**Nuove Funzionalità:**
- State `isAuthenticated` per tracciare lo stato di autenticazione
- Controllo autenticazione all'avvio con retry automatico
- Listener per eventi `loginSuccess` e `logoutSuccess`
- Dipendenza `expoPushToken` nell'useEffect per aggiornamenti dinamici

**Flusso:**
1. **All'avvio dell'app:**
   - Ottiene il token Expo
   - Controlla se l'utente è già autenticato
   - Se autenticato, ritenta l'invio di token pendenti

2. **Al login (`loginSuccess` event):**
   - Imposta `isAuthenticated = true`
   - Invia il token corrente al backend
   - Ritenta l'invio di token pendenti

3. **Al logout (`logoutSuccess` event):**
   - Imposta `isAuthenticated = false`
   - Il token verrà salvato come pendente al prossimo tentativo

## 📊 Flusso di Esecuzione

```
┌─────────────────────────────────────────┐
│         App si apre                     │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  registerForPushNotificationsAsync()    │
│  Ottiene token Expo                     │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  Controlla autenticazione               │
└───────────────┬─────────────────────────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌──────────────┐  ┌──────────────────┐
│ Autenticato  │  │ Non Autenticato  │
└──────┬───────┘  └────────┬─────────┘
       │                   │
       ▼                   ▼
┌──────────────┐  ┌──────────────────┐
│ Retry token  │  │ Attende login    │
│ pendente     │  │ Salva token      │
└──────────────┘  └────────┬─────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Utente fa login │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Event:          │
                  │ loginSuccess    │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Invia token al  │
                  │ backend         │
                  └────────┬────────┘
                           │
                   ┌───────┴───────┐
                   │               │
                   ▼               ▼
          ┌────────────┐   ┌────────────┐
          │ Successo   │   │ Fallito    │
          │ Rimuovi    │   │ Mantieni   │
          │ pendente   │   │ pendente   │
          └────────────┘   └────────────┘
```

## 🧪 Testing

### Test Case 1: Primo Avvio (Non Autenticato)
**Scenario:** L'utente apre l'app per la prima volta senza essere autenticato.

**Comportamento Atteso:**
1. Token Expo ottenuto ✅
2. Token NON inviato al backend ⏸️
3. Token salvato in AsyncStorage come pendente 💾
4. Log: "⏸️ Utente non autenticato, salvataggio token per invio successivo"

### Test Case 2: Login Dopo Primo Avvio
**Scenario:** L'utente fa login dopo aver ottenuto il token.

**Comportamento Atteso:**
1. Event `loginSuccess` emesso ✅
2. Listener rileva l'evento 👂
3. Token inviato al backend 📤
4. Token pendente rimosso da AsyncStorage 🗑️
5. Log: "✅ Token inviato al backend dopo il login"

### Test Case 3: Apertura App con Utente Già Autenticato
**Scenario:** L'utente riapre l'app essendo già autenticato.

**Comportamento Atteso:**
1. Controllo autenticazione all'avvio ✅
2. `isAuthenticated = true` 🔐
3. Retry automatico di token pendenti 🔄
4. Log: "✅ Utente già autenticato all'avvio"

### Test Case 4: Fallimento Invio al Backend
**Scenario:** L'invio del token al backend fallisce (errore di rete/endpoint non disponibile).

**Comportamento Atteso:**
1. Tentativo di invio fallisce ❌
2. Token rimane salvato in AsyncStorage 💾
3. Al prossimo login, nuovo tentativo di invio 🔄
4. Log: "❌ Errore nell'invio del token al backend"

### Test Case 5: Logout
**Scenario:** L'utente effettua il logout.

**Comportamento Atteso:**
1. Event `logoutSuccess` emesso ✅
2. `isAuthenticated = false` 🔓
3. Token future non verranno inviati fino al prossimo login ⏸️

## 📝 Log di Debug

Il sistema genera log dettagliati per facilitare il debugging:

```typescript
// Token ottenuto
"🔔 Token ottenuto, attendendo autenticazione per l'invio al backend"

// Utente non autenticato
"⏸️ Utente non autenticato, salvataggio token per invio successivo"
"💾 Token salvato in AsyncStorage"

// Login riuscito
"🔐 Login riuscito, tentativo di invio token al backend..."
"✅ Token inviato al backend dopo il login"

// Retry all'avvio
"✅ Utente già autenticato all'avvio"
"🔄 Trovato token pendente, tentativo di invio al backend..."

// Invio fallito
"❌ Errore nell'invio del token al backend"
"💾 Token salvato per retry futuro"

// Successo
"✅ Token inviato al backend con successo"
"🗑️ Token pendente rimosso da AsyncStorage"

// Nessun token pendente
"ℹ️ Nessun token pendente da inviare"
```

## ⚠️ Note Importanti

### Backend Requirements
Il backend deve implementare l'endpoint:
```
POST /notifications/token
Headers: Authorization: Bearer <jwt_token>
Body: { "token": "ExponentPushToken[...]" }
```

### Sicurezza
- Il token viene inviato **solo con autenticazione JWT valida**
- L'invio avviene tramite `axiosInstance` che gestisce automaticamente il Bearer token
- Il token è memorizzato localmente ma non esposto

### Performance
- Il retry è automatico ma non impatta le performance
- Il controllo autenticazione all'avvio è asincrono
- Il token viene salvato in AsyncStorage per persistenza

## 🔄 Compatibilità

- ✅ Expo Go (modalità limitata)
- ✅ Development Build
- ✅ Android & iOS
- ✅ Funziona con sistema di autenticazione esistente

## 📚 Riferimenti

- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [Event Emitter Pattern](../src/utils/eventEmitter.ts)
- [Auth Service](../src/services/authService.ts)

---

**Ultima Modifica:** 29 Novembre 2025  
**Autore:** GitHub Copilot  
**Versione:** 1.0
