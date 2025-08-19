# Google Sign-In Implementation Guide

## 📋 Panoramica

È stata implementata l'integrazione completa di Google Sign-In nell'app MyTaskly usando `@react-native-google-signin/google-signin`. La nuova implementazione sostituisce completamente la precedente basata su `expo-auth-session`.

## 🔧 Configurazione

### 1. Credenziali Google OAuth

Le seguenti credenziali sono configurate in `app.json`:

```json
{
  "iosClientId": "643213673162-7lk71d5c0ov3703qo5c8mrcfsqipdjlp.apps.googleusercontent.com",
  "webClientId": "643213673162-a0sge7ioso04bpt8lf8febr51fjsgjd8.apps.googleusercontent.com"
}
```

### 2. Configurazione app.json

```json
{
  "plugins": [
    [
      "@react-native-google-signin/google-signin",
      {
        "iosUrlScheme": "com.googleusercontent.apps.643213673162-7lk71d5c0ov3703qo5c8mrcfsqipdjlp"
      }
    ]
  ]
}
```

## 🏗️ Architettura

### 1. Servizio Google Sign-In (`src/services/googleSignInService.ts`)

Servizio principale che gestisce tutte le operazioni Google Sign-In:

- **Inizializzazione**: `initializeGoogleSignIn()`
- **Login**: `signInWithGoogle()`
- **Logout**: `signOutFromGoogle()`
- **Revoca accesso**: `revokeGoogleAccess()`
- **Controllo stato**: `isGoogleSignedIn()`, `getCurrentGoogleUser()`
- **Gestione token**: `getGoogleTokens()`, `refreshGoogleTokens()`

### 2. Hook personalizzato (`src/hooks/useGoogleSignIn.ts`)

Hook React che fornisce un'interfaccia semplice per l'utilizzo del servizio:

```typescript
const { 
  isSignedIn, 
  user, 
  isLoading, 
  error, 
  signIn, 
  signOut, 
  revokeAccess 
} = useGoogleSignIn();
```

### 3. Componente Button (`components/GoogleSignInButton.tsx`)

Componente riutilizzabile per il bottone Google Sign-In con:
- Stati di caricamento
- Gestione errori
- Callback personalizzati
- Stili configurabili

## 🚀 Utilizzo

### 1. Login Screen (Implementato)

La schermata di login (`src/navigation/screens/Login.tsx`) è stata aggiornata per utilizzare il nuovo servizio:

```typescript
import { signInWithGoogle } from "../../services/googleSignInService";

async function handleGoogleSignIn() {
  try {
    setIsGoogleLoading(true);
    const result = await signInWithGoogle();
    
    if (result.success) {
      setLoginSuccess(true);
      eventEmitter.emit("loginSuccess");
      showNotification("Login con Google effettuato con successo", true);
    } else {
      showNotification(result.message || "Errore durante il login con Google.", false);
    }
  } catch (error) {
    console.error("Google Sign-In error:", error);
    showNotification("Errore durante il login con Google. Riprova più tardi.", false);
  } finally {
    setIsGoogleLoading(false);
  }
}
```

### 2. Utilizzo del Hook

```typescript
import { useGoogleSignIn } from '../src/hooks/useGoogleSignIn';

function MyComponent() {
  const { isSignedIn, user, signIn, signOut, isLoading, error } = useGoogleSignIn();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <View>
      {isSignedIn ? (
        <View>
          <Text>Benvenuto {user?.name}</Text>
          <Button title="Logout" onPress={signOut} />
        </View>
      ) : (
        <Button title="Login con Google" onPress={signIn} />
      )}
    </View>
  );
}
```

### 3. Componente Button Personalizzato

```typescript
import GoogleSignInButton from './components/GoogleSignInButton';

function LoginForm() {
  const handleGoogleSuccess = (user) => {
    console.log('User logged in:', user);
    // Naviga alla home o aggiorna lo stato dell'app
  };

  const handleGoogleError = (error) => {
    console.error('Google login error:', error);
    // Mostra errore all'utente
  };

  return (
    <GoogleSignInButton
      onSignInSuccess={handleGoogleSuccess}
      onSignInError={handleGoogleError}
      style={customStyles.button}
    />
  );
}
```

