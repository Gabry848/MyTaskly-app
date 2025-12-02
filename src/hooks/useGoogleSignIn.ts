import { useState, useEffect } from "react";
import {
  initializeGoogleSignIn,
  signInWithGoogle,
  signOutFromGoogle,
  isGoogleSignedIn,
  getCurrentGoogleUser,
  revokeGoogleAccess,
} from "../services/googleSignInService";

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  photo?: string;
  familyName?: string;
  givenName?: string;
}

export interface UseGoogleSignInResult {
  isSignedIn: boolean;
  user: GoogleUser | null;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  revokeAccess: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useGoogleSignIn = (): UseGoogleSignInResult => {
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Inizializza Google Sign-In all'avvio
  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await initializeGoogleSignIn();

      // Controlla se l'utente è già loggato
      const signedIn = await isGoogleSignedIn();
      setIsSignedIn(signedIn);

      if (signedIn) {
        const currentUserResult = await getCurrentGoogleUser();
        if (currentUserResult.success && currentUserResult.userInfo) {
          const googleUser = currentUserResult.userInfo as any;
          setUser({
            id: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            photo: googleUser.photo,
            familyName: googleUser.familyName,
            givenName: googleUser.givenName,
          });
        }
      }
    } catch (err: any) {
      console.error("❌ Errore nell'inizializzazione di Google Sign-In:", err);
      setError(err.message || "Errore nell'inizializzazione");
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await signInWithGoogle();

      if (result.success) {
        setIsSignedIn(true);
        setUser(result.userInfo as GoogleUser);
      } else {
        setError(result.message || "Errore durante il login");
      }
    } catch (err: any) {
      console.error("❌ Errore nel login con Google:", err);
      setError(err.message || "Errore durante il login");
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await signOutFromGoogle();

      setIsSignedIn(false);
      setUser(null);
    } catch (err: any) {
      console.error("❌ Errore nel logout da Google:", err);
      setError(err.message || "Errore durante il logout");
    } finally {
      setIsLoading(false);
    }
  };

  const revokeAccess = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await revokeGoogleAccess();

      setIsSignedIn(false);
      setUser(null);
    } catch (err: any) {
      console.error("❌ Errore nella revoca dell'accesso Google:", err);
      setError(err.message || "Errore nella revoca dell'accesso");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSignedIn,
    user,
    isLoading,
    error,
    signIn,
    signOut,
    revokeAccess,
    initialize,
  };
};
