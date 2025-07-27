import dayjs from "dayjs";
import axios from "./axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS, DEFAULT_BASE_URL, API_ENDPOINTS } from "../constants/authConstants";

// Inizializzazione dell'app
async function initializeAuth() {
  // Carica la baseURL per axios
  const baseUrl = await AsyncStorage.getItem(STORAGE_KEYS.BASE_URL);

  // Valore predefinito se non trovato
  await AsyncStorage.setItem(STORAGE_KEYS.BASE_URL, DEFAULT_BASE_URL);
  axios.defaults.baseURL = DEFAULT_BASE_URL;
}

// Esegui l'inizializzazione
initializeAuth();

// Funzioni di utilità per AsyncStorage
async function getUserData() {
  try {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Errore nel recupero dei dati utente:", error);
    return null;
  }
}

async function setUserData(data: any) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
  } catch (error) {
    console.error("Errore nel salvataggio dei dati utente:", error);
  }
}

// Funzione per aggiornare i dati di autenticazione
async function updateAuthData(data: any) {
  try {
    if (data.bearerToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.BEARER_TOKEN, data.bearerToken);
    }
    if (data.refreshToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
    }
    if (data.loginTime) {
      await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_TIME, data.loginTime);
    }
    if (data.bearerDuration) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.BEARER_DURATION,
        data.bearerDuration.toString()
      );
    }
    if (data.refreshDuration) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.REFRESH_DURATION,
        data.refreshDuration.toString()
      );
    }
    if (data.username) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, data.username);
    }
    if (data.email) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, data.email);
    }
    if (data.utente_id) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, data.utente_id.toString());
    }
    if (data.password) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PASSWORD, data.password);
    }

    // Aggiorna anche i dati utente aggregati
    const userData = (await getUserData()) || {};
    const updatedUserData = { ...userData, ...data };
    await setUserData(updatedUserData);

  } catch (error) {
    console.error(
      "Errore durante l'aggiornamento dei dati di autenticazione:",
      error
    );
  }
}

/**
 * Esegue il login dell'utente
 *
 * @param {string} email - L'email dell'utente
 * @param {string} password - La password dell'utente
 * @returns {Promise<Object>} - Un oggetto che contiene lo stato del login e i token
 */