## 🔐 Integrazione Backend

Il servizio tenta di autenticare l'utente con il backend tramite l'endpoint:

```typescript
// POST /auth/login/google
const response = await axios.post(`${API_ENDPOINTS.SIGNIN}/google`, {
  googleAccessToken: tokens.accessToken,
  googleIdToken: tokens.idToken,
  userProfile: {
    id: userInfo.user.id,
    email: userInfo.user.email,
    name: userInfo.user.name,
    photo: userInfo.user.photo,
    familyName: userInfo.user.familyName,
    givenName: userInfo.user.givenName,
  }
});
```

**⚠️ IMPORTANTE**: L'endpoint `/auth/login/google` deve essere implementato nel backend per gestire l'autenticazione Google e restituire i token JWT dell'app.

## 🎯 Inizializzazione App

Il servizio Google Sign-In viene inizializzato automaticamente all'avvio dell'app tramite `AppInitializer`:

```typescript
// src/services/AppInitializer.ts
private async initializeGoogleAuth(): Promise<void> {
  try {
    console.log('[APP_INIT] Inizializzazione Google Sign-In...');
    await initializeGoogleSignIn();
    console.log('[APP_INIT] ✅ Google Sign-In inizializzato');
  } catch (error) {
    console.error('[APP_INIT] ❌ Errore nell\'inizializzazione Google Sign-In:', error);
    // Non bloccare l'app se Google Sign-In fallisce
  }
}
```

## 🔄 Flusso di Autenticazione

1. **Inizializzazione**: L'app inizializza Google Sign-In all'avvio
2. **Login**: L'utente tocca il bottone Google
3. **Autorizzazione**: Si apre il flusso OAuth di Google
4. **Token**: L'app riceve access token e ID token
5. **Backend**: I token vengono inviati al backend per la verifica
6. **JWT**: Il backend restituisce i token JWT dell'app
7. **Storage**: I token vengono salvati in AsyncStorage
8. **Navigazione**: L'utente viene reindirizzato alla home

## 🔧 Configurazione Backend Richiesta

Il backend deve implementare l'endpoint `/auth/login/google` che:

1. Verifica l'ID token Google
2. Estrae le informazioni utente
3. Crea o aggiorna l'utente nel database
4. Genera JWT token per l'app
5. Restituisce la response nel formato:

```json
{
  "bearer_token": "jwt_access_token",
  "refresh_token": "jwt_refresh_token", 
  "bearer_duration": 3600,
  "refresh_duration": 604800,
  "utente_id": 123
}
```

## 🐛 Gestione Errori

Il servizio gestisce diversi tipi di errori:

- **SIGN_IN_CANCELLED**: Utente cancella il login
- **IN_PROGRESS**: Login già in corso
- **PLAY_SERVICES_NOT_AVAILABLE**: Google Play Services non disponibili
- **Network errors**: Problemi di connessione
- **Backend errors**: Errori del server backend

## 📝 Note Importanti

1. **Google Play Services**: Richiesti su Android
2. **iOS URL Scheme**: Configurato in app.json
3. **Backend Endpoint**: Deve essere implementato per funzionare completamente
4. **Errore 404**: Se l'endpoint backend non esiste, il login mostrerà un errore appropriato
5. **Token Storage**: I token Google vengono salvati in AsyncStorage per uso futuro

## 🧪 Testing

Per testare l'implementazione:

1. **Development**: Funziona con Expo Go su Android (Google Play Services disponibili)
2. **iOS Simulator**: Richiede configurazione aggiuntiva
3. **Production**: Richiede build nativo con le configurazioni corrette

## 🔄 Prossimi Passi

1. Implementare l'endpoint `/auth/login/google` nel backend
2. Testare il flusso completo in ambiente di sviluppo
3. Configurare i progetti Google Cloud per production
4. Implementare logout e revoca dell'accesso quando necessario
5. Aggiungere gestione degli errori più granulare
