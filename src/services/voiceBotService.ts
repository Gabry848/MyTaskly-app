import { getValidToken } from "./authService";

// ============= VOICE CHAT WEBSOCKET (OpenAI Realtime API) =============

/**
 * Tipi per i messaggi client -> server
 */
export interface VoiceAuthMessage {
  type: 'auth';
  token: string;
}

export interface VoiceAudioMessage {
  type: 'audio';
  data: string; // base64 PCM16
}

export interface VoiceAudioCommitMessage {
  type: 'audio_commit';
}

export interface VoiceTextMessage {
  type: 'text';
  content: string;
}

export interface VoiceInterruptMessage {
  type: 'interrupt';
}

export type VoiceClientMessage =
  | VoiceAuthMessage
  | VoiceAudioMessage
  | VoiceAudioCommitMessage
  | VoiceTextMessage
  | VoiceInterruptMessage;

/**
 * Tipi per i messaggi server -> client
 */
export type VoiceServerPhase =
  | 'authenticated'
  | 'ready'
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

export interface VoiceToolStartResponse {
  type: 'tool_start';
  tool_name: string;
  arguments: string;
}

export interface VoiceToolEndResponse {
  type: 'tool_end';
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
  | VoiceToolStartResponse
  | VoiceToolEndResponse
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
  onStatus?: (phase: VoiceServerPhase, message: string) => void;
  onAudioChunk?: (audioData: string, chunkIndex: number) => void;
  onTranscript?: (role: 'user' | 'assistant', content: string) => void;
  onToolStart?: (toolName: string, args: string) => void;
  onToolEnd?: (toolName: string, output: string) => void;
  onError?: (error: string) => void;
  onConnectionOpen?: () => void;
  onConnectionClose?: () => void;
  onAuthenticationSuccess?: (message: string) => void;
  onAuthenticationFailed?: (error: string) => void;
  onReady?: () => void;
  onDone?: () => void;
}

const MAX_AUDIO_CHUNK_BYTES = 2_500_000;

/**
 * Classe per gestire la connessione WebSocket per la chat vocale
 * Compatibile con l'OpenAI Realtime API tramite il backend
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
          this.startAuthentication(token);
          this.callbacks.onConnectionOpen?.();
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

      case 'tool_start':
        this.callbacks.onToolStart?.(
          (response as VoiceToolStartResponse).tool_name,
          (response as VoiceToolStartResponse).arguments
        );
        break;

      case 'tool_end':
        this.callbacks.onToolEnd?.(
          (response as VoiceToolEndResponse).tool_name,
          (response as VoiceToolEndResponse).output
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

      case 'interrupted':
      case 'audio_end':
      case 'agent_start':
      case 'agent_end':
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
      this.callbacks.onAuthenticationFailed?.(response.message);
    } else {
      this.callbacks.onError?.(response.message);
    }
  }

  /**
   * Invia un chunk audio PCM16 base64 al server
   */
  sendAudio(base64Pcm16Data: string): void {
    console.log(`🔍 DEBUG sendAudio: base64 length=${base64Pcm16Data.length}, approx bytes=${Math.floor(base64Pcm16Data.length * 0.75)}`);
    console.log(`🔍 DEBUG sendAudio: primi 50 chars base64="${base64Pcm16Data.substring(0, 50)}"`);
    console.log(`🔍 DEBUG sendAudio: WebSocket state=${this.ws?.readyState}, authState=${this.authState}, isReady=${this.isReady()}`);
    const msg: VoiceAudioMessage = { type: 'audio', data: base64Pcm16Data };
    const jsonMsg = JSON.stringify(msg);
    console.log(`🔍 DEBUG sendAudio: JSON message size=${jsonMsg.length} bytes`);
    this.sendOrQueue(msg);
  }

  /**
   * Committa il buffer audio (opzionale - il server ha semantic VAD)
   */
  sendAudioCommit(): void {
    console.log(`🔍 DEBUG sendAudioCommit: WebSocket state=${this.ws?.readyState}, authState=${this.authState}, isReady=${this.isReady()}`);
    const msg: VoiceAudioCommitMessage = { type: 'audio_commit' };
    this.sendOrQueue(msg);
    console.log('🔍 DEBUG sendAudioCommit: messaggio inviato');
  }

  /**
   * Invia un messaggio di testo all'assistente
   */
  sendText(content: string): void {
    const msg: VoiceTextMessage = { type: 'text', content };
    this.sendOrQueue(msg);
  }

  /**
   * Interrompe la risposta corrente dell'assistente
   */
  sendInterrupt(): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify({ type: 'interrupt' } as VoiceInterruptMessage));
    }
  }

  /**
   * Invia un messaggio o lo mette in coda se non ancora pronto
   */
  private sendOrQueue(message: VoiceClientMessage): void {
    if (!this.isConnected()) {
      console.log(`🔍 DEBUG sendOrQueue: BLOCCATO - non connesso (type=${message.type})`);
      this.callbacks.onError?.('Connessione WebSocket non disponibile');
      return;
    }

    if (!this.isReady()) {
      console.log(`🔍 DEBUG sendOrQueue: IN CODA - non pronto (type=${message.type}, authState=${this.authState})`);
      this.messageQueue.push(message);
      return;
    }

    const json = JSON.stringify(message);
    console.log(`🔍 DEBUG sendOrQueue: INVIATO type=${message.type}, size=${json.length} bytes`);
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

    const validTypes = ['status', 'audio', 'transcript', 'tool_start', 'tool_end', 'error', 'done'];
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

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect(): void {
    this.clearAuthTimeout();
    this.messageQueue = [];
    this.authState = WebSocketAuthState.DISCONNECTED;

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
