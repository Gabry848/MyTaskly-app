import { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, API_ENDPOINTS } from '../constants/authConstants';
import { getValidToken, refreshToken } from './authService';
import axios from './axiosInstance';

// Flag per evitare loop infiniti durante il refresh
let isRefreshing = false;
let failedQueue: any[] = [];
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 2;

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

/**
 * Interceptor per le richieste - aggiunge automaticamente il bearer token
 */
axios.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const authHeaderValue = config.headers.Authorization as string;
    console.log('[AXIOS] Richiesta in uscita:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL || ''}${config.url || ''}`,
      hasAuthHeader: !!config.headers.Authorization,
      authHeader: authHeaderValue ? 
        `${authHeaderValue.substring(0, 30)}...` : 'N/A'
    });
    
    // Se la richiesta ha già un token Authorization, non aggiungere nulla
    if (config.headers.Authorization) {
      console.log(`[AXIOS] Token Authorization già presente nella richiesta ${config.url}:`, authHeaderValue ? `${authHeaderValue.substring(0, 30)}...` : 'VUOTO');
      return config;
    }
    
    // Escludi le richieste di login, register e refresh dall'aggiunta automatica del token
    const excludedPaths = ['/auth/login', '/auth/register', '/auth/refresh', '/login', '/register', '/refresh', 'auth/login', 'auth/register', 'auth/refresh', '/email/send-verification', '/email/verification-status'];
    const isExcluded = excludedPaths.some(path => config.url?.includes(path));
    
    if (!isExcluded) {
      try {
        // Per l'interceptor, controlliamo prima se abbiamo un token valido salvato
        const savedToken = await AsyncStorage.getItem(STORAGE_KEYS.BEARER_TOKEN);
        if (savedToken) {
          // Assicurati che il token non contenga già "Bearer "
          const cleanToken = savedToken.startsWith('Bearer ') ? savedToken.substring(7) : savedToken;
          config.headers.Authorization = `Bearer ${cleanToken}`;
          console.log(`[AXIOS] Token Bearer salvato aggiunto alla richiesta ${config.url}:`, `Bearer ${cleanToken.substring(0, 20)}...`);
          
          // Log specifico per /tasks per debug
          if (config.url === '/tasks' && config.method === 'post') {
            console.log(`[AXIOS] SPECIFICO /tasks POST - Token completo lunghezza: ${cleanToken.length}`);
            console.log(`[AXIOS] SPECIFICO /tasks POST - Headers finali:`, JSON.stringify(config.headers));
          }
        } else {
          console.warn('[AXIOS] Nessun token Bearer salvato disponibile per la richiesta:', config.url);
        }
      } catch (error) {
        console.warn('[AXIOS] Errore nel recupero del token Bearer per la richiesta:', error);
      }
    } else {
      console.log('[AXIOS] Richiesta esclusa dall\'aggiunta automatica del token Bearer:', config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Funzione per ottenere il timezone del dispositivo
 */
const getDeviceTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('[AXIOS] Errore nel recupero del timezone, utilizzo UTC come fallback:', error);
    return 'UTC';
  }
};

/**
 * Funzione per inviare il timezone al server dopo il login
 */
