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
  args: string;
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
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Trascrizioni e tool
  const [transcripts, setTranscripts] = useState<VoiceTranscript[]>([]);
  const [activeTools, setActiveTools] = useState<ActiveTool[]>([]);

  // Refs per gestire le istanze
  const websocketRef = useRef<VoiceBotWebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shouldAutoStartRecordingRef = useRef<boolean>(false);
  const agentEndedRef = useRef<boolean>(true); // true = agent ha finito, possiamo registrare
  const isMutedRef = useRef<boolean>(false);
  const isManuallyMutedRef = useRef<boolean>(false); // Distingue tra mute manuale e automatico
  const isStartingRecordingRef = useRef<boolean>(false); // Previene avvii concorrenti di registrazione
  const isReceivingAudioRef = useRef<boolean>(false); // true quando stiamo ricevendo chunk audio dal server
  const isMountedRef = useRef<boolean>(true); // Guard per evitare setState dopo unmount

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
      if (!isMountedRef.current) return;
      setState('authenticating');
      setError(null);
    },

    onAuthenticationSuccess: (message: string) => {
      if (!isMountedRef.current) return;
      console.log('Autenticazione completata:', message);
      setState('setting_up');
    },

    onReady: () => {
      if (!isMountedRef.current) return;
      console.log('Sessione vocale pronta');
      setState('ready');

      // Pre-riscalda TrackPlayer ora che il server è pronto e l'audio sta per arrivare.
      // Garantisce latenza zero al primo chunk anche in caso di init ritardata.
      audioPlayerRef.current?.preSetup();

      // Avvia la registrazione automaticamente se richiesto e non mutato
      if (shouldAutoStartRecordingRef.current && !isMutedRef.current) {
        shouldAutoStartRecordingRef.current = false;
        setTimeout(() => {
          startRecording();
        }, 150);
      } else if (isMutedRef.current) {
        shouldAutoStartRecordingRef.current = false;
      }
    },

    onAuthenticationFailed: (errorMsg: string) => {
      if (!isMountedRef.current) return;
      console.error('Autenticazione fallita:', errorMsg);
      setError(`Autenticazione fallita: ${errorMsg}`);
      setState('error');
    },

    onConnectionClose: () => {
      if (!isMountedRef.current) return;
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

    onStatus: async (phase: VoiceServerPhase, message: string) => {
      if (!isMountedRef.current) return;
      console.log(`[useVoiceChat] onStatus: phase=${phase}, message=${message}`);
      setServerStatus({ phase, message });

      switch (phase) {
        case 'speech_started':
          // Utente ha iniziato a parlare (VAD di OpenAI)
          console.log('[useVoiceChat] 🎤 SPEECH_STARTED: Utente sta parlando');
          setState('recording');
          break;

        case 'speech_stopped':
          // Utente ha finito di parlare (VAD di OpenAI)
          // IMPORTANTE: Fermiamo il microfono QUI e non lo riattiveremo
          // finché l'agent non ha completato TUTTO (elaborazione + riproduzione)
          console.log('[useVoiceChat] 🛑 SPEECH_STOPPED: Utente ha finito di parlare - auto-mute attivo');

          // Auto-mute: ferma la registrazione
          if (audioRecorderRef.current?.isCurrentlyRecording()) {
            audioRecorderRef.current.stopRecording().catch(err => {
              console.error('Errore fermando registrazione su speech_stopped:', err);
            });
            if (recordingIntervalRef.current) {
              clearInterval(recordingIntervalRef.current);
              recordingIntervalRef.current = null;
            }
            setRecordingDuration(0);
          }

          // Aggiorna UI del mute (solo se non è mutato manualmente)
          if (!isManuallyMutedRef.current) {
            setIsMuted(true);
            isMutedRef.current = true;
          }

          setState('processing');
          break;

        case 'agent_start':
          console.log('[useVoiceChat] Agent iniziato - assicuro auto-mute');
          setState('processing');
          agentEndedRef.current = false; // Agent sta elaborando

          // Auto-mute (safety check): assicuriamoci che il microfono sia fermato
          if (audioRecorderRef.current?.isCurrentlyRecording()) {
            audioRecorderRef.current.stopRecording().catch(err => {
              console.error('Errore fermando registrazione su agent_start:', err);
            });
            if (recordingIntervalRef.current) {
              clearInterval(recordingIntervalRef.current);
              recordingIntervalRef.current = null;
            }
            setRecordingDuration(0);
          }

          // Aggiorna UI del mute (solo se non è mutato manualmente)
          if (!isManuallyMutedRef.current) {
            setIsMuted(true);
            isMutedRef.current = true;
          }
          break;

        case 'agent_end':
          // Agent ha finito di elaborare
          console.log('[useVoiceChat] Agent terminato');
          agentEndedRef.current = true;

          // IMPORTANTE: Non riattivare il microfono se:
          // 1. Ci sono chunk audio in coda o in fase di processamento
          // 2. L'audio player sta ATTIVAMENTE riproducendo
          // 3. Stiamo ancora ricevendo audio dal server
          const hasPending = audioPlayerRef.current?.hasPendingOrQueuedChunks();
          const isPlaying = audioPlayerRef.current?.isCurrentlyPlaying();

          if (!hasPending && !isPlaying && !isReceivingAudioRef.current) {
            console.log('[useVoiceChat] Nessun audio in riproduzione, auto-unmute');
            setState('ready');

            // Auto-unmute: riattiva microfono (solo se non mutato manualmente)
            if (!isManuallyMutedRef.current) {
              setIsMuted(false);
              isMutedRef.current = false;

              // Riavvia registrazione dopo un breve delay
              setTimeout(() => {
                if (audioRecorderRef.current && websocketRef.current?.isReady()) {
                  startRecording();
                }
              }, 100);
            }
          } else {
            console.log(`[useVoiceChat] Audio in corso (pending: ${hasPending}, playing: ${isPlaying}, receiving: ${isReceivingAudioRef.current}), mantengo mute fino a fine riproduzione`);
          }
          break;

        case 'audio_end':
          // Server ha finito di inviare chunk audio per questo segmento.
          // Segna che non arriveranno altri chunk.
          isReceivingAudioRef.current = false;

          // Con TrackPlayer la riproduzione è già in corso in streaming.
          // Controlliamo sia i chunk processati che quelli ancora pending.
          if (audioPlayerRef.current && audioPlayerRef.current.hasPendingOrQueuedChunks()) {
            setState('speaking');
            console.log(`[useVoiceChat] audio_end ricevuto (${audioPlayerRef.current.getChunksCount()} chunk processati, pending: ${audioPlayerRef.current.hasPendingOrQueuedChunks()}) - avvio completamento`);
            audioPlayerRef.current.signalAllChunksReceived(() => {
              console.log('[useVoiceChat] Riproduzione streaming completata');
              // Riattiva il microfono SOLO se l'agent ha finito completamente
              if (agentEndedRef.current) {
                console.log('[useVoiceChat] Agent finito, auto-unmute e riavvio registrazione');
                setState('ready');

                // Auto-unmute: riattiva microfono (solo se non mutato manualmente)
                if (!isManuallyMutedRef.current) {
                  setIsMuted(false);
                  isMutedRef.current = false;

                  // Riavvia registrazione dopo un breve delay
                  setTimeout(() => {
                    if (audioRecorderRef.current && websocketRef.current?.isReady()) {
                      startRecording();
                    }
                  }, 100);
                }
              } else {
                // Agent non ha ancora finito, torna in processing
                // e aspetta altri chunk audio o agent_end
                console.log('[useVoiceChat] Agent non ancora finito, attendo...');
                setState('processing');
              }
            });
          } else if (agentEndedRef.current) {
            // Nessun audio da riprodurre e agent finito, torna pronto
            console.log('[useVoiceChat] Nessun audio da riprodurre, auto-unmute');
            setState('ready');

            // Auto-unmute: riattiva microfono (solo se non mutato manualmente)
            if (!isManuallyMutedRef.current) {
              setIsMuted(false);
              isMutedRef.current = false;

              // Riavvia registrazione dopo un breve delay
              setTimeout(() => {
                if (audioRecorderRef.current && websocketRef.current?.isReady()) {
                  startRecording();
                }
              }, 100);
            }
          }
          break;

        case 'interrupted':
          // Risposta interrotta dall'utente, torna pronto
          console.log('[useVoiceChat] Risposta interrotta, auto-unmute');
          agentEndedRef.current = true; // Reset
          isReceivingAudioRef.current = false; // Reset
          if (audioPlayerRef.current) {
            await audioPlayerRef.current.stopPlayback();
            audioPlayerRef.current.clearChunks();
          }
          setState('ready');

          // Auto-unmute: riattiva microfono (solo se non mutato manualmente)
          if (!isManuallyMutedRef.current) {
            setIsMuted(false);
            isMutedRef.current = false;

            // Riavvia registrazione dopo un breve delay
            setTimeout(() => {
              if (audioRecorderRef.current && websocketRef.current?.isReady()) {
                startRecording();
              }
            }, 100);
          }
          break;
      }
    },

    onAudioChunk: (audioData: string, chunkIndex: number) => {
      if (!isMountedRef.current) return;
      if (audioPlayerRef.current) {
        // Segna che stiamo ricevendo audio SINCRONAMENTE prima dell'async addChunk
        isReceivingAudioRef.current = true;

        // Aggiunge il chunk alla queue di TrackPlayer e avvia riproduzione streaming
        audioPlayerRef.current.addChunk(audioData, chunkIndex).catch(err => {
          console.error('[useVoiceChat] Errore aggiunta chunk a TrackPlayer:', err);
        });
        setChunksReceived(prev => prev + 1);

        // Transiziona a 'speaking' al primo chunk ricevuto
        setState(prev => prev !== 'speaking' ? 'speaking' : prev);
      }
    },

    onTranscript: (role: 'user' | 'assistant', content: string) => {
      if (!isMountedRef.current) return;
      setTranscripts(prev => [...prev, { role, content }]);
    },

    onToolCall: (toolName: string, args: string) => {
      if (!isMountedRef.current) return;
      setActiveTools(prev => [...prev, { name: toolName, args, status: 'running' }]);
    },

    onToolOutput: (toolName: string, output: string) => {
      if (!isMountedRef.current) return;
      setActiveTools(prev => prev.map(t =>
        t.name === toolName && t.status === 'running'
          ? { ...t, status: 'complete' as const, output }
          : t
      ));
    },

    onDone: () => {
      if (!isMountedRef.current) return;
      console.log('Sessione vocale terminata dal server');
      setState('disconnected');
    },

    onError: (errorMessage: string) => {
      if (!isMountedRef.current) return;
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

      // Pre-inizializza TrackPlayer per evitare ritardi al primo chunk audio.
      // Questo elimina la race condition dove audio_end/agent_end arrivano
      // prima che TrackPlayer abbia finito il setup.
      await audioPlayerRef.current.preSetup();

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
    agentEndedRef.current = true; // Reset per nuova sessione
    isManuallyMutedRef.current = false; // Reset mute manuale
    isReceivingAudioRef.current = false; // Reset audio reception

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

    // Previeni avvii concorrenti (es. doppio onComplete)
    if (isStartingRecordingRef.current || audioRecorderRef.current.isCurrentlyRecording()) {
      console.log('[useVoiceChat] Registrazione già in corso o in avvio, ignorato');
      return false;
    }

    isStartingRecordingRef.current = true;

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
        isStartingRecordingRef.current = false;
        return false;
      }

      setState('recording');
      setError(null);
      isStartingRecordingRef.current = false;

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
      isStartingRecordingRef.current = false;
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
   * Muta il microfono (azione manuale dell'utente)
   */
  const mute = useCallback(async (): Promise<void> => {
    console.log('[useVoiceChat] Mute manuale attivato');
    setIsMuted(true);
    isMutedRef.current = true;
    isManuallyMutedRef.current = true; // Marca come mute manuale

    // Ferma la registrazione se è attiva
    if (audioRecorderRef.current?.isCurrentlyRecording()) {
      try {
        await audioRecorderRef.current.cancelRecording();

        // Pulisci il timer della durata
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }

        setRecordingDuration(0);
        // Mantieni lo stato 'ready' invece di tornare a 'recording'
        if (state === 'recording') {
          setState('ready');
        }
      } catch (err) {
        console.error('Errore durante il mute:', err);
      }
    }
  }, [state]);

  /**
   * Riattiva il microfono (azione manuale dell'utente)
   */
  const unmute = useCallback(async (): Promise<void> => {
    console.log('[useVoiceChat] Unmute manuale attivato');
    setIsMuted(false);
    isMutedRef.current = false;
    isManuallyMutedRef.current = false; // Rimuove il flag di mute manuale

    // Riavvia la registrazione se siamo in stato 'ready'
    if (state === 'ready' && websocketRef.current?.isReady()) {
      setTimeout(() => {
        startRecording();
      }, 100);
    }
  }, [state, startRecording]);

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
    setIsMuted(false); // Reset mute state
    isMutedRef.current = false;
    isManuallyMutedRef.current = false; // Reset mute manuale
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
  const cleanupRef = useRef(cleanup);
  useEffect(() => {
    cleanupRef.current = cleanup;
  });
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanupRef.current();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    isMuted,

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
    mute,
    unmute,
  };
}
