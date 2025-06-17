import axios from "./axiosInterceptor";
import { getValidToken } from "./authService";
import { Platform } from "react-native";

/**
 * Prepara gli ultimi 5 messaggi per l'invio al server, limitando la lunghezza totale.
 * @param {Array} messages - I messaggi della chat
 * @param {number} maxMessages - Numero massimo di messaggi da includere
 * @param {number} maxTotalLength - Lunghezza massima totale consentita in caratteri
 * @returns {Array} - I messaggi formattati per l'invio
 */
function preparePreviousMessages(
  messages: Array<any>,
  maxMessages: number = 5,
  maxTotalLength: number = 1000
): Array<{ content: string; role: string }> {
  if (!messages || messages.length === 0) return [];

  // togli l`ultimo messaggio perche` ed` quello dell`utente che sta scrivendo
  messages = messages.slice(0, -1);
  // Prendiamo solo gli ultimi N messaggi
  const recentMessages = messages.slice(-maxMessages);

  // Formatta i messaggi nel formato richiesto dal server e calcola la lunghezza totale
  const formattedMessages = recentMessages.map((msg) => ({
    content: msg.text,
    role: msg.sender,
  }));

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
 * Invia un messaggio al bot e riceve una risposta
 * @param {string} userMessage - Il messaggio dell'utente da inviare al bot
 * @param {string} modelType - Il tipo di modello da utilizzare ('base' o 'advanced')
 * @param {Array} previousMessages - Gli ultimi messaggi scambiati tra utente e bot
 * @returns {Promise<string>} - La risposta del bot
 */
export async function sendMessageToBot(
  userMessage: string,
  modelType: "base" | "advanced" = "base",
  previousMessages: Array<any> = []
): Promise<string> {
  try {
    const token = await getValidToken();
    if (!token) {
      return "Mi dispiace, sembra che tu non sia autenticato. Effettua il login per continuare.";
    }

    // Prepara i messaggi precedenti - limitati a non più di 1000 caratteri totali
    const formattedPreviousMessages = preparePreviousMessages(previousMessages);
    const quest = {
      quest: userMessage,
      model: modelType,
      previous_messages: formattedPreviousMessages ,
    };
    console.log("Invio al server:", quest);
    const response = await axios.post("/chat_bot", quest, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });    // Stampa la risposta del server per debug
    console.log("Risposta ricevuta dal server:", response.data);

    // Controlla il formato della risposta e estrai il valore corretto
    if (response.data && typeof response.data === "object") {
      // Se la risposta contiene message e mode
      if (response.data.message && response.data.mode) {
        if (response.data.mode === "normal") {
          // Per modalità normal, restituisce solo il messaggio
          return response.data.message;
        } else if (response.data.mode === "view") {
          // Per modalità view, restituisce l'intero oggetto come stringa JSON 
          // che verrà poi gestito nel componente Message per visualizzare TaskTableBubble
          return JSON.stringify(response.data);
        }
      }
      // Se la risposta è un oggetto con chiave 'response'
      if (response.data.response) {
        return response.data.response;
      }
    }

    // Se la risposta è già una stringa, restituiscila direttamente
    return (
      response.data || "Non ho capito la tua richiesta. Potresti riprovare?"
    );
  } catch (error) {
    console.error("Errore nella comunicazione con il bot:", error);
    return "Mi dispiace, si è verificato un errore. Riprova più tardi.";
  }
}

/**
 * Invia un file audio al bot per la trascrizione e l'elaborazione
 * @param {string} audioUri - L'URI del file audio registrato
 * @param {string} modelType - Il tipo di modello da utilizzare ('base' o 'advanced')
 * @returns {Promise<string>} - La risposta del bot alla trascrizione
 */
export async function sendVoiceMessageToBot(
  audioUri: string,
  modelType: "base" | "advanced" = "base"
): Promise<string> {
  try {
    const token = await getValidToken();
    if (!token) {
      return "Mi dispiace, sembra che tu non sia autenticato. Effettua il login per continuare.";    }

    // Usa la utility per creare FormData compatibile
    const { formData, mimeType, extension } = createCompatibleFormData(audioUri, modelType);
    
    console.log("Invio file audio al server:", { 
      audioUri, 
      modelType, 
      fileType: mimeType, 
      fileName: `voice_message${extension}`,
      platform: Platform.OS 
    });

    const response = await axios.post("/chat_bot_voice", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        // Rimuovo Content-Type perché axios lo gestisce automaticamente per FormData
      },
    });

    // Stampa la risposta del server per debug
    console.log("Risposta audio ricevuta dal server:", response.data);    // Gestisce la risposta del server (simile a sendMessageToBot)
    if (response.data && typeof response.data === "object") {
      if (response.data.message) {
        const message = response.data.message;
        
        // Controlla se è un errore di configurazione del server
        if (message.includes('❌') || 
            message.includes('Errore durante il riconoscimento vocale') ||
            message.includes('Your default credentials were not found') ||
            message.includes('Application Default Credentials')) {
          
          console.error("Errore di configurazione del server:", message);
          return "Il servizio di riconoscimento vocale non è attualmente configurato sul server. Contatta l'amministratore.";
        }
        
        if (response.data.mode) {
          if (response.data.mode === "normal") {
            return message;
          } else if (response.data.mode === "view") {
            return JSON.stringify(response.data);
          }
        }
        return message;
      }
      if (response.data.response) {
        return response.data.response;
      }
    }return (
      response.data || "Non sono riuscito a processare il messaggio vocale. Riprova più tardi."
    );
  } catch (error: any) {
    console.error("Errore nell'invio del messaggio vocale:", error);
    
    // Logga dettagli specifici per errore 400
    if (error.response?.status === 400) {
      console.error("Dettagli errore 400:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      });
      
      // Se il server fornisce un messaggio di errore specifico, usalo
      if (error.response.data?.message) {
        return `Errore del server: ${error.response.data.message}`;
      } else if (error.response.data?.detail) {
        return `Errore del server: ${error.response.data.detail}`;
      } else {
        return `Errore 400: Richiesta non valida. Controlla il formato del file audio.`;
      }
    }
    
    return "Mi dispiace, si è verificato un errore nell'elaborazione del messaggio vocale. Riprova più tardi.";
  }
}

