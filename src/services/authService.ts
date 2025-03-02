import dayjs from "dayjs";
import axios from "axios";
import RequestDats from "../config/requestData.json";

axios.defaults.baseURL = RequestDats.httpRequest.BaseURL;

// ...existing code...
/**
 * Esegue il login dell'utente
 *
 * @param {string} email - L'email dell'utente
 * @param {string} password - La password dell'utente
 * @param {Object} requestData - L'oggetto requestData che contiene i dati dell'utente
 * @returns {Promise<Object>} - Un oggetto che contiene lo stato del login e i token
 */ 
async function login(username: any, password: any) {
  try {
    // Esegui la richiesta di login
    const response = await axios.post("/login", {
      username: username,
      password: password,
    });

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
    writeData({
      bearerToken: bearer_token,
      refreshToken: refresh_token,
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
      message: "Login effettuato con successo",
    };
  } catch (error: any) {
    console.error("Errore durante il login:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Errore durante il login",
      error: error,
    };
  }
}

/**
 * Checks if the authentication tokens have expired based on their duration and login time.
 *
 * @param {Object} params - Parameters object
 * @param {string|null} params.loginTime - The time when the login occurred (format that dayjs can parse)
 * @param {number|string|null} params.bearerDuration - The duration of the bearer token in seconds
 * @param {number|string|null} params.refreshDuration - The duration of the refresh token in seconds
 * @returns {Object} An object with the following properties:
 *   @property {boolean} isAuthenticated - True if the access token has not expired.
 *   @property {boolean} canRefresh - True if the refresh token has not expired.
 *   @property {boolean} tokenExpired - True if the access token is expired.
 *   @property {boolean} refreshTokenExpired - True if the refresh token is expired.
 */
function check_login(params: {
  loginTime: string | null;
  bearerDuration: number | string | null;
  refreshDuration: number | string | null;
}) {
  const { loginTime, bearerDuration, refreshDuration } = params;

  // Verifica se i parametri necessari sono presenti
  if (!loginTime) {
    return {
      isAuthenticated: false,
      canRefresh: false,
      tokenExpired: true,
      refreshTokenExpired: true,
    };
  }

  // Converti loginTime in oggetto dayjs
  const loginTimeObj = dayjs(loginTime);
  const currentTime = dayjs();

  // Calcola le date di scadenza basate sulla durata
  const tokenExpiration = bearerDuration
    ? loginTimeObj.add(
        typeof bearerDuration === "string"
          ? parseInt(bearerDuration)
          : bearerDuration,
        "second"
      )
    : null;

  const refreshTokenExpiration = refreshDuration
    ? loginTimeObj.add(
        typeof refreshDuration === "string"
          ? parseInt(refreshDuration)
          : refreshDuration,
        "second"
      )
    : null;

  // Controlla se i token sono scaduti
  const isTokenExpired = tokenExpiration
    ? currentTime.isAfter(tokenExpiration)
    : true;

  const isRefreshTokenExpired = refreshTokenExpiration
    ? currentTime.isAfter(refreshTokenExpiration)
    : true;

  // Aggiorna il risultato con lo stato dei token
  return {
    isAuthenticated: !isTokenExpired,
    canRefresh: !isRefreshTokenExpired,
    tokenExpired: isTokenExpired,
    refreshTokenExpired: isRefreshTokenExpired,
  };
}

/**
 * Rinnova il token di accesso utilizzando il refresh token
 *
 * @param {Object} requestData - L'oggetto requestData che contiene i dati dell'utente
 * @returns {Promise<Object>} - Un oggetto che contiene lo stato dell'operazione e i nuovi token
 */
async function refreshToken(requestData: {
  user: {
    email: any;
    bearerToken: any;
    refreshToken: any;
    loginTime: string;
    bearerDuration: any;
    refreshDuration: any;
    username: any; // inutile (per fasre combaciare requestData)
    password: any; // inutile
  };
  tokenExpiration?: string | null;
  refreshTokenExpiration?: string | null;
}) {
  try {
    // Verifica se è disponibile un refresh token
    if (!requestData.user.refreshToken) {
      return {
        success: false,
        message: "Nessun refresh token disponibile",
      };
    }

    // Esegui la richiesta di refresh
    const response = await axios.post("/refresh", {
      refresh_token: requestData.user.refreshToken,
    });

    // Estrai i dati dalla risposta
    const { bearer_token, refresh_token, bearerDuration, refreshDuration } =
      response.data;

    // Calcola le date di scadenza
    const currentTime = dayjs();
    const tokenExpiration = bearerDuration
      ? currentTime.add(
          typeof bearerDuration === "string"
            ? parseInt(bearerDuration)
            : bearerDuration,
          "second"
        )
      : null;
    const refreshTokenExpiration = refreshDuration
      ? currentTime.add(
          typeof refreshDuration === "string"
            ? parseInt(refreshDuration)
            : refreshDuration,
          "second"
        )
      : null;

    // Aggiorna i dati dell'utente
    requestData.user.bearerToken = bearer_token;
    requestData.user.refreshToken =
      refresh_token || requestData.user.refreshToken; // Mantieni il vecchio refresh token se non ne viene fornito uno nuovo
    requestData.user.loginTime = currentTime.format();
    requestData.user.bearerDuration = bearerDuration;
    requestData.user.refreshDuration = refreshDuration;

    if (requestData.tokenExpiration !== undefined) {
      requestData.tokenExpiration = tokenExpiration
        ? tokenExpiration.format()
        : null;
    }

    if (requestData.refreshTokenExpiration !== undefined) {
      requestData.refreshTokenExpiration = refreshTokenExpiration
        ? refreshTokenExpiration.format()
        : null;
    }

    return {
      success: true,
      bearerToken: bearer_token,
      refreshToken: refresh_token,
      tokenExpiration: tokenExpiration?.format(),
      refreshTokenExpiration: refreshTokenExpiration?.format(),
      message: "Token rinnovato con successo",
    };
  } catch (error: any) {
    console.error("Errore durante il refresh del token:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Errore durante il refresh del token",
      error: error,
    };
  }
}

// function to write the information in the file requestData.json
// write only data canged
function writeData(userDataCanged: any) {
  const fs = require("fs");
  const path = require("path");
  const filePath = path.join(__dirname, "../config/requestData.json");
  const data = require(filePath);

  for (const key in userDataCanged) {
    if (userDataCanged[key] !== undefined) {
      data.user[key] = userDataCanged[key];
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Esporta le funzioni
export { login, check_login, refreshToken };
