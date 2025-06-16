# Implementazione Refresh Token Automatico

## Modifiche Effettuate

### 1. Logica di Avvio dell'App
- **File modificato**: `src/navigation/index.tsx`
- **Modifiche**: 
  - All'avvio dell'app, viene ora controllato automaticamente lo stato del bearer token
  - Se il bearer token è scaduto ma il refresh token è ancora valido, viene tentato automaticamente il refresh
  - Solo se entrambi i token sono scaduti l'utente viene reindirizzato al login

### 2. Nuova Funzione di Autenticazione
- **File creato/modificato**: `src/services/authService.ts`
- **Nuova funzione**: `checkAndRefreshAuth()`
  - Controlla l'autenticazione e tenta automaticamente il refresh del token se necessario
  - Restituisce un oggetto con informazioni dettagliate sullo stato dell'autenticazione
  - Può essere utilizzata in altre parti dell'app per garantire sempre un token valido

### 3. Hook Personalizzati per l'Autenticazione
- **File creato**: `src/hooks/useAuth.ts`
- **Hook disponibili**:
  - `useAuth()`: Gestisce l'autenticazione con refresh automatico del token
  - `useAuthStatus()`: Fornisce informazioni dettagliate sullo stato di autenticazione senza modificare i token

### 4. Interceptor Axios per Gestione Automatica dei Token
- **File creato**: `src/services/axiosInterceptor.ts`
- **Funzionalità**:
  - Aggiunge automaticamente il bearer token a tutte le richieste HTTP (eccetto login, register, refresh)
  - Gestisce automaticamente errori 401 (Unauthorized) tentando il refresh del token
  - Previene loop infiniti durante il refresh con un sistema di coda per le richieste fallite
  - Pulisce automaticamente i dati di autenticazione se il refresh fallisce definitivamente

### 5. Aggiornamento dei Servizi API
- **File modificati**: 
  - `src/services/taskService.ts`
  - `src/services/noteService.ts`
  - `src/services/botservice.ts`
- **Modifiche**: Tutti i servizi ora utilizzano l'interceptor axios invece di axios direttamente

### 6. Aggiornamento Componenti
- **File modificato**: `components/Badge.tsx`
- **Modifiche**: Utilizza ora la nuova logica di controllo autenticazione con refresh automatico

## Come Funziona

### Scenario 1: Bearer Token Valido
- L'utente può utilizzare l'app normalmente
- Tutte le richieste API utilizzano il token esistente

### Scenario 2: Bearer Token Scaduto, Refresh Token Valido
- L'app tenta automaticamente il refresh del bearer token
- Se il refresh ha successo, l'utente continua a utilizzare l'app senza interruzioni
- Se il refresh fallisce, l'utente viene reindirizzato al login

### Scenario 3: Entrambi i Token Scaduti
- L'utente viene automaticamente reindirizzato alla schermata di login
- Tutti i dati di autenticazione vengono puliti

## Vantaggi dell'Implementazione

1. **Esperienza Utente Migliorata**: L'utente non viene mai interrotto a meno che non sia assolutamente necessario effettuare un nuovo login

2. **Sicurezza**: I token vengono sempre rinnovati automaticamente quando possibile, riducendo il rischio di utilizzo di token scaduti

3. **Trasparenza**: Tutte le chiamate API gestiscono automaticamente la validità dei token senza richiedere modifiche al codice esistente

4. **Robustezza**: Il sistema gestisce automaticamente scenari di errore e previene loop infiniti

5. **Semplicità di Utilizzo**: I nuovi hook possono essere facilmente utilizzati in qualsiasi componente che necessiti di informazioni sull'autenticazione

## Utilizzo degli Hook

```typescript
// Hook con refresh automatico
const { isAuthenticated, isLoading, checkAuth } = useAuth();

// Hook solo per informazioni sullo stato
const { isAuthenticated, canRefresh, tokenExpired, refresh } = useAuthStatus();
```

## Chiamate API Automatiche

Tutte le chiamate API ora gestiscono automaticamente:
- Aggiunta del bearer token nell'header Authorization
- Refresh automatico in caso di errore 401
- Gestione delle richieste in coda durante il refresh
- Pulizia automatica dei dati in caso di autenticazione fallita definitivamente

Questa implementazione garantisce che l'app funzioni sempre con token validi e che l'utente abbia un'esperienza fluida senza interruzioni dovute a token scaduti.
