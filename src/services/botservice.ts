import { getValidToken } from "./authService";
import { fetch } from 'expo/fetch';


/**
 * Callback per gestire chunk di testo in streaming
 */
export type StreamingCallback = (chunk: string, isComplete: boolean) => void;

/**
 * Invia un messaggio testuale al bot e riceve una risposta in streaming
 * Utilizza l'endpoint /chat/text per la chat scritta con supporto streaming
 * @param {string} userMessage - Il messaggio dell'utente da inviare al bot
 * @param {string} modelType - Il tipo di modello da utilizzare ('base' o 'advanced')
 * @param {Array} previousMessages - Gli ultimi messaggi scambiati tra utente e bot per il contesto
 * @param {StreamingCallback} onStreamChunk - Callback per ricevere chunk in streaming (opzionale)
 * @returns {Promise<string>} - La risposta completa del bot
 */
export async function sendMessageToBot(
  userMessage: string,
  modelType: "base" | "advanced" = "base",
  previousMessages: any[] = [],
  onStreamChunk?: StreamingCallback
): Promise<string> {
  try {
    // Verifica che l'utente sia autenticato
    const token = await getValidToken();
    if (!token) {
      return "Mi dispiace, sembra che tu non sia autenticato. Effettua il login per continuare.";
    }
    
    // Costruisci il payload per la richiesta
    const requestPayload = {
      quest: userMessage,
      model: modelType,
    };

    // Invia la richiesta al server con supporto streaming usando expo fetch
    const response = await fetch("https://taskly-production.up.railway.app/chat/text", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      console.log(response)
      throw new Error("Nessun body nella risposta");
    }

    // Processa la risposta in streaming usando ReadableStream con expo/fetch
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullMessage = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        // Decodifica ogni chunk immediatamente
        const text = decoder.decode(value, { stream: true });
        
        // Dividi il testo per linee per gestire più messaggi JSON
        const lines = text.split('\n').filter((line: string) => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: {')) {
            try {
              const jsonStr = line.replace('data: ', '').trim();
              const parsed = JSON.parse(jsonStr);

              if (parsed.type === 'content' && parsed.content) {
                fullMessage += parsed.content;
                console.log(parsed.content); // Log del contenuto in real-time

                // Chiama la callback se fornita
                if (onStreamChunk) {
                  onStreamChunk(parsed.content, false);
                }
              }
            } catch (e: any) {
              console.log("Errore parsing JSON per linea:", line);
              console.log("Errore:", e.message);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Notifica il completamento dello streaming
    if (onStreamChunk) {
      onStreamChunk('', true);
    }

    return fullMessage || "Nessuna risposta ricevuta dal bot.";
    
  } catch (error: any) {
    console.error("❌ Errore nella comunicazione con il bot:", error);
    
    // Gestisci errori specifici per fetch
    if (error.message?.includes('status: 401')) {
      return "Sessione scaduta. Effettua nuovamente il login.";
    }
    
    if (error.message?.includes('status: 429')) {
      return "Troppe richieste. Riprova tra qualche secondo.";
    }
    
    if (error.message?.includes('status: 5')) {
      return "Il servizio è temporaneamente non disponibile. Riprova più tardi.";
    }
    
    // Errore generico
    return "Mi dispiace, si è verificato un errore. Riprova più tardi.";
  }
}

/**
 * Elimina la cronologia chat dal server
 * @returns {Promise<boolean>} - True se l'eliminazione è andata a buon fine, False altrimenti
 */
export async function clearChatHistory(): Promise<boolean> {
  try {
    // Verifica che l'utente sia autenticato
    const token = await getValidToken();
    if (!token) {
      console.warn("Utente non autenticato - impossibile eliminare la cronologia");
      return false;
    }

    // Invia la richiesta DELETE al server per eliminare la cronologia
    const response = await fetch("https://taskly-production.up.railway.app/chat/history/clear", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Errore nell'eliminazione cronologia chat: HTTP ${response.status}`);
      return false;
    }

    console.log("✅ Cronologia chat eliminata dal server");
    return true;
    
  } catch (error: any) {
    console.error("❌ Errore nell'eliminazione della cronologia chat:", error);
    return false;
  }
}

/**
 * Crea una nuova chat vuota
 * @returns {Promise<Array>} - Array vuoto per inizializzare una nuova chat
 */
export async function createNewChat(): Promise<any[]> {
  // Restituisce un array vuoto - i messaggi di benvenuto possono essere gestiti dall'UI
  return [];
}

/**
 * Valida un messaggio prima dell'invio
 * @param {string} message - Il messaggio da validare
 * @returns {boolean} - True se il messaggio è valido
 */
export function validateMessage(message: string): boolean {
  if (!message || typeof message !== 'string') {
    return false;
  }
  
  const trimmedMessage = message.trim();
  
  // Controllo lunghezza minima e massima
  if (trimmedMessage.length === 0 || trimmedMessage.length > 5000) {
    return false;
  }
  
  return true;
}

/**
 * Formatta un messaggio per la visualizzazione
 * @param {string} message - Il messaggio da formattare
 * @returns {string} - Il messaggio formattato con supporto Markdown
 */
export function formatMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return "";
  }
  
  let formattedMessage = message.trim();
  
  // Converte alcuni pattern comuni in Markdown
  // Titoli con emoji task
  formattedMessage = formattedMessage.replace(
    /📅 TASK PER LA DATA (.+?):/g, 
    '## 📅 Task per la data $1\n\n'
  );
  
  // Totale task trovati
  formattedMessage = formattedMessage.replace(
    /📊 Totale task trovati: (\d+)/g,
    '\n---\n**📊 Totale task trovati:** `$1`'
  );
  
  // Pattern per evidenziare i numeri di task
  formattedMessage = formattedMessage.replace(
    /(\d+) task/g,
    '**$1** task'
  );
  
  // Pattern per evidenziare le date
  formattedMessage = formattedMessage.replace(
    /(\d{4}-\d{2}-\d{2})/g,
    '`$1`'
  );
  
  // Pattern per evidenziare gli orari
  formattedMessage = formattedMessage.replace(
    /(\d{2}:\d{2})/g,
    '`$1`'
  );
  
  // Converti status in badge
  formattedMessage = formattedMessage.replace(
    /"status":\s*"([^"]+)"/g,
    '"status": **$1**'
  );
  
  // Converti category_name in evidenziato
  formattedMessage = formattedMessage.replace(
    /"category_name":\s*"([^"]+)"/g,
    '"category_name": *$1*'
  );
  
  return formattedMessage;
}

