import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateAuthData } from './authService';
import axios from './axiosInstance';
import { API_ENDPOINTS } from '../constants/authConstants';

// Configurazione Google Sign-In
const GOOGLE_CONFIG = {
  iosClientId: '643213673162-7lk71d5c0ov3703qo5c8mrcfsqipdjlp.apps.googleusercontent.com',
  webClientId: '643213673162-a0sge7ioso04bpt8lf8febr51fjsgjd8.apps.googleusercontent.com',
  offlineAccess: true,
  hostedDomain: '',
  forceCodeForRefreshToken: true,
  accountName: '',
  scopes: ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/calendar'],
};

/**
 * Inizializza Google Sign-In con la configurazione appropriata
 */
export const initializeGoogleSignIn = async (): Promise<void> => {
  try {
    await GoogleSignin.configure({
      ...GOOGLE_CONFIG,
      // Usa webClientId per Android e iosClientId per iOS
      webClientId: GOOGLE_CONFIG.webClientId,
      iosClientId: Platform.OS === 'ios' ? GOOGLE_CONFIG.iosClientId : undefined,
    });
    
    console.log('✅ Google Sign-In configurato correttamente');
  } catch (error) {
    console.error('❌ Errore nella configurazione di Google Sign-In:', error);
    throw error;
  }
};

/**
 * Controlla se l'utente è già loggato con Google
 */
export const isGoogleSignedIn = async (): Promise<boolean> => {
  try {
    const currentUser = await GoogleSignin.getCurrentUser();
    return currentUser !== null;
  } catch (error) {
    console.error('❌ Errore nel controllo stato Google Sign-In:', error);
    return false;
  }
};

/**
 * Ottiene le informazioni dell'utente corrente da Google
 */