async function login(username: any, password: any) {
  try {
    // Esegui la richiesta di login e gestisci gli errori
    const response = await axios.post(
      API_ENDPOINTS.SIGNIN,
      {
        username: username,
        password: password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Estrai i dati dalla risposta
    const { bearer_token, refresh_token, bearer_duration, refresh_duration } =
      response.data;

    // Calcola le date di scadenza
    const currentTime = dayjs();
    const tokenExpiration = bearer_duration
      ? currentTime.add(parseInt(bearer_duration), "second")
      : null;
    const refreshTokenExpiration = refresh_duration
      ? currentTime.add(parseInt(refresh_duration), "second")
      : null;

    // Aggiorna i dati dell'utente
    await updateAuthData({
      bearerToken: bearer_token,
      refreshToken: refresh_token,
      loginTime: currentTime.format(),
      bearerDuration: bearer_duration,
      refreshDuration: refresh_duration,
      username: username,
      password: password, // TODO: aggiungere l'email e l'id dell'utente
    });

    return {
      success: true,
      bearerToken: bearer_token,
      refreshToken: refresh_token,
      tokenExpiration: tokenExpiration?.format(),
      refreshTokenExpiration: refreshTokenExpiration?.format(),
      message: "Login effettuato con successo",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Errore durante il login",
      error: error,
    };
  }
}

/**
 * Registra un nuovo utente
 *
 * @param {string} username - Il nome utente desiderato
 * @param {string} email - L'email dell'utente
 * @param {string} password - La password dell'utente
 * @returns {Promise<Object>} - Un oggetto che contiene lo stato della registrazione
 */
async function register(username: string, email: string, password: string) {
  try {
    // Esegui la richiesta di registrazione
    const response = await axios.post(
      API_ENDPOINTS.SIGNUP,
      {
        name: username,
        email: email,
        password: password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Estrai i dati dalla risposta
    const { user_id } = response.data;

    // Salva dati limitati dell'utente
    // await updateAuthData({
    //   username: username,
    //   email: email,
    //   utente_id: utente_id
    // });

    return {
      success: true,
      utente_id: user_id,
      message:
        "Registrazione effettuata con successo. Effettua il login per continuare.",
    };
  } catch (error: any) {
    console.error("❌ Errore durante la registrazione:", error.message);
    if (error.response) {
      console.error("Dettagli errore:", error.response.data);
      console.error("Status code:", error.response.status);
    }

    return {
      success: false,
      message:
        error.response?.data?.message || "Errore durante la registrazione",
      statusCode: error.response?.status,
      error: error,
    };
  }
}

/**
 * Checks if the authentication tokens have expired based on their duration and login time.
 *
 * @returns {Promise<Object>} An object with the following properties:
 *   @property {boolean} isAuthenticated - True if the access token has not expired.
 *   @property {boolean} canRefresh - True if the refresh token has not expired.
 *   @property {boolean} tokenExpired - True if the access token is expired.
 *   @property {boolean} refreshTokenExpired - True if the refresh token is expired.
 *   @property {number} timeSinceLogin - Seconds elapsed since login.
 *   @property {number} timeUntilExpiration - Seconds remaining until token expiration.
 *   @property {number} timeUntilRefreshExpiration - Seconds remaining until refresh token expiration.
 */
async function check_login() {
  try {
    const loginTime = await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TIME);
    const bearerDuration = await AsyncStorage.getItem(
      STORAGE_KEYS.BEARER_DURATION
    );
    const refreshDuration = await AsyncStorage.getItem(
      STORAGE_KEYS.REFRESH_DURATION
    );

    // Verifica se i parametri necessari sono presenti
    if (!loginTime) {
      return {
        isAuthenticated: false,
        canRefresh: false,
        tokenExpired: true,
        refreshTokenExpired: true,
        timeSinceLogin: 0,
        timeUntilExpiration: 0,
        timeUntilRefreshExpiration: 0,
      };
    }

    // Converti loginTime in oggetto dayjs
    const loginTimeObj = dayjs(loginTime);
    const currentTime = dayjs();

    // Calcola il tempo trascorso dal login in secondi
    const secondsSinceLogin = currentTime.diff(loginTimeObj, "second");

    // Converti le durate in secondi
    const bearerDurationSeconds = bearerDuration
      ? parseInt(bearerDuration, 10)
      : 0;
    const refreshDurationSeconds = refreshDuration
      ? parseInt(refreshDuration, 10)
      : 0;

    // Calcola il tempo rimanente prima della scadenza
    const timeUntilExpiration = bearerDurationSeconds - secondsSinceLogin;
    const timeUntilRefreshExpiration =
      refreshDurationSeconds - secondsSinceLogin;

    // Determina se i token sono scaduti
    const isTokenExpired = timeUntilExpiration <= 0;
    const isRefreshTokenExpired = timeUntilRefreshExpiration <= 0;

    // Aggiorna il risultato con lo stato dei token
    return {
      isAuthenticated: !isTokenExpired,
      canRefresh: !isRefreshTokenExpired,
      tokenExpired: isTokenExpired,
      refreshTokenExpired: isRefreshTokenExpired,
      timeSinceLogin: secondsSinceLogin,
      timeUntilExpiration: Math.max(0, timeUntilExpiration),
      timeUntilRefreshExpiration: Math.max(0, timeUntilRefreshExpiration),
      loginTime: loginTimeObj.format(),
      currentTime: currentTime.format(),
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      canRefresh: false,
      tokenExpired: true,
      refreshTokenExpired: true,
      timeSinceLogin: 0,
      timeUntilExpiration: 0,
      timeUntilRefreshExpiration: 0,
    };
  }
}

/**
 * Rinnova il token di accesso utilizzando il refresh token
 *
 * @returns {Promise<Object>} - Un oggetto che contiene lo stato dell'operazione e i nuovi token
 */
async function refreshToken() {
  try {
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    // Verifica se è disponibile un refresh token
    if (!refreshToken) {
      return {
        success: false,
        message: "Nessun refresh token disponibile",
      };
    }

    // Esegui la richiesta di refresh
    const response = await axios.post(
      API_ENDPOINTS.REFRESH,
      {
        refresh_token: refreshToken,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Estrai i dati dalla risposta
    const { bearer_token, refresh_token, bearerDuration, refreshDuration } =
      response.data;

    // Calcola le date di scadenza
    const currentTime = dayjs();
    const tokenExpiration = bearerDuration
      ? currentTime.add(parseInt(bearerDuration), "second")
      : null;
    const refreshTokenExpiration = refreshDuration
      ? currentTime.add(parseInt(refreshDuration), "second")
      : null;

    // Aggiorna i dati dell'utente
    await updateAuthData({
      bearerToken: bearer_token,
      refreshToken: refresh_token || refreshToken, // Mantieni il vecchio refresh token se non ne viene fornito uno nuovo
      loginTime: currentTime.format(),
      bearerDuration: bearerDuration,
      refreshDuration: refreshDuration,
    });

    return {
      success: true,
      bearerToken: bearer_token,
      refreshToken: refresh_token,
      tokenExpiration: tokenExpiration?.format(),
      refreshTokenExpiration: refreshTokenExpiration?.format(),
      message: "Token rinnovato con successo",
    };
  } catch (error: any) {
    // Se il refresh token è scaduto o non funziona, esegui il logout
    if (error.response?.status === 401) {
      await logout();
    }

    return {
      success: false,
      message:
        error.response?.data?.message || "Errore durante il refresh del token",
      error: error,
    };
  }
}

/**
 * Carica tutti i dati salvati da AsyncStorage
 */
async function loadStoredData() {
  try {
    // Caricare i dati di configurazione di base
    const baseUrl = await AsyncStorage.getItem(STORAGE_KEYS.BASE_URL);
    if (baseUrl) {
      axios.defaults.baseURL = baseUrl;
    }

    // Verificare se ci sono dati di autenticazione salvati
    const userData = await getUserData();
    return userData !== null;
  } catch (error) {

    return false;
  }
}

/**
 * Esegue il logout dell'utente rimuovendo tutti i dati di autenticazione
 */
async function logout() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.BEARER_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_TIME);
    await AsyncStorage.removeItem(STORAGE_KEYS.BEARER_DURATION);
    await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_DURATION);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_NAME);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_ID);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_PASSWORD);

    return { success: true, message: "Logout effettuato con successo" };
  } catch (error) {
    console.error("Errore durante il logout:", error);
    return { success: false, message: "Errore durante il logout" };
  }
}