/**
 * Determina se una risposta del bot contiene dati strutturati (JSON)
 * @param {string} response - La risposta del bot
 * @returns {boolean} - True se la risposta contiene dati strutturati
 */
export function isStructuredResponse(response: string): boolean {
  if (!response || typeof response !== 'string') {
    return false;
  }
  
  try {
    const parsed = JSON.parse(response);
    return parsed && typeof parsed === 'object' && parsed.mode === 'view';
  } catch {
    return false;
  }
}

/**
 * Estrae i dati strutturati da una risposta del bot
 * @param {string} response - La risposta del bot in formato JSON
 * @returns {any} - I dati strutturati estratti o null se non validi
 */
export function extractStructuredData(response: string): any {
  try {
    return JSON.parse(response);
  } catch {
    return null;
  }
}

// ============= VOICE CHAT WEBSOCKET =============

/**
 * Tipi per i messaggi WebSocket della chat vocale
 */
export interface VoiceWebSocketMessage {
  type: 'auth' | 'audio_chunk' | 'control';
  token?: string;
  data?: string; // base64 audio data
  is_final?: boolean;
  action?: 'pause' | 'resume' | 'cancel';
}

export interface VoiceWebSocketResponse {
  type: 'status' | 'audio_chunk' | 'error';
  phase?: 'authenticated' | 'receiving_audio' | 'transcription' | 'ai_processing' | 'tts_generation' | 'audio_streaming' | 'complete';
  message?: string;
  data?: string; // base64 audio data
  chunk_index?: number;
}

