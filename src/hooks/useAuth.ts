import { useState, useEffect } from 'react';
import { checkAndRefreshAuth, check_login } from '../services/authService';

/**
 * Auth State
 */
export interface AuthState {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether auth check is in progress */
  isLoading: boolean;
  /** Function to check authentication */
  checkAuth: () => Promise<void>;
}

/**
 * Hook personalizzato per gestire l'autenticazione con refresh automatico del token
 * 
 * @returns {AuthState} Oggetto contenente lo stato di autenticazione e funzioni di utilità
 */
export const useAuth = (): AuthState => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const authResult = await checkAndRefreshAuth();
      setIsAuthenticated(authResult.isAuthenticated);
      
      if (!authResult.isAuthenticated && authResult.needsLogin) {
        console.log("Utente non autenticato:", authResult.message);
      }
    } catch (error) {
      console.error("Errore nel controllo autenticazione:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    isAuthenticated,
    isLoading,
    checkAuth,
  };
};

/**
 * Hook che controlla solo lo stato di autenticazione senza refresh automatico
 * Utile per controlli veloci senza modificare lo stato dei token
 * 
 * @returns {Object} Oggetto contenente lo stato di autenticazione dettagliato
 */
export const useAuthStatus = () => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    canRefresh: false,
    tokenExpired: false,
    refreshTokenExpired: false,
    isLoading: true,
  });

  const checkAuthStatus = async () => {
    try {
      const status = await check_login();
      setAuthState({
        isAuthenticated: status.isAuthenticated,
        canRefresh: status.canRefresh,
        tokenExpired: status.tokenExpired,
        refreshTokenExpired: status.refreshTokenExpired,
        isLoading: false,
      });
    } catch (error) {
      console.error("Errore nel controllo stato autenticazione:", error);
      setAuthState({
        isAuthenticated: false,
        canRefresh: false,
        tokenExpired: true,
        refreshTokenExpired: true,
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return {
    ...authState,
    refresh: checkAuthStatus,
  };
};
