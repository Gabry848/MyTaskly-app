import { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceBotWebSocket, VoiceChatCallbacks, VoiceServerPhase } from '../services/voiceBotService';
import { AudioRecorder, AudioPlayer, checkAudioPermissions, base64ToArrayBuffer } from '../utils/audioUtils';

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
 * Usa @picovoice/react-native-voice-processor per streaming PCM16 base64 in tempo reale a 24kHz
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
      console.log('WebSocket disconnesso - cleanup in corso');
      setState('disconnected');
      shouldAutoStartRecordingRef.current = false;

      // Ferma la registrazione se attiva per evitare invio audio su connessione morta
      if (audioRecorderRef.current?.isCurrentlyRecording()) {
        audioRecorderRef.current.cancelRecording().catch(err => {
          console.error('Errore fermando registrazione su disconnessione:', err);
        });
      }

      // Pulisci il timer della durata
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
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
   * Avvia la registrazione audio con streaming chunks via WebSocket.
   * Ogni frame PCM16 a 24kHz viene inviato in tempo reale come binary frame.
   *
   * IMPORTANTE: Il microfono invia audio continuamente. OpenAI gestisce
   * automaticamente VAD e interruzioni. Non serve commit o interrupt manuale.
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
      // Callback invocato per ogni chunk audio PCM16 a 24kHz
      // Converte base64 in ArrayBuffer e lo invia come binary frame
      const onChunk = (base64Chunk: string) => {
        try {
          const arrayBuffer = base64ToArrayBuffer(base64Chunk);
          websocketRef.current?.sendAudio(arrayBuffer);
        } catch (error) {
          console.error('Errore conversione chunk audio:', error);
        }
      };

      const started = await audioRecorderRef.current.startRecording(onChunk);
      if (!started) {
        setError('Impossibile avviare la registrazione');
        return false;
      }

      setState('recording');
      setError(null);

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
   * Ferma la registrazione.
   * I chunks sono già stati inviati in streaming durante la registrazione.
   * Il VAD di OpenAI rileva automaticamente la fine della frase, non serve commit manuale.
   */
  const stopRecording = useCallback(async (): Promise<boolean> => {
    if (!audioRecorderRef.current || !websocketRef.current) return false;

    // Ferma il timer della durata
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    try {
      await audioRecorderRef.current.stopRecording();

      console.log('Registrazione fermata (chunks già inviati in streaming, VAD automatico attivo)');

      setState('processing');
      setRecordingDuration(0);
      return true;

    } catch (err) {
      console.error('Errore stop registrazione:', err);
      setError('Errore durante l\'arresto della registrazione');
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
  const disconnect = useCallback(async (): Promise<void> => {
    console.log('Disconnessione in corso...');

    // Prima ferma la registrazione per evitare invio audio su connessione che sta chiudendo
    if (audioRecorderRef.current?.isCurrentlyRecording()) {
      try {
        await audioRecorderRef.current.cancelRecording();
      } catch (err) {
        console.error('Errore fermando registrazione durante disconnect:', err);
      }
    }

    // Pulisci il timer della durata
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    // Ferma l'audio player
    if (audioPlayerRef.current?.isCurrentlyPlaying()) {
      try {
        await audioPlayerRef.current.stopPlayback();
      } catch (err) {
        console.error('Errore fermando playback durante disconnect:', err);
      }
    }

    // Poi chiudi il WebSocket
    if (websocketRef.current) {
      websocketRef.current.disconnect();
    }

    setState('idle');
    setServerStatus(null);
    setError(null);
    setTranscripts([]);
    setActiveTools([]);
    setRecordingDuration(0);
  }, []);

  /**
   * Pulisce tutte le risorse
   */
  const cleanup = useCallback(async (): Promise<void> => {
    console.log('Cleanup risorse voice chat...');

    // Pulisci il timer della durata
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    // Prima ferma la registrazione
    if (audioRecorderRef.current) {
      try {
        await audioRecorderRef.current.cancelRecording();
      } catch (err) {
        console.error('Errore cleanup registrazione:', err);
      }
      audioRecorderRef.current = null;
    }

    // Poi ferma il player
    if (audioPlayerRef.current) {
      try {
        await audioPlayerRef.current.destroy();
      } catch (err) {
        console.error('Errore cleanup player:', err);
      }
      audioPlayerRef.current = null;
    }

    // Infine chiudi il WebSocket
    if (websocketRef.current) {
      try {
        websocketRef.current.destroy();
      } catch (err) {
        console.error('Errore cleanup websocket:', err);
      }
      websocketRef.current = null;
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

    // Azioni
    initialize,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    cancelRecording,
    stopPlayback,
    sendTextMessage,
    cleanup,
    requestPermissions,
  };
}
