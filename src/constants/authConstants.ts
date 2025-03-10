// Chiavi di AsyncStorage per l'autenticazione
export const STORAGE_KEYS = {
  BASE_URL: "config.baseUrl",
  USER_DATA: "auth.userData",
  BEARER_TOKEN: "auth.bearerToken",
  REFRESH_TOKEN: "auth.refreshToken",
  LOGIN_TIME: "auth.loginTime",
  BEARER_DURATION: "auth.bearerDuration",
  REFRESH_DURATION: "auth.refreshDuration",
};

// URL di default per l'API
export const DEFAULT_BASE_URL = "http://127.0.0.1:8000";
// https://taskly-production.up.railway.app

// Endpoint API
export const API_ENDPOINTS = {
  SIGNIN: "/login",
  SIGNUP: "/register",
  REFRESH: "/refresh"
};
