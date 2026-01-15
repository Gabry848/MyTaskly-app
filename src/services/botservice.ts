import { getValidToken } from "./authService";
import { fetch } from 'expo/fetch';
import { ToolWidget } from '../components/BotChat/types';


/**
 * Callback per gestire chunk di testo in streaming + widget tool
 */
export type StreamingCallback = (
  chunk: string,
  isComplete: boolean,
  toolWidgets?: ToolWidget[]
) => void;

/**
 * Invia un messaggio testuale al bot e riceve una risposta in streaming
 * Utilizza l'endpoint /chat/text per la chat scritta con supporto streaming
 * @param {string} userMessage - Il messaggio dell'utente da inviare al bot
 * @param {string} modelType - Il tipo di modello da utilizzare ('base' o 'advanced')
 * @param {Array} previousMessages - Gli ultimi messaggi scambiati tra utente e bot per il contesto
 * @param {StreamingCallback} onStreamChunk - Callback per ricevere chunk in streaming + widgets (opzionale)
 * @returns {Promise<{text: string, toolWidgets: ToolWidget[]}>} - La risposta completa del bot con widgets
 */
export async function sendMessageToBot(
  userMessage: string,
  modelType: "base" | "advanced" = "base",
  previousMessages: any[] = [],
  onStreamChunk?: StreamingCallback
): Promise<{text: string, toolWidgets: ToolWidget[]}> {
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

    // Mappa per tracciare i widget tool (usa item_index come chiave)
    const toolWidgetsMap = new Map<number, ToolWidget>();
    // Mappa per tracciare tool_name per ogni item_index (workaround per tool_name: "unknown")
    const toolNamesMap = new Map<number, string>();

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

              // EVENTO: tool_call - Crea widget in loading
              if (parsed.type === 'tool_call') {
                // Salva il tool_name per questo item_index
                toolNamesMap.set(parsed.item_index, parsed.tool_name);

                const widgetId = `tool_${parsed.item_index}`;
                const newWidget = {
                  id: widgetId,
                  toolName: parsed.tool_name,
                  status: 'loading' as const,
                  itemIndex: parsed.item_index,
                  toolArgs: parsed.tool_args,
                };
                toolWidgetsMap.set(parsed.item_index, newWidget);

                // Notifica UI del nuovo widget loading
                if (onStreamChunk) {
                  onStreamChunk('', false, Array.from(toolWidgetsMap.values()));
                }
              }

              // EVENTO: tool_output - Aggiorna widget con risultato
              if (parsed.type === 'tool_output') {
                // Usa item_index per trovare il widget (ignora tool_name che può essere "unknown")
                let widget = toolWidgetsMap.get(parsed.item_index);
                let widgetKey = parsed.item_index; // Traccia la chiave corretta del widget

                // WORKAROUND: Se non trova il widget per item_index, cerca per tool_name
                // (il server a volte usa index diversi per tool_call e tool_output)
                if (!widget && parsed.tool_name !== 'unknown') {
                  // Trova widget E la sua chiave originale
                  for (const [key, w] of toolWidgetsMap.entries()) {
                    if (w.toolName === parsed.tool_name && w.status === 'loading') {
                      widget = w;
                      widgetKey = key; // Usa la chiave originale del widget
                      break;
                    }
                  }
                }

                // WORKAROUND 2: Se tool_name è "unknown", cerca l'ultimo widget in loading
                if (!widget && parsed.tool_name === 'unknown') {
                  // Trova l'ultimo widget loading E la sua chiave
                  let lastLoadingKey: number | undefined;
                  for (const [key, w] of toolWidgetsMap.entries()) {
                    if (w.status === 'loading') {
                      widget = w;
                      lastLoadingKey = key;
                    }
                  }
                  if (lastLoadingKey !== undefined) {
                    widgetKey = lastLoadingKey;
                  }
                }

                if (widget) {
                  try {
                    // Parsa l'output JSON del tool
                    let outputData = JSON.parse(parsed.output);

                    // Se l'output è wrappato in {"type":"text","text":"..."}, estrailo
                    if (outputData.type === 'text' && outputData.text) {
                      outputData = JSON.parse(outputData.text);
                    }

                    widget.status = outputData.success !== false ? 'success' : 'error';
                    widget.toolOutput = outputData;
                    widget.errorMessage = outputData.success === false ? outputData.message : undefined;

                    // Usa il tool_name salvato dal tool_call se quello nell'output è "unknown"
                    if (parsed.tool_name === 'unknown' && toolNamesMap.has(widgetKey)) {
                      widget.toolName = toolNamesMap.get(widgetKey)!;
                    }
                  } catch (e: any) {
                    widget.status = 'error';
                    widget.errorMessage = 'Errore parsing output tool';
                    console.error('[BOTSERVICE] Error parsing tool output:', e);
                  }

                  // IMPORTANTE: Aggiorna il widget nella posizione ORIGINALE, non creare un duplicato
                  toolWidgetsMap.set(widgetKey, widget);

                  // Notifica UI dell'aggiornamento widget
                  if (onStreamChunk) {
                    onStreamChunk('', false, Array.from(toolWidgetsMap.values()));
                  }
                } else {
                  console.warn('[BOTSERVICE] Widget not found for index:', parsed.item_index);
                }
              }

              // EVENTO: content - Accumula testo messaggio
              if (parsed.type === 'content' && (parsed.delta || parsed.content)) {
                const textChunk = parsed.delta || parsed.content;
                fullMessage += textChunk;

                // Chiama la callback con testo + widgets attuali
                if (onStreamChunk) {
                  onStreamChunk(textChunk, false, Array.from(toolWidgetsMap.values()));
                }
              }

              // EVENTO: error - Marca widgets loading come error
              if (parsed.type === 'error') {
                console.error('Errore streaming:', parsed.message);

                // Marca tutti i widget loading come error
                toolWidgetsMap.forEach((widget) => {
                  if (widget.status === 'loading') {
                    widget.status = 'error';
                    widget.errorMessage = parsed.message || 'Errore sconosciuto';
                  }
                });

                // Notifica UI dell'errore
                if (onStreamChunk) {
                  onStreamChunk('', false, Array.from(toolWidgetsMap.values()));
                }
              }

              // EVENTO: done - Stream completato
              if (parsed.type === 'done') {
                // Stream completato, non serve loggare
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
      onStreamChunk('', true, Array.from(toolWidgetsMap.values()));
    }

    return {
      text: fullMessage || "Nessuna risposta ricevuta dal bot.",
      toolWidgets: Array.from(toolWidgetsMap.values()),
    };
    
  } catch (error: any) {
    console.error("❌ Errore nella comunicazione con il bot:", error);

    let errorMessage = "Mi dispiace, si è verificato un errore. Riprova più tardi.";

    // Gestisci errori specifici per fetch
    if (error.message?.includes('status: 401')) {
      errorMessage = "Sessione scaduta. Effettua nuovamente il login.";
    } else if (error.message?.includes('status: 429')) {
      errorMessage = "Troppe richieste. Riprova tra qualche secondo.";
    } else if (error.message?.includes('status: 5')) {
      errorMessage = "Il servizio è temporaneamente non disponibile. Riprova più tardi.";
    }

    // Ritorna messaggio di errore con widgets vuoti
    return {
      text: errorMessage,
      toolWidgets: [],
    };
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
  phase?: 'authenticated' | 'receiving_audio' | 'transcription' | 'transcription_complete' | 'ai_processing' | 'ai_complete' | 'tts_generation' | 'tts_complete' | 'audio_streaming' | 'complete';
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

const MAX_AUDIO_CHUNK_BYTES = 2_500_000; // ~2.5MB di audio PCM/mp3

/**
 * Classe per gestire la connessione WebSocket per la chat vocale
 */
export class VoiceBotWebSocket {
  private ws: WebSocket | null = null;
  private callbacks: VoiceChatCallbacks;
  private baseUrl: string = 'wss://taskly-production.up.railway.app';
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

      // Crea una Promise che si risolve quando onopen viene chiamato
      return new Promise((resolve, reject) => {
        this.ws = new WebSocket(wsUrl);

        // Timeout per la connessione (10 secondi)
        const connectionTimeout = setTimeout(() => {
          this.authState = WebSocketAuthState.FAILED;
          this.callbacks.onError?.('Timeout connessione WebSocket');
          reject(new Error('Timeout connessione WebSocket'));
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('🎤 Connessione WebSocket vocale aperta');
          this.reconnectAttempts = 0;

          // Invia autenticazione e avvia timeout
          this.startAuthentication(token);
          this.callbacks.onConnectionOpen?.();
          resolve(true);
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
          clearTimeout(connectionTimeout);
          console.error('Errore WebSocket vocale:', error);
          this.authState = WebSocketAuthState.FAILED;
          this.clearAuthTimeout();
          this.callbacks.onError?.('Errore di connessione WebSocket');
          reject(new Error('Errore di connessione WebSocket'));
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
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

    // Avvia timeout per autenticazione
    this.authTimeout = setTimeout(() => {
      this.handleAuthenticationTimeout();
    }, this.AUTH_TIMEOUT_MS);

    // Assicurati che il token abbia il prefisso "Bearer "
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    const authMessage: VoiceWebSocketMessage = {
      type: 'auth',
      token: formattedToken
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
    // Permetti audio chunks anche durante l'autenticazione
    // Il server potrebbe iniziare a inviare dati prima della conferma ufficiale
    if (this.authState === WebSocketAuthState.DISCONNECTED) {
      console.warn('Ricevuto audio chunk senza connessione');
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
    if (response.data) {
      if (response.type === 'audio_chunk') {
        const approxChunkBytes = Math.floor(response.data.length * 0.75);
        if (approxChunkBytes > MAX_AUDIO_CHUNK_BYTES) {
          console.warn(`Chunk audio molto grande ricevuto dal server (~${approxChunkBytes} bytes)`);
        }
      } else if (response.data.length > 50000) {
        console.warn('Payload dati troppo grande ricevuto dal server');
        return false;
      }
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