/**
 * Stati di autenticazione WebSocket
 */
export enum WebSocketAuthState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  FAILED = 'failed'
}

/**
 * Interfaccia per messaggi in coda prima dell'autenticazione
 */
interface QueuedMessage {
  type: 'audio_chunk' | 'control';
  data?: string;
  is_final?: boolean;
  action?: 'pause' | 'resume' | 'cancel';
}

/**
 * Callback per gestire i diversi tipi di risposta dal WebSocket vocale
 */
export interface VoiceChatCallbacks {
  onStatus?: (phase: string, message: string) => void;
  onAudioChunk?: (audioData: string, chunkIndex?: number) => void;
  onError?: (error: string) => void;
  onConnectionOpen?: () => void;
  onConnectionClose?: () => void;
  onAuthenticationSuccess?: (message: string) => void;
  onAuthenticationFailed?: (error: string) => void;
}

/**
 * Classe per gestire la connessione WebSocket per la chat vocale
 */
export class VoiceBotWebSocket {
  private ws: WebSocket | null = null;
  private callbacks: VoiceChatCallbacks;
  private baseUrl: string = 'wss://api.mytasklyapp.com';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectDelay: number = 1000;
  private authState: WebSocketAuthState = WebSocketAuthState.DISCONNECTED;
  private messageQueue: QueuedMessage[] = [];
  private authTimeout: NodeJS.Timeout | null = null;
  private readonly AUTH_TIMEOUT_MS = 10000; // 10 secondi timeout per autenticazione

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
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('🎤 Connessione WebSocket vocale aperta');
        this.reconnectAttempts = 0;

