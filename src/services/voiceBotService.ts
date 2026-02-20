import { getValidToken } from "./authService";
import {
  trackVoiceChatStarted,
  trackVoiceChatEnded,
  trackVoiceChatError,
  trackVoiceChatReconnect,
  markVoiceSpeechStopped,
  trackVoiceResponseTime,
} from './analyticsService';

// ============= VOICE CHAT WEBSOCKET (OpenAI Realtime API) =============

/**
 * Tipi per i messaggi client -> server (JSON text frames)
 */
export interface VoiceAuthMessage {
  type: 'auth';
  token: string;
}

export interface VoiceTextMessage {
  type: 'text';
  content: string;
}

export type VoiceClientMessage =
  | VoiceAuthMessage
  | VoiceTextMessage;

/**
 * NOTA: L'audio viene inviato come WebSocket binary frame (raw PCM16 bytes),
 * NON come messaggio JSON. Vedere sendAudio() per i dettagli.
 */

/**
 * Tipi per i messaggi server -> client
 */
export type VoiceServerPhase =
  | 'authenticated'
  | 'ready'
  | 'speech_started'    // Utente ha iniziato a parlare (VAD di OpenAI)
  | 'speech_stopped'    // Utente ha finito di parlare (VAD di OpenAI)
  | 'interrupted'
  | 'audio_end'
  | 'agent_start'
  | 'agent_end';

export interface VoiceStatusResponse {
  type: 'status';
  phase: VoiceServerPhase;
  message?: string;
}

export interface VoiceAudioResponse {
  type: 'audio';
  data: string; // base64 PCM16
  chunk_index: number;
}

export interface VoiceTranscriptResponse {
  type: 'transcript';
  role: 'user' | 'assistant';
  content: string;
}

export interface VoiceToolCallResponse {
  type: 'tool_call';
  tool_name: string;
  tool_args: string;
}

export interface VoiceToolOutputResponse {
  type: 'tool_output';
  tool_name: string;
  output: string;
}

export interface VoiceErrorResponse {
  type: 'error';
  message: string;
}

export interface VoiceDoneResponse {
  type: 'done';
}

export type VoiceServerMessage =
  | VoiceStatusResponse
  | VoiceAudioResponse
  | VoiceTranscriptResponse
  | VoiceToolCallResponse
  | VoiceToolOutputResponse
  | VoiceErrorResponse
  | VoiceDoneResponse;

/**
 * Stati di autenticazione/connessione WebSocket
 */
export enum WebSocketAuthState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  READY = 'ready',
  FAILED = 'failed'
}

/**
 * Callback per gestire i diversi tipi di risposta dal WebSocket vocale
 */
export interface VoiceChatCallbacks {
  onStatus?: (phase: VoiceServerPhase, message: string) => void | Promise<void>;
  onAudioChunk?: (audioData: string, chunkIndex: number) => void;
  onTranscript?: (role: 'user' | 'assistant', content: string) => void;
  onToolCall?: (toolName: string, args: string) => void;
  onToolOutput?: (toolName: string, output: string) => void;
  onError?: (error: string) => void;
  onConnectionOpen?: () => void;
  onConnectionClose?: () => void;
  onAuthenticationSuccess?: (message: string) => void;
  onAuthenticationFailed?: (error: string) => void;
  onReady?: () => void;
  onDone?: () => void;
}

/**
 * Specifiche audio per il WebSocket vocale:
 * - Formato: PCM16 (signed 16-bit little-endian)
 * - Sample rate: 24000 Hz
 * - Canali: 1 (mono)
 * - Byte per sample: 2
 * - Dimensione chunk consigliata: 4800 bytes (100ms di audio @ 24kHz)
 * - Intervallo invio: ogni 100ms
 */
