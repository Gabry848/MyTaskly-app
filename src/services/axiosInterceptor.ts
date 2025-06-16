import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/authConstants';
import { getValidToken } from './authService';

// Flag per evitare loop infiniti durante il refresh
let isRefreshing = false;
let failedQueue: any[] = [];

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
    // Escludi le richieste di login, register e refresh dall'aggiunta automatica del token
    const excludedPaths = ['/login', '/register', '/refresh'];
    const isExcluded = excludedPaths.some(path => config.url?.includes(path));
    
    if (!isExcluded) {
      try {
        const token = await getValidToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Errore nel recupero del token per la richiesta:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor per le risposte - gestisce automaticamente errori 401 (Unauthorized)
 */
axios.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Evita richieste di refresh multiple contemporanee
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const token = await getValidToken();
        
        if (token) {
          processQueue(null, token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        } else {
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
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default axios;