        // Invia autenticazione e avvia timeout
        this.startAuthentication(token);
        this.callbacks.onConnectionOpen?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const response: VoiceWebSocketResponse = JSON.parse(event.data);
          this.handleResponse(response);
        } catch (error) {
          console.error('Errore parsing risposta WebSocket:', error);
          this.callbacks.onError?.('Errore nel formato della risposta del server');
        }
      };

      this.ws.onerror = (error) => {
        console.error('Errore WebSocket vocale:', error);
        this.authState = WebSocketAuthState.FAILED;
        this.clearAuthTimeout();
        this.callbacks.onError?.('Errore di connessione WebSocket');
      };

      this.ws.onclose = (event) => {
        console.log('🎤 Connessione WebSocket vocale chiusa:', event.code, event.reason);
        this.authState = WebSocketAuthState.DISCONNECTED;
        this.clearAuthTimeout();
        this.clearMessageQueue();
        this.callbacks.onConnectionClose?.();

        // Tentativo di riconnessione automatica
        if (this.reconnectAttempts < this.maxReconnectAttempts && event.code !== 1000) {
          this.attemptReconnect();
        }
      };

      return true;
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

    // Avvia timeout per autenticazione
    this.authTimeout = setTimeout(() => {
      this.handleAuthenticationTimeout();
    }, this.AUTH_TIMEOUT_MS);

    const authMessage: VoiceWebSocketMessage = {
      type: 'auth',
      token: token
    };

    console.log('🔐 Invio autenticazione JWT');
    this.ws!.send(JSON.stringify(authMessage));
  }

  /**
   * Gestisce il timeout dell'autenticazione
   */
  private handleAuthenticationTimeout(): void {
    console.error('⏰ Timeout autenticazione WebSocket');
    this.authState = WebSocketAuthState.FAILED;
    this.callbacks.onAuthenticationFailed?.('Timeout autenticazione - il server non ha risposto');
    this.disconnect();
  }

  /**
   * Pulisce il timeout di autenticazione
   */
  private clearAuthTimeout(): void {
    if (this.authTimeout) {
      clearTimeout(this.authTimeout);
      this.authTimeout = null;
    }
  }

  /**
   * Gestisce le risposte ricevute dal WebSocket
   */
  private handleResponse(response: VoiceWebSocketResponse): void {
    // Validazione sicurezza messaggio
    if (!this.validateResponse(response)) {
      console.warn('Messaggio WebSocket non valido ricevuto:', response);
      return;
    }

    switch (response.type) {
      case 'status':
        this.handleStatusResponse(response);
        break;

      case 'audio_chunk':
        this.handleAudioChunkResponse(response);
        break;

      case 'error':
        this.handleErrorResponse(response);
        break;

      default:
        console.warn('Tipo di risposta WebSocket sconosciuto:', response.type);
    }
  }

  /**
   * Gestisce risposta di stato (inclusa autenticazione)
   */
  private handleStatusResponse(response: VoiceWebSocketResponse): void {
    if (!response.phase || !response.message) return;

    switch (response.phase) {
      case 'authenticated':
        this.handleAuthenticationSuccess(response.message);
        break;

      case 'receiving_audio':
      case 'transcription':
      case 'transcription_complete':
      case 'ai_processing':
      case 'ai_complete':
      case 'tts_generation':
      case 'tts_complete':
      case 'audio_streaming':
      case 'complete':
        this.callbacks.onStatus?.(response.phase, response.message);
        break;

      default:
        console.warn('Fase WebSocket sconosciuta:', response.phase);
    }
  }

  /**
   * Gestisce il successo dell'autenticazione
   */
  private handleAuthenticationSuccess(message: string): void {
    console.log('✅ Autenticazione WebSocket riuscita:', message);
    this.authState = WebSocketAuthState.AUTHENTICATED;
    this.clearAuthTimeout();

    // Processa messaggi in coda
    this.processQueuedMessages();

    this.callbacks.onAuthenticationSuccess?.(message);
    this.callbacks.onStatus?.('authenticated', message);
  }

  /**
   * Gestisce risposta audio chunk
   */
  private handleAudioChunkResponse(response: VoiceWebSocketResponse): void {
    if (!this.isAuthenticated()) {
      console.warn('Ricevuto audio chunk senza autenticazione');
      return;
    }

    if (response.data) {
      this.callbacks.onAudioChunk?.(response.data, response.chunk_index);
    }
  }

  /**
   * Gestisce risposta di errore
   */
  private handleErrorResponse(response: VoiceWebSocketResponse): void {
    if (!response.message) return;

    // Gestione errori specifici di autenticazione
    if (this.authState === WebSocketAuthState.AUTHENTICATING) {
      console.error('❌ Errore autenticazione:', response.message);
      this.authState = WebSocketAuthState.FAILED;
      this.clearAuthTimeout();
      this.callbacks.onAuthenticationFailed?.(response.message);
    } else {
      this.callbacks.onError?.(response.message);
    }
  }

  /**
   * Invia un chunk audio al server
   */
  sendAudioChunk(base64AudioData: string, isFinal: boolean = false): void {
    if (!this.isConnected()) {
      this.callbacks.onError?.('Connessione WebSocket non disponibile');
      return;
    }

    const audioMessage: QueuedMessage = {
      type: 'audio_chunk',
      data: base64AudioData,
      is_final: isFinal
    };

    // Se non autenticato, metti in coda il messaggio
    if (!this.isAuthenticated()) {
      console.log('🔒 Messaggio audio messo in coda (non autenticato)');
      this.messageQueue.push(audioMessage);
      return;
    }

    this.sendMessage(audioMessage);
  }

  /**
   * Invia comandi di controllo (pause, resume, cancel)
   */
  sendControl(action: 'pause' | 'resume' | 'cancel'): void {
    if (!this.isConnected()) {
      this.callbacks.onError?.('Connessione WebSocket non disponibile');
      return;
    }

    const controlMessage: QueuedMessage = {
      type: 'control',
      action: action
    };

    // I comandi di controllo possono essere inviati anche senza autenticazione
    // per permettere di cancellare operazioni in corso
    if (!this.isAuthenticated() && action !== 'cancel') {
      console.log('🔒 Comando di controllo messo in coda (non autenticato)');
      this.messageQueue.push(controlMessage);
      return;
    }

    this.sendMessage(controlMessage);
  }

  /**
   * Controlla se la connessione WebSocket è attiva
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Controlla se l'utente è autenticato
   */
  isAuthenticated(): boolean {
    return this.authState === WebSocketAuthState.AUTHENTICATED;
  }

  /**
   * Ottiene lo stato di autenticazione corrente
   */
  getAuthState(): WebSocketAuthState {
    return this.authState;
  }

  /**
   * Invia un messaggio al WebSocket
   */
  private sendMessage(message: QueuedMessage): void {
    if (!this.isConnected()) return;

    const wsMessage: VoiceWebSocketMessage = {
      type: message.type,
      data: message.data,
      is_final: message.is_final,
      action: message.action
    };

    this.ws!.send(JSON.stringify(wsMessage));
  }

  /**
   * Processa i messaggi in coda dopo l'autenticazione
   */
  private processQueuedMessages(): void {
    if (this.messageQueue.length === 0) return;

    console.log(`📤 Processando ${this.messageQueue.length} messaggi in coda`);

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  /**
   * Pulisce la coda dei messaggi
   */
  private clearMessageQueue(): void {
    if (this.messageQueue.length > 0) {
      console.log(`🗑️ Pulisco ${this.messageQueue.length} messaggi in coda`);
      this.messageQueue = [];
    }
  }

  /**
   * Valida la sicurezza di una risposta WebSocket
   */
  private validateResponse(response: VoiceWebSocketResponse): boolean {
    // Controlli di sicurezza di base
    if (!response || typeof response !== 'object') {
      return false;
    }

    // Verifica che il tipo sia valido
    const validTypes = ['status', 'audio_chunk', 'error'];
    if (!validTypes.includes(response.type)) {
      return false;
    }

    // Verifica lunghezza messaggi per prevenire DoS
    if (response.message && response.message.length > 1000) {
      console.warn('Messaggio troppo lungo ricevuto dal server');
      return false;
    }

    // Verifica chunk audio per prevenire overflow
    if (response.data && response.data.length > 50000) { // ~37KB base64 -> ~25KB audio
      console.warn('Chunk audio troppo grande ricevuto dal server');
      return false;
    }

    return true;
  }

  /**
   * Tentativo di riconnessione automatica
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`🎤 Tentativo riconnessione ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Disconnette il WebSocket
   */
  disconnect(): void {
    // Pulisce timeout e risorse
    this.clearAuthTimeout();
    this.clearMessageQueue();
    this.authState = WebSocketAuthState.DISCONNECTED;

    if (this.ws) {
      this.ws.close(1000, 'Disconnessione volontaria');
      this.ws = null;
    }
  }

  /**
   * Distrugge la connessione e pulisce tutte le risorse
   */
  destroy(): void {
    this.disconnect();
    this.callbacks = {};
    this.reconnectAttempts = 0;
  }

  /**
   * Forza una nuova autenticazione (utile se il token è stato aggiornato)
   */
  async reAuthenticate(): Promise<boolean> {
    if (!this.isConnected()) {
      console.warn('Non è possibile ri-autenticarsi: WebSocket non connesso');
      return false;
    }

    const token = await getValidToken();
    if (!token) {
      this.callbacks.onError?.('Token di autenticazione non disponibile per ri-autenticazione');
      return false;
    }

    console.log('🔄 Avvio ri-autenticazione');
    this.clearMessageQueue(); // Pulisce eventuali messaggi precedenti
    this.startAuthentication(token);
    return true;
  }
}