/**
 * Versione alternativa per debug dell'invio file audio
 * Prova diversi formati se il primo fallisce
 */
export async function sendVoiceMessageToBotDebug(
  audioUri: string,
  modelType: "base" | "advanced" = "base"
): Promise<string> {
  const token = await getValidToken();
  if (!token) {
    return "Mi dispiace, sembra che tu non sia autenticato. Effettua il login per continuare.";
  }

  console.log("=== DEBUG AUDIO FILE ===");
  console.log("Audio URI:", audioUri);
  
  // Verifica che l'URI sia valido
  if (!audioUri || audioUri.trim() === '') {
    console.error("URI del file audio è vuoto o non valido");
    return "Errore: file audio non valido";
  }
  try {
    console.log("=== CREAZIONE FORMDATA ===");
    
    const { formData, mimeType, extension } = createCompatibleFormData(audioUri, modelType);
    
    console.log(`File info - MIME: ${mimeType}, Estensione: ${extension}`);
    console.log(`Platform: ${Platform.OS}`);
    console.log("FormData creato, invio al server...");

    const response = await axios.post("/chat_bot_voice", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        // Lascia che axios gestisca il Content-Type automaticamente
      },
      timeout: 30000,
    });    console.log("=== RISPOSTA RICEVUTA ===");
    console.log("Status:", response.status);
    console.log("Data:", response.data);
    
    // Gestisci errori di servizio anche se lo status è 200
    if (response.data?.message) {
      const message = response.data.message;
      
      // Controlla se è un errore di configurazione del server
      if (message.includes('❌') || 
          message.includes('Errore durante il riconoscimento vocale') ||
          message.includes('Your default credentials were not found') ||
          message.includes('Application Default Credentials')) {
        
        console.error("Errore di configurazione del server:", message);
        return "Il servizio di riconoscimento vocale non è attualmente configurato sul server. Contatta l'amministratore.";
      }
      
      return message;
    }
    
    return response.data?.response || response.data || "Messaggio processato con successo";
    
  } catch (error: any) {
    console.error("=== ERRORE DETTAGLIATO ===");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("Headers response:", error.response?.headers);
    console.error("Headers request:", error.config?.headers);
    console.error("Error completo:", error);
    
    if (error.response?.data?.detail) {
      return `Errore del server: ${error.response.data.detail}`;
    }
    
    return "Impossibile processare il file audio. Verifica che la registrazione sia andata a buon fine.";
  }
}

/**
 * Crea una nuova chat con un messaggio di benvenuto
 * @returns {Promise<Array>} - Array con i messaggi di benvenuto
 */
export async function createNewChat() {
  // Messaggi di benvenuto predefiniti
  return [];
}

// Aggiungi una utility per creare FormData compatibile
const createCompatibleFormData = (audioUri: string, modelType: string) => {
  const formData = new FormData();
  
  // Determina l'estensione e il MIME type dall'URI
  let extension = '.m4a';
  let mimeType = 'audio/m4a';
  
  if (audioUri.includes('.webm')) {
    extension = '.webm';
    mimeType = 'audio/webm';
  } else if (audioUri.includes('.wav')) {
    extension = '.wav';
    mimeType = 'audio/wav';
  } else if (audioUri.includes('.mp3')) {
    extension = '.mp3';
    mimeType = 'audio/mp3';
  }
  
  // Per React Native, usa il formato specifico
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    // Su mobile, React Native gestisce automaticamente i file con questo formato
    formData.append('audio_file', {
      uri: audioUri,
      type: mimeType,
      name: `voice_message${extension}`,
    } as any);
  } else {
    // Su web, potrebbe essere necessario un approccio diverso
    // Ma per ora manteniamo lo stesso formato
    formData.append('audio_file', {
      uri: audioUri,
      type: mimeType,
      name: `voice_message${extension}`,
    } as any);
  }
  
  formData.append('model', modelType);
  
  return { formData, mimeType, extension };
};