const sendTimezoneToServer = async (bearerToken: string): Promise<void> => {
  try {
    const timezone = getDeviceTimezone();
    console.log('[AXIOS] Invio timezone al server:', timezone);
    
    await axios.post(API_ENDPOINTS.TIMEZONE, 
      { timezone }, 
      {
        headers: {
          'Authorization': `Bearer ${bearerToken.startsWith('Bearer ') ? bearerToken.substring(7) : bearerToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('[AXIOS] Timezone inviato con successo al server');
  } catch (error) {
    console.error('[AXIOS] Errore nell\'invio del timezone al server:', error);
    // Non blocchiamo il login se l'invio del timezone fallisce
  }
};

/**
 * Interceptor per le risposte - gestisce automaticamente errori 401 (Unauthorized) e login success
 */
axios.interceptors.response.use(
  async (response: AxiosResponse) => {
    // Controlla se è una risposta di login riuscito
    const isLoginRequest = response.config.url?.includes('/auth/login') || response.config.url?.includes('/login');
    
    if (isLoginRequest && response.status === 200 && response.data) {
      console.log('[AXIOS] Login riuscito, controllo presenza bearer token per invio timezone...');
      
      // Cerca il bearer token nella risposta
      let bearerToken = null;
      
      // Controlla se il token è nella risposta
      if (response.data.bearerToken) {
        bearerToken = response.data.bearerToken;
      } else if (response.data.access_token) {
        bearerToken = response.data.access_token;
      } else if (response.data.token) {
        bearerToken = response.data.token;
      }
      
      // Se abbiamo un token, invia il timezone
      if (bearerToken) {
        console.log('[AXIOS] Bearer token trovato nella risposta, invio timezone...');
        // Esegui l'invio del timezone in background senza bloccare la risposta del login
        sendTimezoneToServer(bearerToken).catch(error => {
          console.error('[AXIOS] Errore nell\'invio del timezone in background:', error);
        });
      } else {
        console.warn('[AXIOS] Nessun bearer token trovato nella risposta del login');
      }
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Aggiungi un contatore di tentativi di refresh per evitare loop infiniti
    if (!originalRequest._refreshAttempts) {
      originalRequest._refreshAttempts = 0;
    }
    
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest._refreshAttempts < MAX_REFRESH_ATTEMPTS) {
      console.log(`🔴 Errore 401 ricevuto (tentativo ${originalRequest._refreshAttempts + 1}/${MAX_REFRESH_ATTEMPTS}), tentativo di refresh del token per:`, originalRequest.url);
      
      originalRequest._refreshAttempts++;
      
      // Evita richieste di refresh multiple contemporanee
      if (isRefreshing) {
        console.log('⏳ Refresh già in corso, aggiungendo richiesta alla coda...');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(async token => {
          // Salva il nuovo token in AsyncStorage anche per le richieste in coda
          if (token) {
            await AsyncStorage.setItem(STORAGE_KEYS.BEARER_TOKEN, token as string);
            console.log('💾 Nuovo token salvato in AsyncStorage (da coda)');
          }
          
          // Assicurati che l'header Authorization sia nel formato corretto
          const tokenStr = token as string;
          // Rimuovi "Bearer " se già presente nel token per evitare duplicazione
          const cleanToken = tokenStr.startsWith('Bearer ') ? tokenStr.substring(7) : tokenStr;
          originalRequest.headers.Authorization = `Bearer ${cleanToken}`;
          // NON marcare come processata - deve passare attraverso l'interceptor per logging
          // ma rimuovi il flag retry per evitare loop infiniti
          delete (originalRequest as any)._retryAfterRefresh;
          console.log(`🔄 Ripetendo richiesta dalla coda con nuovo token per ${originalRequest.url}: Bearer ${cleanToken?.substring(0, 20)}...`);
          return axios(originalRequest);
        }).catch(err => {
          console.error('❌ Errore nel ripetere richiesta dalla coda:', err.message);
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔑 Tentativo di refresh del token...');
        const refreshResult = await refreshToken();
        
        if (refreshResult.success && refreshResult.bearerToken) {
          console.log(`✅ Refresh token riuscito (${refreshResult.bearerToken.substring(0, 20)}...), ripetendo richiesta originale`);
          
          // Salva il nuovo token in AsyncStorage per le richieste future
          await AsyncStorage.setItem(STORAGE_KEYS.BEARER_TOKEN, refreshResult.bearerToken);
          console.log('💾 Nuovo token salvato in AsyncStorage');
          
          processQueue(null, refreshResult.bearerToken);
          // Assicurati che l'header Authorization sia nel formato corretto
          // Rimuovi "Bearer " se già presente nel token per evitare duplicazione
          const cleanToken = refreshResult.bearerToken.startsWith('Bearer ') ? 
            refreshResult.bearerToken.substring(7) : refreshResult.bearerToken;
          originalRequest.headers.Authorization = `Bearer ${cleanToken}`;
          // NON marcare come processata - deve passare attraverso l'interceptor per il nuovo token
          // ma rimuovi il flag retry per evitare loop infiniti  
          delete (originalRequest as any)._retryAfterRefresh;
          console.log(`🔄 Header Authorization impostato per richiesta originale: Bearer ${cleanToken.substring(0, 20)}...`);
          console.log(`🔄 Tentativo di ripetere richiesta POST ${originalRequest.url} con dati:`, originalRequest.data);
          return axios(originalRequest);
        } else {
          console.log('❌ Refresh token fallito, pulendo dati di autenticazione');
          processQueue(new Error('Token refresh fallito'), null);
          
          // Rimuovi tutti i dati di autenticazione se il refresh fallisce
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.BEARER_TOKEN,
            STORAGE_KEYS.REFRESH_TOKEN,
            STORAGE_KEYS.LOGIN_TIME,
            STORAGE_KEYS.BEARER_DURATION,
            STORAGE_KEYS.REFRESH_DURATION,
            STORAGE_KEYS.USER_DATA
          ]);
          
          // Qui potresti emettere un evento per reindirizzare al login
          // eventEmitter.emit("authenticationFailed");
          
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('Errore durante il refresh del token:', refreshError);
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Se abbiamo raggiunto il limite di tentativi di refresh, logga e rifiuta
    if (error.response?.status === 401 && originalRequest._refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
      console.error(`🚫 Limite di tentativi di refresh raggiunto (${MAX_REFRESH_ATTEMPTS}) per:`, originalRequest.url);
      console.error('🔴 Autenticazione fallita definitivamente - potrebbe essere necessario un nuovo login');
    }
    
    return Promise.reject(error);
  }
);

export default axios;
