import axios from "./axiosInterceptor";
import { getValidToken } from "./authService";
import { fetch } from 'expo/fetch';

/**
 * Service per la gestione della comunicazione con il bot
 * Gestisce solo messaggi testuali - le funzionalità vocali sono state rimosse
 */

// Costanti per la configurazione del servizio
const MESSAGE_MAX_LENGTH = 1000; // Lunghezza massima totale dei messaggi precedenti
const MAX_PREVIOUS_MESSAGES = 5; // Numero massimo di messaggi precedenti da includere nel contesto

/**
 * Prepara gli ultimi messaggi per l'invio al server, limitando la lunghezza totale
 * @param {Array} messages - I messaggi della chat
 * @param {number} maxMessages - Numero massimo di messaggi da includere (default: 5)
 * @param {number} maxTotalLength - Lunghezza massima totale consentita in caratteri (default: 1000)
 * @returns {Array} - I messaggi formattati per l'invio al server
 */
function preparePreviousMessages(
  messages: Array<any>,
  maxMessages: number = MAX_PREVIOUS_MESSAGES,
  maxTotalLength: number = MESSAGE_MAX_LENGTH
): Array<{ content: string; role: string }> {
  // Verifica input
  if (!messages || messages.length === 0) return [];

  // Rimuovi l'ultimo messaggio perché è quello dell'utente che sta scrivendo
  const messagesWithoutLast = messages.slice(0, -1);
  
  // Prendi solo gli ultimi N messaggi
  const recentMessages = messagesWithoutLast.slice(-maxMessages);

  // Formatta i messaggi nel formato richiesto dal server
  const formattedMessages = recentMessages.map((msg) => {
    const content = msg.text || msg.content || "";
    // Aggiungi indicatore per messaggi già processati per evitare riesecuzioni
    const processedContent = msg.role === "user" || msg.sender === "user" 
      ? `${content} (già fatto)` 
      : content;
    
    return {
      content: processedContent,
      role: msg.sender || msg.role || "user",
    };
  });

  // Calcola la lunghezza totale di tutti i messaggi
  let totalLength = 0;
  formattedMessages.forEach((msg) => {
    totalLength += msg.content.length;
  });

  // Se la lunghezza supera il massimo, riduci ulteriormente i messaggi
  if (totalLength > maxTotalLength) {
    return formattedMessages.slice(-Math.floor(maxMessages / 2));
  }

  return formattedMessages;
}

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
  previousMessages: Array<any> = []
): Promise<string> {
  try {
    // Verifica che l'utente sia autenticato
    const token = await getValidToken();
    if (!token) {
      return "Mi dispiace, sembra che tu non sia autenticato. Effettua il login per continuare.";
    }

    // Prepara i messaggi precedenti per fornire contesto al bot
    const formattedPreviousMessages = preparePreviousMessages(previousMessages);
    
    // Costruisci il payload per la richiesta
    const requestPayload = {
      quest: userMessage,
      model: modelType,
      previous_messages: formattedPreviousMessages,
    };
    
    console.log("📤 Invio messaggio al bot:", requestPayload);

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

    console.log("📥 Stream iniziato dal server");

    // Processa la risposta in streaming usando ReadableStream con expo/fetch
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullMessage = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log("\n--- Stream completato ---");
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
              } else if (parsed.type === 'stream_start') {
                console.log('--- Stream iniziato ---');
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
export async function createNewChat(): Promise<Array<any>> {
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

/**
 * Invia un messaggio vocale al bot e riceve una risposta
 * @param {string} audioBase64 - L'audio codificato in base64
 * @param {string} modelType - Il tipo di modello da utilizzare ('base' o 'advanced')
 * @param {Array} previousMessages - Gli ultimi messaggi scambiati tra utente e bot per il contesto
 * @returns {Promise<string>} - La risposta del bot
 */
export async function sendVoiceMessageToBot(
  audioBase64: string,
  modelType: "base" | "advanced" = "base",
  previousMessages: Array<any> = []
): Promise<string> {
  try {
    // Verifica che l'utente sia autenticato
    const token = await getValidToken();
    if (!token) {
      return "Mi dispiace, sembra che tu non sia autenticato. Effettua il login per continuare.";
    }

    // Prepara i messaggi precedenti per fornire contesto al bot
    const formattedPreviousMessages = preparePreviousMessages(previousMessages);
    
    // Costruisci il payload per la richiesta vocale
    const requestPayload = {
      audio: audioBase64,
      model: modelType,
      previous_messages: formattedPreviousMessages,
    };
    
    console.log("🎤 Invio messaggio vocale al bot");

    // Invia la richiesta al server per la chat vocale
    const response = await axios.post("/chat/bot_voice", requestPayload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("📥 Risposta vocale ricevuta dal server:", response.data);

    // Elabora la risposta del server (stesso formato della chat testuale)
    if (response.data && typeof response.data === "object") {
      // Gestisci risposte con modalità speciali (normal/view)
      if (response.data.message && response.data.mode) {
        if (response.data.mode === "normal") {
          return response.data.message;
        } else if (response.data.mode === "view") {
          return JSON.stringify(response.data);
        }
      }
      
      if (response.data.response) {
        return response.data.response;
      }
      
      if (response.data.message) {
        return response.data.message;
      }
    }

    return (
      response.data || "Non ho capito la tua richiesta vocale. Potresti riprovare?"
    );
    
  } catch (error: any) {
    console.error("❌ Errore nella comunicazione vocale con il bot:", error);
    
    // Gestisci errori specifici
    if (error.response?.status === 401) {
      return "Sessione scaduta. Effettua nuovamente il login.";
    }
    
    if (error.response?.status === 429) {
      return "Troppe richieste. Riprova tra qualche secondo.";
    }
    
    if (error.response?.status >= 500) {
      return "Il servizio vocale è temporaneamente non disponibile. Riprova più tardi.";
    }
    
    return "Mi dispiace, si è verificato un errore con il messaggio vocale. Riprova più tardi.";
  }
}
