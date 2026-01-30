import { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceBotWebSocket, VoiceChatCallbacks, VoiceServerPhase } from '../services/botservice';
import { AudioRecorder, AudioPlayer, checkAudioPermissions, VADCallbacks } from '../utils/audioUtils';

/**
 * Stati possibili della chat vocale
 */
export type VoiceChatState =
  | 'idle'            // Inattivo
  | 'connecting'      // Connessione WebSocket in corso
  | 'authenticating'  // Autenticazione in corso
  | 'setting_up'      // Server sta configurando MCP + RealtimeAgent
  | 'ready'           // Pronto per ricevere input
  | 'recording'       // Registrazione audio utente
  | 'processing'      // Agent sta elaborando
  | 'speaking'        // Riproduzione risposta audio
  | 'error'           // Stato di errore
  | 'disconnected';   // Disconnesso

/**
 * Informazioni sullo stato del server
 */
export interface ServerStatus {
  phase: string;
  message: string;
}

/**
 * Trascrizione di un messaggio vocale
 */
export interface VoiceTranscript {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Tool in esecuzione
 */
export interface ActiveTool {
  name: string;
  status: 'running' | 'complete';
  output?: string;
}

/**
 * Hook personalizzato per la gestione della chat vocale
 * Compatibile con l'OpenAI Realtime API tramite WebSocket
 */
export function useVoiceChat() {
  // Stati principali
  const [state, setState] = useState<VoiceChatState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [hasPermissions, setHasPermissions] = useState<boolean>(false);
  const [chunksReceived, setChunksReceived] = useState<number>(0);

  // Trascrizioni e tool
  const [transcripts, setTranscripts] = useState<VoiceTranscript[]>([]);
  const [activeTools, setActiveTools] = useState<ActiveTool[]>([]);

  // VAD states (feedback UI)
  const [audioLevel, setAudioLevel] = useState<number>(-160);
  const [isSpeechActive, setIsSpeechActive] = useState<boolean>(false);

  // Refs per gestire le istanze
  const websocketRef = useRef<VoiceBotWebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shouldAutoStartRecordingRef = useRef<boolean>(false);

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
   * VAD Callbacks — solo per feedback UI, il turn detection e' gestito dal server
   */
  const vadCallbacks: VADCallbacks = {
    onSpeechStart: () => {
      setIsSpeechActive(true);
    },
    onSpeechEnd: () => {
      setIsSpeechActive(false);
    },
    onSilenceDetected: () => {
      setIsSpeechActive(false);
    },
    onAutoStop: async () => {
      // Client-side VAD rileva silenzio prolungato: ferma registrazione e invia
      await stopRecording();
    },
    onMeteringUpdate: (level: number) => {
      setAudioLevel(level);
    },
  };

  /**
   * Callback per gestire i messaggi WebSocket
   */
  const websocketCallbacks: VoiceChatCallbacks = {
    onConnectionOpen: () => {
      setState('authenticating');
      setError(null);
    },

    onAuthenticationSuccess: (message: string) => {
      console.log('Autenticazione completata:', message);
      setState('setting_up');
      // Aspetta il messaggio "ready" prima di fare qualsiasi cosa
    },

    onReady: () => {
      console.log('Sessione vocale pronta');
      setState('ready');

      // Avvia la registrazione automaticamente se richiesto
      if (shouldAutoStartRecordingRef.current) {
        shouldAutoStartRecordingRef.current = false;
        setTimeout(() => {
          startRecording();
        }, 500);
      }
    },

    onAuthenticationFailed: (errorMsg: string) => {
      console.error('Autenticazione fallita:', errorMsg);
      setError(`Autenticazione fallita: ${errorMsg}`);
      setState('error');
    },

    onConnectionClose: () => {
      setState('disconnected');
      shouldAutoStartRecordingRef.current = false;
    },

    onStatus: (phase: VoiceServerPhase, message: string) => {
      setServerStatus({ phase, message });

      switch (phase) {
        case 'agent_start':
          setState('processing');
          break;

        case 'agent_end':
          // Agent ha finito di elaborare, l'audio potrebbe seguire
          break;

        case 'audio_end':
          // Server ha finito di inviare chunk audio -> riproduci
          if (audioPlayerRef.current && audioPlayerRef.current.getChunksCount() > 0) {
            setState('speaking');
            audioPlayerRef.current.playPcm16Chunks(() => {
              setState('ready');
              // Riavvia automaticamente la registrazione per il prossimo turno
              setTimeout(() => {
                startRecording();
              }, 300);
            });
          } else {
            setState('ready');
            setTimeout(() => {
              startRecording();
            }, 300);
          }
          break;

        case 'interrupted':
          // Risposta interrotta, torna pronto
          if (audioPlayerRef.current) {
            audioPlayerRef.current.stopPlayback();
            audioPlayerRef.current.clearChunks();
          }
          setState('ready');
          break;
      }
    },

    onAudioChunk: (audioData: string, chunkIndex: number) => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.addChunk(audioData, chunkIndex);
        setChunksReceived(prev => prev + 1);
      }
    },

    onTranscript: (role: 'user' | 'assistant', content: string) => {
      setTranscripts(prev => [...prev, { role, content }]);
    },

    onToolStart: (toolName: string) => {
      setActiveTools(prev => [...prev, { name: toolName, status: 'running' }]);
    },

    onToolEnd: (toolName: string, output: string) => {
      setActiveTools(prev => prev.map(t =>
        t.name === toolName && t.status === 'running'
          ? { ...t, status: 'complete' as const, output }
          : t
      ));
    },

