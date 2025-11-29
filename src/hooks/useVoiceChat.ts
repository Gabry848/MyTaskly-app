import { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceBotWebSocket, VoiceChatCallbacks } from '../services/botservice';
import { AudioRecorder, AudioPlayer, checkAudioPermissions, VADCallbacks } from '../utils/audioUtils';
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
  const lastChunkIndexRef = useRef<number | null>(null);

  const [isReceivingAudio, setIsReceivingAudio] = useState<boolean>(false);
  const [chunksReceived, setChunksReceived] = useState<number>(0);

  // Chunk timing diagnostics
  const lastChunkTimeRef = useRef<number>(0);
  const chunkTimingsRef = useRef<number[]>([]);

  // VAD states (sempre attivo di default)
  const [vadEnabled, setVadEnabled] = useState<boolean>(true);
  const [audioLevel, setAudioLevel] = useState<number>(-160);
  const [isSpeechActive, setIsSpeechActive] = useState<boolean>(false);

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
   * Ref per gestire l'avvio automatico della registrazione dopo autenticazione
   */
  const shouldAutoStartRecordingRef = useRef<boolean>(false);

  /**
   * Callback per gestire i messaggi WebSocket
   */
  const websocketCallbacks: VoiceChatCallbacks = {
    onConnectionOpen: () => {
      console.log('🎤 WebSocket connesso, in attesa di autenticazione...');
      // Non impostare 'connected' qui, aspetta l'autenticazione
      setError(null);
    },

    onAuthenticationSuccess: (message: string) => {
      console.log('✅ Autenticazione completata:', message);
      setState('connected');

      // Avvia la registrazione se richiesto
      if (shouldAutoStartRecordingRef.current) {
        console.log('🎤 Avvio registrazione automatica post-autenticazione...');
        shouldAutoStartRecordingRef.current = false;
        setTimeout(() => {
          startRecording();
        }, 100);
      }
    },

    onAuthenticationFailed: (error: string) => {
      console.error('❌ Autenticazione fallita:', error);
      setError(`Autenticazione fallita: ${error}`);
      setState('error');
    },

    onConnectionClose: () => {
      console.log('🎤 WebSocket disconnesso');
      setState('disconnected');
      shouldAutoStartRecordingRef.current = false;
    },

    onStatus: (phase: string, message: string) => {
      console.log(`📡 Status Server: ${phase} - ${message}`);
      setServerStatus({ phase, message });

      switch (phase) {
        case 'receiving_audio':
          // Audio ricevuto dal server
          console.log('📥 Server sta ricevendo audio...');
          lastChunkIndexRef.current = null;
          break;
        case 'transcription':
        case 'transcription_complete':
        case 'ai_processing':
        case 'ai_complete':
        case 'tts_generation':
        case 'tts_complete':
          setState('processing');
          break;
        case 'audio_streaming':
          setIsReceivingAudio(true);
          setChunksReceived(0);
          lastChunkIndexRef.current = null;
          if (audioPlayerRef.current) {
            audioPlayerRef.current.clearChunks();
          }
          setState('speaking');
          break;
        case 'complete':
          console.log('✅ Pipeline completa!');
          setIsReceivingAudio(false);
          lastChunkIndexRef.current = null;

          // Reset chunk timing per prossimo ciclo
          lastChunkTimeRef.current = 0;
          chunkTimingsRef.current = [];

          if (audioPlayerRef.current && audioPlayerRef.current.getChunksCount() > 0) {
            const bufferedCount = audioPlayerRef.current.getBufferedChunksCount();
            console.log(`🔊 Ricevuti ${bufferedCount} chunk totali. Avvio riproduzione sequenziale...`);

            setState('speaking');

            // Riproduci i chunk uno dopo l'altro (sequenzialmente)
            // Questo evita problemi di concatenazione MP3
            audioPlayerRef.current.playChunksSequentially(() => {
              console.log('🔊 Riproduzione completata, riavvio registrazione...');
              setState('connected');
              // Riavvia automaticamente la registrazione per la prossima domanda
              setTimeout(() => {
                startRecording();
              }, 500);
            });
          } else {
            console.log('⚠️ Nessun chunk audio ricevuto, riavvio registrazione...');
            setState('connected');
            // Riavvia automaticamente la registrazione anche se non ci sono chunk
            setTimeout(() => {
              startRecording();
            }, 500);
          }
          break;
      }
    },

    onAudioChunk: (audioData: string, chunkIndex?: number) => {
      const currentTime = Date.now();

      // Traccia timing inter-arrival
      if (lastChunkTimeRef.current > 0) {
        const interArrivalMs = currentTime - lastChunkTimeRef.current;
        chunkTimingsRef.current.push(interArrivalMs);

        if (interArrivalMs < 10) {
          console.warn(`🔊 ⚡ Chunk burst: ${interArrivalMs}ms tra chunk #${(lastChunkIndexRef.current ?? -1) + 1} e #${chunkIndex}`);
        }
      }
      lastChunkTimeRef.current = currentTime;

      console.log(`🔊 Ricevuto chunk audio ${typeof chunkIndex === 'number' ? `#${chunkIndex}` : '(senza indice)'}`);

      if (!audioPlayerRef.current) {
        console.error('🔊 AudioPlayer non inizializzato');
        return;
      }

      if (typeof chunkIndex === 'number') {
        const previousIndex = lastChunkIndexRef.current;

        if (previousIndex !== null) {
          if (chunkIndex === previousIndex) {
            console.warn(`🔊 Chunk duplicato #${chunkIndex} ricevuto dal server`);
          } else if (chunkIndex < previousIndex) {
            console.warn(`🔊 Chunk fuori ordine: #${chunkIndex} ricevuto dopo #${previousIndex}`);
          } else if (chunkIndex > previousIndex + 1) {
            console.warn(`🔊 Mancano ${chunkIndex - previousIndex - 1} chunk prima di #${chunkIndex}`);
          }
        } else if (chunkIndex > 0) {
          console.warn(`🔊 Primo chunk ricevuto con indice ${chunkIndex} (atteso 0)`);
        }
      }

      const stored = audioPlayerRef.current.addChunk(audioData, chunkIndex);

      if (stored) {
        if (typeof chunkIndex === 'number') {
          lastChunkIndexRef.current = lastChunkIndexRef.current === null
            ? chunkIndex
            : Math.max(lastChunkIndexRef.current, chunkIndex);
        }
        setChunksReceived(prev => prev + 1);
      }
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
      debugAudioDependencies();

      const permissionsGranted = await requestPermissions();
      if (!permissionsGranted) {
        return false;
      }

      audioRecorderRef.current = new AudioRecorder();
      audioPlayerRef.current = new AudioPlayer();

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
   * Connette al servizio vocale e avvia automaticamente la registrazione
   */
  const connect = useCallback(async (): Promise<boolean> => {
    if (!websocketRef.current) {
      const initialized = await initialize();
      if (!initialized) return false;
    }

    setState('connecting');
    setError(null);

    try {
      console.log('🔌 CONNECT: Connessione WebSocket in corso...');
      const connected = await websocketRef.current!.connect();

      if (!connected) {
        console.error('❌ CONNECT: Connessione fallita');
        setError('Impossibile connettersi al servizio vocale');
        setState('error');
        return false;
      }

      console.log('✅ CONNECT: WebSocket connesso, attesa autenticazione...');

      // Imposta il flag per avviare automaticamente la registrazione dopo l'autenticazione
      shouldAutoStartRecordingRef.current = true;

      // Aspetta che il WebSocket sia autenticato (non solo connesso)
      let retries = 0;
      const maxRetries = 30; // 3 secondi max per autenticazione

      while (!websocketRef.current.isAuthenticated() && retries < maxRetries) {
        console.log(`⏳ CONNECT: Attesa autenticazione... (${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;

        // Se il WebSocket si è disconnesso durante l'attesa, esci
        if (!websocketRef.current.isConnected()) {
          console.error('❌ CONNECT: WebSocket disconnesso durante autenticazione');
          setError('WebSocket disconnesso');
          setState('error');
          shouldAutoStartRecordingRef.current = false;
          return false;
        }
      }

      if (!websocketRef.current.isAuthenticated()) {
        console.error('❌ CONNECT: Timeout autenticazione WebSocket');
        setError('Timeout autenticazione');
        setState('error');
        shouldAutoStartRecordingRef.current = false;
        return false;
      }

      console.log('✅ CONNECT: Autenticazione completata! Registrazione verrà avviata automaticamente...');
      return true;

    } catch (err) {
      console.error('❌ CONNECT: Errore connessione:', err);
      setError('Errore di connessione');
      setState('error');
      shouldAutoStartRecordingRef.current = false;
      return false;
    }
  }, [initialize]);

  /**
   * VAD Callbacks
   */
  const vadCallbacks: VADCallbacks = {
    onSpeechStart: () => {
      console.log('🎙️ HOOK: ✅ Inizio voce rilevato - UI aggiornata');
      setIsSpeechActive(true);
    },
    onSpeechEnd: () => {
      console.log('🎙️ HOOK: ⏹️ Fine voce rilevata - UI aggiornata');
      setIsSpeechActive(false);
    },
    onSilenceDetected: () => {
      console.log('🎙️ HOOK: 🔇 Silenzio rilevato - Timer avviato');
    },
    onAutoStop: async () => {
      console.log('🎙️ HOOK: 🛑 Auto-stop chiamato - Fermando registrazione...');
      await stopRecording();
    },
    onMeteringUpdate: (level: number) => {
      setAudioLevel(level);
      // Log dettagliato del livello solo ogni secondo (invece di ogni 100ms)
      if (Date.now() % 1000 < 150) {
        console.log(`🎚️ HOOK: Audio level aggiornato → ${level.toFixed(1)} dB`);
      }
    },
  };

  /**
   * Toggle VAD mode
   */
  const toggleVAD = useCallback(() => {
    setVadEnabled(prev => !prev);
  }, []);

  /**
   * Avvia la registrazione audio
   */
  const startRecording = useCallback(async (): Promise<boolean> => {
    console.log('🎬 START RECORDING: Chiamata startRecording()');

    if (!audioRecorderRef.current || !websocketRef.current) {
      console.error('❌ START RECORDING: Servizio non inizializzato');
      console.log('  - audioRecorderRef:', !!audioRecorderRef.current);
      console.log('  - websocketRef:', !!websocketRef.current);
      setError('Servizio non inizializzato');
      return false;
    }

    if (!websocketRef.current.isConnected()) {
      console.error('❌ START RECORDING: WebSocket non connesso');
      setError('WebSocket non connesso');
      return false;
    }

    if (!websocketRef.current.isAuthenticated()) {
      console.error('❌ START RECORDING: WebSocket non autenticato');
      setError('WebSocket non autenticato');
      return false;
    }

    console.log('✅ START RECORDING: Pre-check OK (connesso e autenticato), avvio registrazione...');

    try {
      const started = await audioRecorderRef.current.startRecording(vadEnabled, vadCallbacks);
      console.log('📝 START RECORDING: Risultato startRecording():', started);

      if (!started) {
        console.error('❌ START RECORDING: Impossibile avviare la registrazione');
        setError('Impossibile avviare la registrazione');
        return false;
      }

      console.log('✅ START RECORDING: Registrazione avviata con successo!');
      setState('recording');
      setError(null);
      setIsSpeechActive(false);
      setAudioLevel(-160);

      // Aggiorna la durata della registrazione ogni 100ms
      recordingIntervalRef.current = setInterval(() => {
        if (audioRecorderRef.current) {
          const duration = audioRecorderRef.current.getRecordingDuration();
          setRecordingDuration(duration);
        }
      }, 100);

      console.log('🎤 Registrazione avviata', vadEnabled ? '(VAD attivo)' : '(VAD disattivo)');
      return true;

    } catch (err) {
      console.error('❌ START RECORDING: Errore avvio registrazione:', err);
      setError('Errore durante la registrazione');
      setState('error');
      return false;
    }
  }, [vadEnabled]);

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
    chunksReceived,

    // Stati derivati
    isConnected,
    isRecording,
    isProcessing,
    isSpeaking,
    canRecord,
    canStop,

    // VAD stati
    vadEnabled,
    audioLevel,
    isSpeechActive,

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
    requestPermissions,
    toggleVAD,
  };
}
