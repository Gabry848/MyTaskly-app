import { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceBotWebSocket, VoiceChatCallbacks } from '../services/botservice';
import { AudioRecorder, AudioPlayer, checkAudioPermissions } from '../utils/audioUtils';
import { debugAudioDependencies } from '../utils/audioDebug';

/**
 * Stati possibili della chat vocale
 */
export type VoiceChatState = 
  | 'idle'           // Inattivo
  | 'connecting'     // Connessione in corso
  | 'connected'      // Connesso e pronto
  | 'recording'      // Registrazione audio utente
  | 'processing'     // Elaborazione server (trascrizione/IA)
  | 'speaking'       // Riproduzione risposta bot
  | 'error'          // Stato di errore
  | 'disconnected';  // Disconnesso

/**
 * Informazioni sullo stato del server
 */
export interface ServerStatus {
  phase: string;
  message: string;
}

/**
 * Hook personalizzato per la gestione della chat vocale
 * Integra WebSocket, registrazione audio, e riproduzione
 */
export function useVoiceChat() {
  // Stati principali
  const [state, setState] = useState<VoiceChatState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [hasPermissions, setHasPermissions] = useState<boolean>(false);

  // Refs per gestire le istanze
  const websocketRef = useRef<VoiceBotWebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Accumulo dei chunk audio
  const audioChunksRef = useRef<string[]>([]);
  const [isReceivingAudio, setIsReceivingAudio] = useState<boolean>(false);

  /**
   * Verifica e richiede i permessi audio
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await checkAudioPermissions();
      setHasPermissions(granted);
      
      if (!granted) {
        setError('Permessi microfono richiesti per la chat vocale');
        setState('error');
      }
      
      return granted;
    } catch (err) {
      console.error('Errore richiesta permessi:', err);
      setError('Errore nella richiesta dei permessi');
      setState('error');
      return false;
    }
  }, []);

  /**
   * Riproduce tutti i chunk audio accumulati come un unico file
   */
  const playAccumulatedAudio = useCallback(async (): Promise<void> => {
    if (!audioPlayerRef.current || audioChunksRef.current.length === 0) {
      console.log('🔊 Nessun audio da riprodurre');
      setState('connected');
      return;
    }

    console.log(`🔊 Inizio riproduzione audio completo (${audioChunksRef.current.length} chunk)`);
    
    try {
      // Decodifica tutti i chunk base64 in dati binari, poi li concatena
      console.log('🔊 Decodifica e concatenazione chunk audio...');
      
      let totalBinaryData = '';
      
      for (let i = 0; i < audioChunksRef.current.length; i++) {
        try {
          const chunk = audioChunksRef.current[i];
          const binaryChunk = atob(chunk); // Decodifica base64 to binary string
          totalBinaryData += binaryChunk;
        } catch (chunkError) {
          console.warn(`🔊 Errore decodifica chunk ${i}:`, chunkError);
          // Continua con gli altri chunk anche se uno è corrotto
        }
      }
      
      // Ricodifica tutto come base64
      const completeAudioBase64 = btoa(totalBinaryData);
      
      console.log(`🔊 Audio concatenato correttamente:`);
      console.log(`  - Chunk elaborati: ${audioChunksRef.current.length}`);
      console.log(`  - Dimensione binaria: ${totalBinaryData.length} bytes`);
      console.log(`  - Dimensione base64: ${completeAudioBase64.length} caratteri`);
      
      // Riproduci l'audio completo con callback per cambiare stato
      const success = await audioPlayerRef.current.playAudioFromBase64(
        completeAudioBase64,
        () => {
          // Callback chiamato quando la riproduzione è completata
          console.log('🔊 Riproduzione completa, tornando a stato connected');
          setState('connected');
        }
      );
      
      if (success) {
        console.log('🔊 Riproduzione avviata con successo');
        // Lo stato rimane 'speaking' fino alla fine della riproduzione
      } else {
        console.error('🔊 Errore durante la riproduzione');
        setState('connected');
      }
      
      // Pulisci i chunk utilizzati
      audioChunksRef.current = [];
      
    } catch (error) {
      console.error('🔊 Errore riproduzione audio accumulato:', error);
      setState('connected');
      audioChunksRef.current = [];
    }
  }, []);

  /**
   * Callback per gestire i messaggi WebSocket
   */
  const websocketCallbacks: VoiceChatCallbacks = {
    onConnectionOpen: () => {
      console.log('🎤 WebSocket connesso');
      setState('connected');
      setError(null);
    },
    
    onConnectionClose: () => {
      console.log('🎤 WebSocket disconnesso');
      setState('disconnected');
    },
    
    onStatus: (phase: string, message: string) => {
      console.log(`🎤 Status: ${phase} - ${message}`);
      setServerStatus({ phase, message });
      
      // Aggiorna lo stato basandosi sulla fase del server
      switch (phase) {
        case 'transcription':
        case 'ai_processing':
        case 'tts_generation':
          setState('processing');
          break;
        case 'audio_streaming':
          setState('speaking');
          setIsReceivingAudio(true);
          // Reset dei chunk audio quando inizia lo streaming
          audioChunksRef.current = [];
          break;
        case 'complete':
          // Quando la pipeline è completata, riproduci tutto l'audio accumulato
          playAccumulatedAudio();
          setIsReceivingAudio(false);
          break;
      }
    },
    
    onAudioChunk: (audioData: string, chunkIndex?: number) => {
      console.log(`🔊 Ricevuto chunk audio: ${chunkIndex || 0}`);
      
      // Accumula il chunk invece di riprodurlo immediatamente
      audioChunksRef.current.push(audioData);
      
      // Non cambiare stato qui, rimaniamo in 'speaking' già impostato da audio_streaming
    },
    
    onError: (errorMessage: string) => {
      console.error('🎤 Errore WebSocket:', errorMessage);
      setError(errorMessage);
      setState('error');
    }
  };

  /**
   * Inizializza le istanze audio e WebSocket
   */
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      // Esegui debug delle dipendenze
      debugAudioDependencies();
      
      // Verifica permessi
      const permissionsGranted = await requestPermissions();
      if (!permissionsGranted) {
        return false;
      }

      // Inizializza le classi audio
      audioRecorderRef.current = new AudioRecorder();
      audioPlayerRef.current = new AudioPlayer();

      // Inizializza WebSocket
      websocketRef.current = new VoiceBotWebSocket(websocketCallbacks);

      console.log('🎤 Componenti audio inizializzati');
      return true;
      
    } catch (err) {
      console.error('Errore inizializzazione:', err);
      setError('Errore durante l\'inizializzazione');
      setState('error');
      return false;
    }
  }, [requestPermissions]);

  /**
   * Connette al servizio vocale
   */
  const connect = useCallback(async (): Promise<boolean> => {
    if (!websocketRef.current) {
      const initialized = await initialize();
      if (!initialized) return false;
    }

    setState('connecting');
    setError(null);

    try {
      const connected = await websocketRef.current!.connect();
      if (!connected) {
        setError('Impossibile connettersi al servizio vocale');
        setState('error');
        return false;
      }

      return true;
      
    } catch (err) {
      console.error('Errore connessione:', err);
      setError('Errore di connessione');
      setState('error');
      return false;
    }
  }, [initialize]);

  /**
   * Avvia la registrazione audio
   */
  const startRecording = useCallback(async (): Promise<boolean> => {
    if (!audioRecorderRef.current || !websocketRef.current) {
      setError('Servizio non inizializzato');
      return false;
    }

    if (!websocketRef.current.isConnected()) {
      setError('WebSocket non connesso');
      return false;
    }

    try {
      const started = await audioRecorderRef.current.startRecording();
      if (!started) {
        setError('Impossibile avviare la registrazione');
        return false;
      }

      setState('recording');
      setError(null);

      // Aggiorna la durata della registrazione ogni 100ms
      recordingIntervalRef.current = setInterval(() => {
        if (audioRecorderRef.current) {
          const duration = audioRecorderRef.current.getRecordingDuration();
          setRecordingDuration(duration);
        }
      }, 100);

      console.log('🎤 Registrazione avviata');
      return true;
      
    } catch (err) {
      console.error('Errore avvio registrazione:', err);
      setError('Errore durante la registrazione');
      setState('error');
      return false;
    }
  }, []);

  /**
   * Ferma la registrazione e invia l'audio al server
   */
  const stopRecording = useCallback(async (): Promise<boolean> => {
    if (!audioRecorderRef.current || !websocketRef.current) {
      return false;
    }

    // Ferma il timer della durata
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    try {
      const audioData = await audioRecorderRef.current.stopRecording();
      if (!audioData) {
        setError('Nessun dato audio registrato');
        setState('error');
        return false;
      }

      console.log('🎤 Invio audio al server...');
      
      // Invia l'audio al server tramite WebSocket
      websocketRef.current.sendAudioChunk(audioData, true);
      
      setState('processing');
      setRecordingDuration(0);
      
      return true;
      
    } catch (err) {
      console.error('Errore stop registrazione:', err);
      setError('Errore durante l\'invio dell\'audio');
      setState('error');
      return false;
    }
  }, []);

  /**
   * Cancella la registrazione corrente
   */
  const cancelRecording = useCallback(async (): Promise<void> => {
    if (audioRecorderRef.current) {
      await audioRecorderRef.current.cancelRecording();
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    setRecordingDuration(0);
    setState('connected');
    console.log('🎤 Registrazione cancellata');
  }, []);

  /**
   * Ferma la riproduzione audio corrente
   */
  const stopPlayback = useCallback(async (): Promise<void> => {
    if (audioPlayerRef.current) {
      await audioPlayerRef.current.stopPlayback();
    }
    
    setState('connected');
    console.log('🔊 Riproduzione fermata');
  }, []);

  /**
   * Invia comando di controllo al server
   */
  const sendControl = useCallback((action: 'pause' | 'resume' | 'cancel'): void => {
    if (websocketRef.current && websocketRef.current.isConnected()) {
      websocketRef.current.sendControl(action);
      console.log(`🎤 Comando inviato: ${action}`);
    }
  }, []);

  /**
   * Disconnette dal servizio
   */
  const disconnect = useCallback((): void => {
    if (websocketRef.current) {
      websocketRef.current.disconnect();
    }
    
    setState('idle');
    setServerStatus(null);
    setError(null);
    console.log('🎤 Disconnesso dal servizio');
  }, []);

  /**
   * Pulisce tutte le risorse
   */
  const cleanup = useCallback(async (): Promise<void> => {
    // Ferma registrazione se attiva
    if (audioRecorderRef.current) {
      await audioRecorderRef.current.cancelRecording();
    }

    // Ferma riproduzione se attiva
    if (audioPlayerRef.current) {
      await audioPlayerRef.current.destroy();
    }

    // Disconnetti WebSocket
    if (websocketRef.current) {
      websocketRef.current.destroy();
    }

    // Pulisci timer
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    // Reset stati
    setState('idle');
    setError(null);
    setServerStatus(null);
    setRecordingDuration(0);
    
    console.log('🎤 Risorse pulite');
  }, []);

  // Cleanup automatico quando il componente viene smontato
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Stati derivati per convenience
  const isConnected = state === 'connected' || state === 'recording' || state === 'processing' || state === 'speaking';
  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';
  const isSpeaking = state === 'speaking';
  const canRecord = state === 'connected' && hasPermissions;
  const canStop = state === 'recording';

  return {
    // Stati
    state,
    error,
    serverStatus,
    recordingDuration,
    hasPermissions,
    
    // Stati derivati
    isConnected,
    isRecording,
    isProcessing,
    isSpeaking,
    canRecord,
    canStop,
    
    // Azioni
    initialize,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    cancelRecording,
    stopPlayback,
    sendControl,
    cleanup,
    requestPermissions
  };
}