export const VOICE_AUDIO_SAMPLE_RATE = 24000;
export const VOICE_AUDIO_CHANNELS = 1;
export const VOICE_AUDIO_BYTES_PER_SAMPLE = 2;
export const VOICE_RECOMMENDED_CHUNK_SIZE_BYTES = 4800; // 100ms @ 24kHz mono PCM16
export const VOICE_CHUNK_INTERVAL_MS = 100; // Intervallo di invio consigliato
const MAX_AUDIO_CHUNK_BYTES = 2_500_000; // Safety limit per validazione

/**
 * Classe per gestire la connessione WebSocket per la chat vocale
 * Compatibile con l'OpenAI Realtime API tramite il backend
 *
 * IMPORTANTE:
 * - L'audio viene inviato come binary frame (raw PCM16 bytes) continuamente
 * - Il VAD (Voice Activity Detection) è gestito automaticamente da OpenAI
 * - Non serve inviare messaggi di commit o interrupt (gestiti automaticamente)
 * - Il microfono resta sempre attivo, anche durante le risposte dell'assistente
 */
export class VoiceBotWebSocket {
  private ws: WebSocket | null = null;
  private callbacks: VoiceChatCallbacks;
  private baseUrl: string = 'wss://taskly-production.up.railway.app';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectDelay: number = 1000;
  private authState: WebSocketAuthState = WebSocketAuthState.DISCONNECTED;
  private messageQueue: VoiceClientMessage[] = [];
  private authTimeout: NodeJS.Timeout | null = null;
  private readonly AUTH_TIMEOUT_MS = 15000; // 15s timeout (setup MCP + RealtimeAgent)
  // ── Analytics ──
  private firstAudioChunkReceived: boolean = false;