    onDone: () => {
      console.log('Sessione vocale terminata dal server');
      setState('disconnected');
    },

    onError: (errorMessage: string) => {
      console.error('Errore WebSocket:', errorMessage);
      setError(errorMessage);
      setState('error');
    }
  };

  /**
   * Inizializza le istanze audio e WebSocket
   */
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      const permissionsGranted = await requestPermissions();
      if (!permissionsGranted) return false;

      audioRecorderRef.current = new AudioRecorder();
      audioPlayerRef.current = new AudioPlayer();
      websocketRef.current = new VoiceBotWebSocket(websocketCallbacks);

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
    setTranscripts([]);
    setActiveTools([]);
    setChunksReceived(0);
    shouldAutoStartRecordingRef.current = true;

    try {
      const connected = await websocketRef.current!.connect();
      if (!connected) {
        setError('Impossibile connettersi al servizio vocale');
        setState('error');
        shouldAutoStartRecordingRef.current = false;
        return false;
      }
      // Le transizioni di stato avvengono via callback:
      // connecting -> authenticating -> setting_up -> ready
      return true;
    } catch (err) {
      setError('Errore di connessione');
      setState('error');
      shouldAutoStartRecordingRef.current = false;
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

    if (!websocketRef.current.isReady()) {
      setError('Sessione vocale non pronta');
      return false;
    }

    try {
      const started = await audioRecorderRef.current.startRecording(true, vadCallbacks);
      if (!started) {
        setError('Impossibile avviare la registrazione');
        return false;
      }

      setState('recording');
      setError(null);
      setIsSpeechActive(false);
      setAudioLevel(-160);

      // Aggiorna la durata della registrazione ogni 100ms
      recordingIntervalRef.current = setInterval(() => {
        if (audioRecorderRef.current) {
          setRecordingDuration(audioRecorderRef.current.getRecordingDuration());
        }
      }, 100);

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
    if (!audioRecorderRef.current || !websocketRef.current) return false;

    // Ferma il timer della durata
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    try {
      const pcm16Base64 = await audioRecorderRef.current.stopRecording();
      if (!pcm16Base64) {
        console.error('❌ Nessun dato audio registrato');
        setError('Nessun dato audio registrato');
        setState('error');
        return false;
      }

      // Calcola la durata approssimativa dell'audio
      const audioBytes = Math.floor(pcm16Base64.length * 0.75);
      const durationMs = (audioBytes / 2) / 24; // 2 bytes per sample, 24 samples per ms
      
      console.log(`📦 Audio pronto: ${durationMs.toFixed(0)}ms (${audioBytes} bytes)`);

      // Invia audio PCM16
      websocketRef.current.sendAudio(pcm16Base64);
      console.log('📤 Audio inviato al server');
      
      // IMPORTANTE: Aspetta 300ms per assicurare che il server processi l'audio
      // prima di committare il buffer. Questo previene l'errore "buffer_empty"
      await new Promise(resolve => setTimeout(resolve, 300));
      
      websocketRef.current.sendAudioCommit();
      console.log('✅ Buffer committato');

      setState('processing');
      setRecordingDuration(0);
      setIsSpeechActive(false);
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
    setIsSpeechActive(false);
    setState('ready');
  }, []);

  /**
   * Ferma la riproduzione audio corrente
   */
  const stopPlayback = useCallback(async (): Promise<void> => {
    if (audioPlayerRef.current) {
      await audioPlayerRef.current.stopPlayback();
      audioPlayerRef.current.clearChunks();
    }

    setState('ready');
  }, []);

  /**
   * Interrompe la risposta corrente dell'assistente
   */
  const sendInterrupt = useCallback((): void => {
    if (websocketRef.current?.isConnected()) {
      websocketRef.current.sendInterrupt();
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stopPlayback();
      audioPlayerRef.current.clearChunks();
    }
    setState('ready');
  }, []);

  /**
   * Invia un messaggio di testo all'assistente
   */
  const sendTextMessage = useCallback((content: string): void => {
    if (websocketRef.current?.isReady()) {
      websocketRef.current.sendText(content);
      setState('processing');
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
    setTranscripts([]);
    setActiveTools([]);
  }, []);

  /**
   * Pulisce tutte le risorse
   */
  const cleanup = useCallback(async (): Promise<void> => {
    if (audioRecorderRef.current) {
      await audioRecorderRef.current.cancelRecording();
    }
    if (audioPlayerRef.current) {
      await audioPlayerRef.current.destroy();
    }
    if (websocketRef.current) {
      websocketRef.current.destroy();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    setState('idle');
    setError(null);
    setServerStatus(null);
    setRecordingDuration(0);
    setTranscripts([]);
    setActiveTools([]);
  }, []);

  // Cleanup automatico quando il componente viene smontato
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Stati derivati
  const isConnected = ['ready', 'recording', 'processing', 'speaking'].includes(state);
  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';
  const isSpeaking = state === 'speaking';
  const canRecord = state === 'ready' && hasPermissions;
  const canStop = state === 'recording';

  return {
    // Stati
    state,
    error,
    serverStatus,
    recordingDuration,
    hasPermissions,
    chunksReceived,

    // Trascrizioni e tool
    transcripts,
    activeTools,

    // Stati derivati
    isConnected,
    isRecording,
    isProcessing,
    isSpeaking,
    canRecord,
    canStop,

    // VAD stati
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
    sendInterrupt,
    sendTextMessage,
    cleanup,
    requestPermissions,
  };
}