export async function getValidToken(): Promise<string | null> {
  try {
    const loginStatus = await check_login();
    if (!loginStatus.isAuthenticated) {
      // Token scaduto, prova a fare il refresh
      const refreshResult = await refreshToken();
      if (!refreshResult.success || !refreshResult.bearerToken) {
        return null;
      }
      return refreshResult.bearerToken;
    }
    // Token ancora valido, recupera quello esistente
    const bearerToken = await AsyncStorage.getItem(STORAGE_KEYS.BEARER_TOKEN);
    if (!bearerToken) {
      return null;
    }
    return bearerToken;
  } catch (error) {

    return null;
  }
}

/**
 * Controlla l'autenticazione e tenta automaticamente il refresh del token se necessario
 * Questa funzione è utile per essere chiamata all'avvio dell'app o quando si accede a risorse protette
 * 
 * @returns {Promise<Object>} Un oggetto che indica se l'utente è autenticato dopo eventuali tentativi di refresh
 */
async function checkAndRefreshAuth(): Promise<{ 
  isAuthenticated: boolean; 
  message: string; 
  needsLogin: boolean;
}> {
  try {
    const authStatus = await check_login();
    
    // Se l'utente è già autenticato, restituisci true
    if (authStatus.isAuthenticated) {
      return {
        isAuthenticated: true,
        message: "Utente già autenticato",
        needsLogin: false
      };
    }
    
    // Se il bearer token è scaduto ma il refresh token è ancora valido
    if (authStatus.canRefresh && !authStatus.refreshTokenExpired) {
      console.log("Bearer token scaduto, tentativo di refresh automatico...");
      
      const refreshResult = await refreshToken();
      
      if (refreshResult.success) {
        console.log("Token aggiornato con successo tramite refresh");
        return {
          isAuthenticated: true,
          message: "Token aggiornato con successo",
          needsLogin: false
        };
      } else {
        console.log("Refresh token fallito");
        return {
          isAuthenticated: false,
          message: "Refresh token scaduto o non valido",
          needsLogin: true
        };
      }
    }
    
    // Se entrambi i token sono scaduti
    return {
      isAuthenticated: false,
      message: "Sessione scaduta, è necessario effettuare nuovamente il login",
      needsLogin: true
    };
    
  } catch (error) {
    console.error("Errore nel controllo autenticazione:", error);
    return {
      isAuthenticated: false,
      message: "Errore nel controllo autenticazione",
      needsLogin: true
    };
  }
}

// Esporta le funzioni
export {
  login,
  register,
  check_login,
  refreshToken,
  loadStoredData,
  logout,
  initializeAuth,
  checkAndRefreshAuth,
};
