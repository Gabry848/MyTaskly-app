import { getValidToken } from "./authService";
import { fetch } from 'expo/fetch';
import { ToolWidget } from '../components/BotChat/types';


/**
 * Callback per gestire chunk di testo in streaming + widget tool + chat info
 */
export type StreamingCallback = (
  chunk: string,
  isComplete: boolean,
  toolWidgets?: ToolWidget[],
  chatInfo?: { chat_id: string; is_new: boolean }
) => void;

/**
 * Invia un messaggio testuale al bot e riceve una risposta in streaming
 * Utilizza l'endpoint /chat/text per la chat scritta con supporto streaming
 * @param {string} userMessage - Il messaggio dell'utente da inviare al bot
 * @param {string} modelType - Il tipo di modello da utilizzare ('base' o 'advanced')
 * @param {StreamingCallback} onStreamChunk - Callback per ricevere chunk in streaming + widgets (opzionale)
 * @param {string} chatId - Optional chat ID to identify the chat session
 * @returns {Promise<{text: string, toolWidgets: ToolWidget[], chat_id?: string, is_new?: boolean}>} - La risposta completa del bot con widgets e chat info
 */
export async function sendMessageToBot(
  userMessage: string,
  modelType: "base" | "advanced" = "base",
  onStreamChunk?: StreamingCallback,
  chatId?: string
): Promise<{text: string, toolWidgets: ToolWidget[], chat_id?: string, is_new?: boolean}> {
  try {
    // Verifica che l'utente sia autenticato
    const token = await getValidToken();
    if (!token) {
      return "Mi dispiace, sembra che tu non sia autenticato. Effettua il login per continuare.";
    }
    
    // Costruisci il payload per la richiesta
    const requestPayload: any = {
      quest: userMessage,
      model: modelType,
    };

    // Aggiungi chat_id se fornito per salvare i messaggi nella cronologia
    if (chatId) {
      requestPayload.chat_id = chatId;
    }

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
    // Variabili per tracciare chat_id ricevuto dal server
    let receivedChatId: string | undefined;
    let isNewChat: boolean | undefined;

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

              // EVENTO: chat_info - Riceve informazioni sulla chat
              if (parsed.type === 'chat_info') {
                receivedChatId = parsed.chat_id;
                isNewChat = parsed.is_new;
                console.log(`[BOTSERVICE] Chat info ricevuto: chat_id=${receivedChatId}, is_new=${isNewChat}`);

                // Notifica UI del chat_id ricevuto
                if (onStreamChunk) {
                  onStreamChunk('', false, Array.from(toolWidgetsMap.values()), {
                    chat_id: receivedChatId,
                    is_new: isNewChat || false,
                  });
                }
              }

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
      onStreamChunk('', true, Array.from(toolWidgetsMap.values()),
        receivedChatId ? { chat_id: receivedChatId, is_new: isNewChat || false } : undefined
      );
    }

    return {
      text: fullMessage || "Nessuna risposta ricevuta dal bot.",
      toolWidgets: Array.from(toolWidgetsMap.values()),
      chat_id: receivedChatId,
      is_new: isNewChat,
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
 * Crea una nuova sessione chat sul server
 * @param {string} customChatId - Optional custom chat ID
 * @returns {Promise<string>} - Il chat_id della nuova sessione creata
 */
export async function createNewChat(customChatId?: string): Promise<string> {
  try {
    // Importa la funzione createChat dal chatHistoryService
    const { createChat } = await import('./chatHistoryService');

    // Crea la sessione chat sul server
    const chatData = await createChat(customChatId);

    console.log('✅ Nuova chat creata con ID:', chatData.chat_id);
    return chatData.chat_id;
  } catch (error) {
    console.error('❌ Errore durante la creazione della chat:', error);
    throw error;
  }
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
