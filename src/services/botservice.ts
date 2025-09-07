import { getValidToken } from "./authService";
import { fetch } from 'expo/fetch';


/**
 * Invia un messaggio testuale al bot e riceve una risposta in streaming
 * Utilizza l'endpoint /chat/text per la chat scritta con supporto streaming
 * @param {string} userMessage - Il messaggio dell'utente da inviare al bot
 * @param {string} modelType - Il tipo di modello da utilizzare ('base' o 'advanced')
 * @param {Array} previousMessages - Gli ultimi messaggi scambiati tra utente e bot per il contesto
 * @returns {Promise<string>} - La risposta completa del bot
 */
export async function sendMessageToBot(
  userMessage: string,
  modelType: "base" | "advanced" = "base",
  previousMessages: any[] = []
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
 * @returns {string} - Il messaggio formattato
 */
export function formatMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return "";
  }
  
  return message.trim();
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
  phase?: 'transcription' | 'ai_processing' | 'tts_generation' | 'audio_streaming';
  message?: string;
  data?: string; // base64 audio data
  chunk_index?: number;
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
}

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
        this.callbacks.onError?.('Token di autenticazione non disponibile');
        return false;
      }

      const wsUrl = `${this.baseUrl}/chat/voice-bot-websocket`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('🎤 Connessione WebSocket vocale aperta');
        this.reconnectAttempts = 0;
        
        // Invia autenticazione immediatamente
        this.authenticate(token);
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
        this.callbacks.onError?.('Errore di connessione WebSocket');
      };

      this.ws.onclose = (event) => {
        console.log('🎤 Connessione WebSocket vocale chiusa:', event.code, event.reason);
        this.callbacks.onConnectionClose?.();
        
        // Tentativo di riconnessione automatica
        if (this.reconnectAttempts < this.maxReconnectAttempts && event.code !== 1000) {
          this.attemptReconnect();
        }
      };

      return true;
    } catch (error) {
      console.error('Errore connessione WebSocket vocale:', error);
      this.callbacks.onError?.('Impossibile connettersi al servizio vocale');
      return false;
    }
  }

  /**
   * Autentica la connessione WebSocket
   */
  private authenticate(token: string): void {
    if (!this.isConnected()) return;

    const authMessage: VoiceWebSocketMessage = {
      type: 'auth',
      token: token
    };

    this.ws!.send(JSON.stringify(authMessage));
  }

  /**
   * Gestisce le risposte ricevute dal WebSocket
   */
  private handleResponse(response: VoiceWebSocketResponse): void {
    switch (response.type) {
      case 'status':
        if (response.phase && response.message) {
          this.callbacks.onStatus?.(response.phase, response.message);
        }
        break;

      case 'audio_chunk':
        if (response.data) {
          this.callbacks.onAudioChunk?.(response.data, response.chunk_index);
        }
        break;

      case 'error':
        if (response.message) {
          this.callbacks.onError?.(response.message);
        }
        break;

      default:
        console.warn('Tipo di risposta WebSocket sconosciuto:', response.type);
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

    const audioMessage: VoiceWebSocketMessage = {
      type: 'audio_chunk',
      data: base64AudioData,
      is_final: isFinal
    };

    this.ws!.send(JSON.stringify(audioMessage));
  }

  /**
   * Invia comandi di controllo (pause, resume, cancel)
   */
  sendControl(action: 'pause' | 'resume' | 'cancel'): void {
    if (!this.isConnected()) {
      this.callbacks.onError?.('Connessione WebSocket non disponibile');
      return;
    }

    const controlMessage: VoiceWebSocketMessage = {
      type: 'control',
      action: action
    };

    this.ws!.send(JSON.stringify(controlMessage));
  }

  /**
   * Controlla se la connessione WebSocket è attiva
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
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
    if (this.ws) {
      this.ws.close(1000, 'Disconnessione volontaria');
      this.ws = null;
    }
  }

  /**
   * Distrugge la connessione e pulisce le risorse
   */
  destroy(): void {
    this.disconnect();
    this.callbacks = {};
  }
}