  constructor(callbacks: VoiceChatCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Connette al WebSocket per la chat vocale
   */
  async connect(): Promise<boolean> {
    try {
      const token = await getValidToken();
      if (!token) {
        this.authState = WebSocketAuthState.FAILED;
        this.callbacks.onError?.('Token di autenticazione non disponibile');
        return false;
      }

      this.authState = WebSocketAuthState.CONNECTING;
      const wsUrl = `${this.baseUrl}/chat/voice-bot-websocket`;

      return new Promise((resolve, reject) => {
        this.ws = new WebSocket(wsUrl);

        const connectionTimeout = setTimeout(() => {
          this.authState = WebSocketAuthState.FAILED;
          this.callbacks.onError?.('Timeout connessione WebSocket');
          reject(new Error('Timeout connessione WebSocket'));
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          this.reconnectAttempts = 0;
          this.firstAudioChunkReceived = false;
          this.startAuthentication(token);
          this.callbacks.onConnectionOpen?.();
          trackVoiceChatStarted();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data);
            this.handleResponse(response);
          } catch (error) {
            console.error('Errore parsing risposta WebSocket:', error);
            this.callbacks.onError?.('Errore nel formato della risposta del server');
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('Errore WebSocket vocale:', error);
          this.authState = WebSocketAuthState.FAILED;
          this.clearAuthTimeout();
          trackVoiceChatError('WebSocket connection error');
          this.callbacks.onError?.('Errore di connessione WebSocket');
          reject(new Error('Errore di connessione WebSocket'));
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.authState = WebSocketAuthState.DISCONNECTED;
          this.clearAuthTimeout();
          this.messageQueue = [];
          this.callbacks.onConnectionClose?.();

          if (this.reconnectAttempts < this.maxReconnectAttempts && event.code !== 1000) {
            this.attemptReconnect();
          }
        };
      });
    } catch (error) {
      console.error('Errore connessione WebSocket vocale:', error);
      this.authState = WebSocketAuthState.FAILED;
      this.callbacks.onError?.('Impossibile connettersi al servizio vocale');
      return false;
    }
  }

  /**
   * Avvia il processo di autenticazione
   */
  private startAuthentication(token: string): void {
    if (!this.isConnected()) return;

    this.authState = WebSocketAuthState.AUTHENTICATING;

    this.authTimeout = setTimeout(() => {
      this.authState = WebSocketAuthState.FAILED;
      this.callbacks.onAuthenticationFailed?.('Timeout autenticazione - il server non ha risposto');
      this.disconnect();
    }, this.AUTH_TIMEOUT_MS);

    const authMessage: VoiceAuthMessage = {
      type: 'auth',
      token: token.startsWith('Bearer ') ? token : `Bearer ${token}`
    };

    this.ws!.send(JSON.stringify(authMessage));
  }

  private clearAuthTimeout(): void {
    if (this.authTimeout) {
      clearTimeout(this.authTimeout);
      this.authTimeout = null;
    }
  }

  /**
   * Gestisce le risposte ricevute dal WebSocket
   */
  private handleResponse(response: VoiceServerMessage): void {
    if (!this.validateResponse(response)) {
      console.warn('Messaggio WebSocket non valido ricevuto:', response);
      return;
    }

    switch (response.type) {
      case 'status':
        this.handleStatusResponse(response as VoiceStatusResponse);
        break;

      case 'audio':
        this.handleAudioResponse(response as VoiceAudioResponse);
        break;

      case 'transcript':
        this.handleTranscriptResponse(response as VoiceTranscriptResponse);
        break;

      case 'tool_call':
        this.callbacks.onToolCall?.(
          (response as VoiceToolCallResponse).tool_name,
          (response as VoiceToolCallResponse).tool_args
        );
        break;

      case 'tool_output':
        this.callbacks.onToolOutput?.(
          (response as VoiceToolOutputResponse).tool_name,
          (response as VoiceToolOutputResponse).output
        );
        break;

      case 'error':
        this.handleErrorResponse(response as VoiceErrorResponse);
        break;

      case 'done':
        this.callbacks.onDone?.();
        break;
    }
  }

  /**
   * Gestisce risposta di stato
   */
  private handleStatusResponse(response: VoiceStatusResponse): void {
    const phase = response.phase;
    const message = response.message || '';

    console.log(`[VoiceBotWebSocket] handleStatusResponse: phase=${phase}, message=${message}`);

    switch (phase) {
      case 'authenticated':
        console.log('Autenticazione WebSocket riuscita:', message);
        this.authState = WebSocketAuthState.AUTHENTICATED;
        this.callbacks.onAuthenticationSuccess?.(message);
        this.callbacks.onStatus?.(phase, message);
        // Non processare la coda qui - aspettare 'ready'
        break;

      case 'ready':
        console.log('Sessione vocale pronta');
        this.authState = WebSocketAuthState.READY;
        this.clearAuthTimeout();
        this.processQueuedMessages();
        this.callbacks.onReady?.();
        this.callbacks.onStatus?.(phase, message);
        break;

      case 'speech_started':
      case 'speech_stopped':
        markVoiceSpeechStopped();
        this.callbacks.onStatus?.(phase, message);
        break;

      default:
        console.warn('Fase WebSocket sconosciuta:', phase);
    }
  }

  /**
   * Gestisce risposta audio PCM16
   */
  private handleAudioResponse(response: VoiceAudioResponse): void {
    if (this.authState === WebSocketAuthState.DISCONNECTED) return;

    if (response.data) {
      // ── Analytics: registra latenza al primo chunk audio ──
      if (!this.firstAudioChunkReceived) {
        this.firstAudioChunkReceived = true;
        trackVoiceResponseTime();
      }
      this.callbacks.onAudioChunk?.(response.data, response.chunk_index);
    }
  }

  /**
   * Gestisce risposta di trascrizione
   */
  private handleTranscriptResponse(response: VoiceTranscriptResponse): void {
    this.callbacks.onTranscript?.(response.role, response.content);
  }

  /**
   * Gestisce risposta di errore
   */
  private handleErrorResponse(response: VoiceErrorResponse): void {
    if (!response.message) return;

    if (this.authState === WebSocketAuthState.AUTHENTICATING) {
      this.authState = WebSocketAuthState.FAILED;
      this.clearAuthTimeout();
      trackVoiceChatError(`auth_failed: ${response.message}`);
      this.callbacks.onAuthenticationFailed?.(response.message);
    } else {
      trackVoiceChatError(response.message);
      this.callbacks.onError?.(response.message);
    }
  }

  /**
   * Invia un chunk audio PCM16 raw al server come binary frame
   *
   * @param pcm16Data - Raw PCM16 bytes (ArrayBuffer o Uint8Array)
   *                    Formato: 24kHz, mono, 16-bit little-endian
   *                    Dimensione consigliata: 4800 bytes (100ms)
   *
   * IMPORTANTE: Il microfono deve inviare audio continuamente dal momento
   * in cui si riceve "ready" fino alla chiusura del WebSocket.
   * OpenAI gestisce automaticamente VAD e interruzioni.
   */
  sendAudio(pcm16Data: ArrayBuffer | Uint8Array): void {
    // Non logghiamo errori se la connessione è già chiusa per evitare spam di log
    // In questo caso semplicemente scartiamo l'audio silenziosamente
    if (!this.isConnected() || !this.isReady()) {
      return;
    }

    const bytes = pcm16Data instanceof Uint8Array ? pcm16Data.buffer : pcm16Data;

    // Invia come binary frame (NON JSON)
    this.ws!.send(bytes);
  }

  /**
   * Invia un messaggio di testo all'assistente
   */
  sendText(content: string): void {
    const msg: VoiceTextMessage = { type: 'text', content };
    this.sendOrQueue(msg);
  }

  /**
   * Invia un messaggio o lo mette in coda se non ancora pronto
   */
  private sendOrQueue(message: VoiceClientMessage): void {
    if (!this.isConnected()) {
      // Non logghiamo errori se la connessione è già chiusa per evitare spam di log
      return;
    }

    if (!this.isReady()) {
      this.messageQueue.push(message);
      return;
    }

    const json = JSON.stringify(message);
    this.ws!.send(json);
  }

  /**
   * Processa i messaggi in coda dopo che la sessione e' pronta
   */
  private processQueuedMessages(): void {
    if (this.messageQueue.length === 0) return;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.isConnected()) {
        this.ws!.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Valida una risposta WebSocket
   */
  private validateResponse(response: any): response is VoiceServerMessage {
    if (!response || typeof response !== 'object') return false;

    const validTypes = ['status', 'audio', 'transcript', 'tool_call', 'tool_output', 'error', 'done'];
    if (!validTypes.includes(response.type)) return false;

    // Verifica lunghezza messaggi
    if (response.message && typeof response.message === 'string' && response.message.length > 5000) {
      console.warn('Messaggio troppo lungo ricevuto dal server');
      return false;
    }

    // Verifica chunk audio
    if (response.type === 'audio' && response.data) {
      const approxBytes = Math.floor(response.data.length * 0.75);
      if (approxBytes > MAX_AUDIO_CHUNK_BYTES) {
        console.warn(`Chunk audio molto grande (~${approxBytes} bytes)`);
      }
    }

    return true;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  isAuthenticated(): boolean {
    return this.authState === WebSocketAuthState.AUTHENTICATED ||
           this.authState === WebSocketAuthState.READY;
  }

  isReady(): boolean {
    return this.authState === WebSocketAuthState.READY;
  }

  getAuthState(): WebSocketAuthState {
    return this.authState;
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    trackVoiceChatReconnect(this.reconnectAttempts);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect(): void {
    this.clearAuthTimeout();
    this.messageQueue = [];
    this.authState = WebSocketAuthState.DISCONNECTED;
    trackVoiceChatEnded();

    if (this.ws) {
      this.ws.close(1000, 'Disconnessione volontaria');
      this.ws = null;
    }
  }

  destroy(): void {
    this.disconnect();
    this.callbacks = {};
    this.reconnectAttempts = 0;
  }
}
