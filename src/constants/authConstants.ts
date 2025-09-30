// Chiavi di AsyncStorage per l'autenticazione
export const STORAGE_KEYS = {
  BASE_URL: "config.baseUrl",
  USER_DATA: "auth.userData",
  BEARER_TOKEN: "auth.bearerToken",
  REFRESH_TOKEN: "auth.refreshToken",
  LOGIN_TIME: "auth.loginTime",
  BEARER_DURATION: "auth.bearerDuration",
  REFRESH_DURATION: "auth.refreshDuration",
  USER_NAME: "auth.userName",
  USER_EMAIL: "auth.userEmail",
  USER_ID: "auth.userId",
  USER_PASSWORD: "auth.userPassword",
  SUGGESTED_COMMAND_SHOWN: "ui.suggestedCommandShown",
};

// URL di default per l'API
export const DEFAULT_BASE_URL = "https://api.mytasklyapp.com";
// https://127.0.0.1:8000

// Endpoint API
export const API_ENDPOINTS = {
  SIGNIN: "/auth/login",
  SIGNUP: "/auth/register",
  REFRESH: "/auth/refresh",
  CHECK_AVAILABILITY: "/auth/check-availability",
  SEND_VERIFICATION: "/email/send-verification",
  VERIFICATION_STATUS: "/email/verification-status",
  TIMEZONE: "/api/notifications/timezone",
  GOOGLE_LOGIN: "/auth/google/login",
  GOOGLE_AUTH_URL: "/auth/google/url",
  GOOGLE_CALLBACK: "/auth/google/callback"
};