export const getCurrentGoogleUser = async () => {
  try {
    const userInfo = await GoogleSignin.getCurrentUser();
    return {
      success: true,
      userInfo,
    };
  } catch (error: any) {
    console.error('❌ Errore nel recupero utente Google corrente:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Esegue il login con Google
 */
export const signInWithGoogle = async () => {
  try {
    // Controlla se i Google Play Services sono disponibili
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    // Esegui il sign-in
    const userInfo = await GoogleSignin.signIn();
    
    console.log('✅ Login Google completato:', {
      id: userInfo.data?.user.id,
      email: userInfo.data?.user.email,
      name: userInfo.data?.user.name,
    });

    // Ottieni i token
    const tokens = await GoogleSignin.getTokens();
    
    console.log('✅ Token Google ottenuti', tokens);

    // Verifica se esiste un refresh token
    console.log('🔍 Refresh token disponibile:', tokens.refreshToken ? 'Sì' : 'No');

    // Invia i dati al tuo backend per l'autenticazione
    const backendResult = await authenticateWithBackend(userInfo, tokens);
    
    if (backendResult.success) {
      // Salva i dati dell'utente localmente
      await updateAuthData({
        bearerToken: backendResult.bearerToken,
        refreshToken: backendResult.refreshToken,
        loginTime: new Date().toISOString(),
        bearerDuration: backendResult.bearerDuration,
        refreshDuration: backendResult.refreshDuration,
        username: userInfo.data?.user.name,
        email: userInfo.data?.user.email,
        utente_id: backendResult.utente_id,
        googleAccessToken: tokens.accessToken,
        googleIdToken: tokens.idToken,
      });

      return {
        success: true,
        userInfo: userInfo.data?.user,
        message: 'Login con Google completato con successo',
        bearerToken: backendResult.bearerToken,
      };
    } else {
      // Se l'autenticazione con il backend fallisce, esegui il logout da Google
      await signOutFromGoogle();
      return {
        success: false,
        message: backendResult.message || 'Errore nell\'autenticazione con il backend',
        error: backendResult.error,
      };
    }

  } catch (error: any) {
    console.error('❌ Errore durante il login con Google:', error);
    
    let errorMessage = 'Errore durante il login con Google';
    
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      errorMessage = 'Login cancellato dall\'utente';
    } else if (error.code === statusCodes.IN_PROGRESS) {
      errorMessage = 'Login già in corso';
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      errorMessage = 'Google Play Services non disponibili';
    } else {
      errorMessage = error.message || errorMessage;
    }

    return {
      success: false,
      message: errorMessage,
      error: error,
    };
  }
};

/**
 * Autentica l'utente con il backend usando i dati di Google
 */
const authenticateWithBackend = async (userInfo: any, tokens: any) => {
  try {
    const loginData = {
      google_access_token: tokens.accessToken,
      google_refresh_token: tokens.refreshToken || null,
      google_client_id: GOOGLE_CONFIG.webClientId,
      google_client_secret: null, // Il client secret non dovrebbe essere esposto nel frontend
      googleAccessToken: tokens.accessToken, // Mantengo per compatibilità
      googleIdToken: tokens.idToken,
      userProfile: {
        id: userInfo.data?.user.id,
        email: userInfo.data?.user.email,
        name: userInfo.data?.user.name,
        photo: userInfo.data?.user.photo,
        familyName: userInfo.data?.user.familyName,
        givenName: userInfo.data?.user.givenName,
      }
    };

    console.log('📤 Invio parametri al backend:', {
      google_access_token: tokens.accessToken ? '***' + tokens.accessToken.slice(-10) : 'N/A',
      google_refresh_token: tokens.refreshToken ? '***' + tokens.refreshToken.slice(-10) : 'N/A',
      google_client_id: GOOGLE_CONFIG.webClientId,
      google_client_secret: 'null (sicurezza)',
      googleAccessToken: tokens.accessToken ? '***' + tokens.accessToken.slice(-10) : 'N/A',
      googleIdToken: tokens.idToken ? '***' + tokens.idToken.slice(-10) : 'N/A',
      userEmail: userInfo.data?.user.email,
    });

    // Invia i dati a un endpoint del tuo backend per l'autenticazione Google
    const response = await axios.post(
      `${API_ENDPOINTS.GOOGLE_LOGIN}`, // Nuovo endpoint per Google Sign-In
      loginData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const { bearer_token, refresh_token, bearer_duration, refresh_duration, utente_id } = response.data;

    return {
      success: true,
      bearerToken: bearer_token,
      refreshToken: refresh_token,
      bearerDuration: bearer_duration,
      refreshDuration: refresh_duration,
      utente_id: utente_id,
      message: 'Autenticazione backend completata',
    };

  } catch (error: any) {
    console.error('❌ Errore nell\'autenticazione con il backend:', error);
    
    // Se è un errore 404, significa che l'endpoint non esiste ancora
    if (error.response?.status === 404) {
      return {
        success: false,
        message: 'Endpoint Google Sign-In non ancora implementato nel backend',
        error: error,
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || 'Errore nell\'autenticazione con il backend',
      error: error,
    };
  }
};

/**
 * Esegue il logout da Google
 */
export const signOutFromGoogle = async () => {
  try {
    const currentUser = await GoogleSignin.getCurrentUser();
    
    if (currentUser) {
      await GoogleSignin.signOut();
      console.log('✅ Logout da Google completato');
    }

    // Rimuovi i token Google dal storage locale
    await AsyncStorage.multiRemove([
      'auth.googleAccessToken',
      'auth.googleIdToken',
    ]);

    return {
      success: true,
      message: 'Logout da Google completato',
    };

  } catch (error: any) {
    console.error('❌ Errore durante il logout da Google:', error);
    return {
      success: false,
      message: 'Errore durante il logout da Google',
      error: error,
    };
  }
};

/**
 * Revoca l'accesso dell'utente (rimuove completamente l'autorizzazione)
 */
export const revokeGoogleAccess = async () => {
  try {
    await GoogleSignin.revokeAccess();
    console.log('✅ Accesso Google revocato');

    // Rimuovi i token Google dal storage locale
    await AsyncStorage.multiRemove([
      'auth.googleAccessToken',
      'auth.googleIdToken',
    ]);

    return {
      success: true,
      message: 'Accesso Google revocato con successo',
    };

  } catch (error: any) {
    console.error('❌ Errore nella revoca dell\'accesso Google:', error);
    return {
      success: false,
      message: 'Errore nella revoca dell\'accesso Google',
      error: error,
    };
  }
};

/**
 * Ottiene i token di Google attuali
 */
export const getGoogleTokens = async () => {
  try {
    const tokens = await GoogleSignin.getTokens();
    return {
      success: true,
      tokens,
    };
  } catch (error: any) {
    console.error('❌ Errore nel recupero dei token Google:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Aggiorna i token di Google (se necessario)
 */
export const refreshGoogleTokens = async () => {
  try {
    // Prova a fare un signin silenzioso per aggiornare i token
    const userInfo = await GoogleSignin.getCurrentUser();
    const tokens = await GoogleSignin.getTokens();
    
    // Salva i nuovi token
    await AsyncStorage.setItem('auth.googleAccessToken', tokens.accessToken);
    if (tokens.idToken) {
      await AsyncStorage.setItem('auth.googleIdToken', tokens.idToken);
    }
    
    return {
      success: true,
      tokens,
      userInfo: userInfo,
    };
    
  } catch (error: any) {
    console.error('❌ Errore nell\'aggiornamento dei token Google:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Esporta tutte le funzioni necessarie
 */
export {
  GOOGLE_CONFIG,
};
