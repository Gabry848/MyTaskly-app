import axios from "./axiosInterceptor";
import { getValidToken } from "./authService";
import { Platform } from "react-native";
import RNBlobUtil from 'react-native-blob-util';
import RNFS from 'react-native-fs';
import { Audio } from 'expo-av';

// Constants per lo streaming
const CHUNK_SIZE = 8192; // 8KB chunks for audio streaming
const AUDIO_BUFFER_SIZE = 4096; // Buffer size for audio playback
const STREAM_TIMEOUT = 30000; // 30 secondi timeout per stream

/**
 * Interfaccia per il controllo dello streaming audio
 */
interface AudioStreamController {
  isStreaming: boolean;
  audioBuffer: ArrayBuffer[];
  currentSound?: Audio.Sound;
  abort: () => void;
}

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

  // togli l'ultimo messaggio perche' e' quello dell'utente che sta scrivendo
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
 * Ottiene i metadati audio dall'URI
 */
function getAudioMetadata(audioUri: string): { mimeType: string; extension: string } {
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
  
  return { mimeType, extension };
}

/**
 * Crea FormData compatibile per l'invio audio
 */
function createCompatibleFormData(audioUri: string, modelType: string) {
  const formData = new FormData();
  
  // Determina l'estensione e il MIME type dall'URI
  const { mimeType, extension } = getAudioMetadata(audioUri);
  
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
}

/**
 * Controller per la gestione dello streaming audio
 */
class AudioStreamManager {
  private controllers: Map<string, AudioStreamController> = new Map();

  /**
   * Avvia lo streaming audio con playback in tempo reale
   */
  async startAudioStream(
    audioUri: string, 
    modelType: "base" | "advanced",
    onChunkReceived?: (chunk: string) => void,
    onAudioReceived?: (audioData: ArrayBuffer) => void
  ): Promise<string> {
    const streamId = `stream_${Date.now()}`;
    
    const controller: AudioStreamController = {
      isStreaming: true,
      audioBuffer: [],
      abort: () => {
        controller.isStreaming = false;
        this.controllers.delete(streamId);
      }
    };
    
    this.controllers.set(streamId, controller);

    try {
      console.log('🎵 Avvio streaming audio avanzato per:', modelType);
      
      // Usa modalità streaming solo per advanced model
      if (modelType === "advanced") {
        return await this.handleAdvancedStreaming(audioUri, controller, onChunkReceived, onAudioReceived);
      } else {
        // Fallback su metodo classico per base model
        return await this.handleBaseUpload(audioUri, modelType);
      }
    } catch (error) {
      console.error('❌ Errore durante lo streaming audio:', error);
      controller.abort();
      throw error;
    }
  }

  /**
   * Gestisce lo streaming avanzato per il modello advanced
   */
  private async handleAdvancedStreaming(
    audioUri: string,
    controller: AudioStreamController,
    onChunkReceived?: (chunk: string) => void,
    onAudioReceived?: (audioData: ArrayBuffer) => void
  ): Promise<string> {
    try {
      // Verifica se il server supporta lo streaming
      const supportsStreaming = await this.checkStreamingSupport();
      
      if (!supportsStreaming) {
        console.log('⚠️ Server non supporta streaming, fallback su upload classico');
        return await this.handleBaseUpload(audioUri, "advanced");
      }

      // Avvia lo streaming upload
      const responseStream = await this.sendAudioStreamToServer(audioUri, "advanced");
      const reader = responseStream.getReader();
      
      let fullResponse = '';
      let audioChunks: ArrayBuffer[] = [];
      
      while (controller.isStreaming) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        // Decodifica il chunk ricevuto
        const textDecoder = new TextDecoder();
        const chunk = textDecoder.decode(value);
        
        // Verifica se è un chunk di testo o audio
        if (chunk.startsWith('data:audio/')) {
          // È un chunk audio - convertilo e riproducilo
          const audioData = this.decodeAudioChunk(chunk);
          if (audioData) {
            audioChunks.push(audioData);
            onAudioReceived?.(audioData);
            
            // Riproduci il chunk audio se abbiamo abbastanza buffer
            if (audioChunks.length >= 3) {
              await this.playAudioChunk(controller, audioChunks.shift()!);
            }
          }
        } else {
          // È un chunk di testo
          fullResponse += chunk;
          onChunkReceived?.(chunk);
        }
      }
      
      // Riproduci eventuali chunk audio rimanenti
      for (const audioChunk of audioChunks) {
        if (controller.isStreaming) {
          await this.playAudioChunk(controller, audioChunk);
        }
      }
      
      return fullResponse || 'Streaming completato con successo';
      
    } catch (error) {
      console.error('❌ Errore nel streaming avanzato:', error);
      // Fallback automatico su upload classico
      return await this.handleBaseUpload(audioUri, "advanced");
    }
  }

  /**
   * Gestisce l'upload base (non streaming)
   */
  private async handleBaseUpload(audioUri: string, modelType: string): Promise<string> {
    console.log('📤 Usando upload classico per modalità base');
    
    // Usa la funzione esistente per compatibility
    const { formData } = createCompatibleFormData(audioUri, modelType);
    const token = await getValidToken();
    
    const response = await axios.post("/chat_bot_voice", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: STREAM_TIMEOUT,
    });
    
    // Gestisci la risposta come nel metodo originale
    if (response.data?.recognized_text) {
      return response.data.recognized_text;
    }
    
    return response.data?.message || response.data?.response || 'Messaggio processato';
  }

  /**
   * Invia audio al server usando streaming upload
   */
  private async sendAudioStreamToServer(audioUri: string, modelType: string): Promise<ReadableStream> {
    const token = await getValidToken();
    if (!token) {
      throw new Error('Token di autenticazione non disponibile');
    }

    console.log('🚀 Avvio streaming upload audio:', audioUri);

    if (Platform.OS === 'web') {
      // Su web, usa l'API fetch con streaming
      const formData = new FormData();
      
      // Leggi il file come blob per lo streaming
      const response = await fetch(audioUri);
      const audioBlob = await response.blob();
      
      formData.append('audio_file', audioBlob, 'voice_message.m4a');
      formData.append('model', modelType);
      formData.append('stream', 'true');

      const streamResponse = await fetch('/chat_bot_voice_stream', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!streamResponse.body) {
        throw new Error('Risposta del server non contiene uno stream');
      }

      return streamResponse.body;
    } else {
      // Su mobile, simula streaming con chunked upload usando RNBlobUtil
      const { mimeType, extension } = getAudioMetadata(audioUri);
      
      return new ReadableStream({
        async start(controller) {
          try {
            const response = await RNBlobUtil.fetch('POST', '/chat_bot_voice_stream', {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            }, [
              {
                name: 'audio_file',
                filename: `voice_message${extension}`,
                type: mimeType,
                data: RNBlobUtil.wrap(audioUri),
              },
              {
                name: 'model',
                data: modelType,
              },
              {
                name: 'stream',
                data: 'true',
              },
            ]);

            // Simula chunks di risposta
            const responseText = await response.text();
            const chunks = responseText.match(/.{1,100}/g) || [responseText];
            
            for (const chunk of chunks) {
              controller.enqueue(new TextEncoder().encode(chunk));
              await new Promise(resolve => setTimeout(resolve, 10)); // Simula delay streaming
            }
            
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });
    }
  }

  /**
   * Controlla se il server supporta lo streaming
   */
  private async checkStreamingSupport(): Promise<boolean> {
    try {
      const token = await getValidToken();
      const response = await axios.get('/capabilities', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      
      return response.data?.supports_audio_streaming === true;
    } catch (error) {
      console.log('⚠️ Impossibile verificare capacità streaming del server, assumo non supportato');
      return false;
    }
  }

  /**
   * Decodifica un chunk audio da base64
   */
  private decodeAudioChunk(chunk: string): ArrayBuffer | null {
    try {
      // Estrai i dati base64 dal chunk
      const base64Match = chunk.match(/data:audio\/[^;]+;base64,(.+)/);
      if (!base64Match) return null;
      
      const base64Data = base64Match[1];
      const binaryString = atob(base64Data);
      const arrayBuffer = new ArrayBuffer(binaryString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }
      
      return arrayBuffer;
    } catch (error) {
      console.error('❌ Errore nella decodifica del chunk audio:', error);
      return null;
    }
  }

  /**
   * Riproduce un chunk audio usando expo-av
   */
  private async playAudioChunk(controller: AudioStreamController, audioData: ArrayBuffer): Promise<void> {
    try {
      // Converti ArrayBuffer in URI temporaneo
      const base64Data = this.arrayBufferToBase64(audioData);
      const audioUri = `data:audio/mp3;base64,${base64Data}`;
      
      // Crea e riproduci il suono
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, volume: 1.0 }
      );
      
      // Salva il riferimento per controllo
      if (controller.currentSound) {
        await controller.currentSound.unloadAsync();
      }
      controller.currentSound = sound;
      
      // Cleanup automatico quando finisce
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
      
    } catch (error) {
      console.error('❌ Errore nella riproduzione del chunk audio:', error);
    }
  }

  /**
   * Converte ArrayBuffer in base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  }

  /**
   * Ferma tutti gli streaming attivi
   */
  stopAllStreams(): void {
    this.controllers.forEach(controller => controller.abort());
    this.controllers.clear();
  }
}

// Istanza globale del manager
const audioStreamManager = new AudioStreamManager();

/**
 * 🚀 NUOVA FUNZIONE OTTIMIZZATA: Invia messaggio vocale con streaming avanzato
 * Riduce la latenza usando streaming upload e playback in tempo reale
 * @param {string} audioUri - L'URI del file audio registrato
 * @param {string} modelType - Il tipo di modello ('base' usa upload classico, 'advanced' usa streaming)
 * @param {Function} onChunkReceived - Callback per chunk di testo ricevuti
 * @param {Function} onAudioReceived - Callback per chunk audio ricevuti
 * @returns {Promise<string>} - La risposta del bot
 */
export async function sendVoiceMessageToBotOptimized(
  audioUri: string,
  modelType: "base" | "advanced" = "base",
  onChunkReceived?: (chunk: string) => void,
  onAudioReceived?: (audioData: ArrayBuffer) => void
): Promise<string> {
  console.log('🚀 MODALITÀ OTTIMIZZATA - Modello:', modelType);
  
  try {
    return await audioStreamManager.startAudioStream(
      audioUri, 
      modelType, 
      onChunkReceived, 
      onAudioReceived
    );
  } catch (error) {
    console.error('❌ Errore nella modalità ottimizzata, fallback su metodo classico:', error);
    
    // Fallback automatico sul metodo originale
    return await sendVoiceMessageToBot(audioUri, modelType);
  }
}

/**
 * Ferma tutti gli streaming audio attivi
 */
export function stopAllAudioStreams(): void {
  audioStreamManager.stopAllStreams();
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
      previous_messages: formattedPreviousMessages,
    };
    console.log("Invio al server:", quest);
    const response = await axios.post("/chat_bot", quest, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Stampa la risposta del server per debug
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
      return "Mi dispiace, sembra che tu non sia autenticato. Effettua il login per continuare.";
    }

    // Usa la utility per creare FormData compatibile
    const { formData, mimeType, extension } = createCompatibleFormData(audioUri, modelType);
    console.log("Invio file audio al server:", { 
      audioUri, 
      modelType, 
      fileType: mimeType, 
      fileName: `voice_message${extension}`,
      platform: Platform.OS 
    });

    console.log(`Modello utilizzato per la richiesta: ${modelType}`);

    const response = await axios.post("/chat_bot_voice", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        // Rimuovo Content-Type perché axios lo gestisce automaticamente per FormData
      },
    });

    // Stampa la risposta del server per debug
    console.log("Risposta audio ricevuta dal server:", response.data);

    // Gestisce la risposta del server (simile a sendMessageToBot)
    if (response.data && typeof response.data === "object") {
      if (response.data.message) {
        const message = response.data.message;
        
        // Controlla se è un errore di configurazione del server
        if (message.includes('❌') || 
            message.includes('Errore durante il riconoscimento vocale') ||
            message.includes('Your default credentials were not found') ||
            message.includes('Application Default Credentials')) {
          
          // Distingui tra errori di configurazione e rate limiting
          if (message.includes('429') || 
              message.includes('rate-limited') || 
              message.includes('Rate limit') ||
              message.includes('temporarily rate-limited')) {
            
            console.warn("Rate limiting rilevato:", message);
            return "Il servizio è temporaneamente sovraccarico. Riprova tra qualche secondo.";
          }
          
          console.error("Errore di configurazione del server:", message);
          return "Il servizio di riconoscimento vocale non è attualmente configurato sul server. Contatta l'amministratore.";
        }
        
        // Se c'è recognized_text o user_message, quello è il messaggio trascritto dell'utente
        const recognizedText = response.data.recognized_text || response.data.user_message;
        if (recognizedText) {
          console.log("Messaggio utente trascritto:", recognizedText);
          console.log("Risposta bot:", message);
          console.log("Confidence:", response.data.confidence);
          return recognizedText; // Restituisce il messaggio trascritto dell'utente
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
      
      // Se non c'è message ma c'è recognized_text o user_message
      const recognizedText = response.data.recognized_text || response.data.user_message;
      if (recognizedText) {
        console.log("Messaggio utente trascritto:", recognizedText);
        return recognizedText;
      }
      
      if (response.data.response) {
        return response.data.response;
      }
    }

    return (
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
    console.log(`Modello utilizzato: ${modelType}`);
    console.log("FormData creato, invio al server...");

    const response = await axios.post("/chat_bot_voice", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        // Lascia che axios gestisca il Content-Type automaticamente
      },
      timeout: 30000,
    });

    console.log("=== RISPOSTA RICEVUTA ===");
    console.log("Status:", response.status);
    console.log("Data:", response.data);
    
    // Gestisci errori di servizio anche se lo status è 200
    if (response.data?.message) {
      const message = response.data.message;
      
      // Controlla se è un errore di configurazione del server o rate limiting
      if (message.includes('❌') || 
          message.includes('Errore durante il riconoscimento vocale') ||
          message.includes('Your default credentials were not found') ||
          message.includes('Application Default Credentials')) {
        
        // Distingui tra errori di configurazione e rate limiting
        if (message.includes('429') || 
            message.includes('rate-limited') || 
            message.includes('Rate limit') ||
            message.includes('temporarily rate-limited')) {
          
          console.warn("Rate limiting rilevato:", message);
          return "Il servizio è temporaneamente sovraccarico. Riprova tra qualche secondo.";
        }
        
        console.error("Errore di configurazione del server:", message);
        return "Il servizio di riconoscimento vocale non è attualmente configurato sul server. Contatta l'amministratore.";
      }
      
      // Se c'è recognized_text o user_message, quello è il messaggio trascritto dell'utente
      const recognizedText = response.data.recognized_text || response.data.user_message;
      if (recognizedText) {
        console.log("Messaggio utente trascritto:", recognizedText);
        console.log("Risposta bot:", message);
        console.log("Confidence:", response.data.confidence);
        return recognizedText; // Restituisce il messaggio trascritto dell'utente
      }
      
      return message;
    }
    
    // Se non c'è message ma c'è recognized_text o user_message
    const recognizedText = response.data?.recognized_text || response.data?.user_message;
    if (recognizedText) {
      console.log("Messaggio utente trascritto:", recognizedText);
      return recognizedText;
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

/**
 * Invia un file audio al bot e restituisce sia il messaggio trascritto che la risposta del bot
 * @param {string} audioUri - L'URI del file audio registrato
 * @param {string} modelType - Il tipo di modello da utilizzare ('base' o 'advanced')
 * @returns {Promise<{userMessage: string, botResponse: string} | null>} - Il messaggio trascritto e la risposta del bot
 */
export async function sendVoiceMessageToBotComplete(
  audioUri: string,
  modelType: "base" | "advanced" = "base"
): Promise<{userMessage: string, botResponse: string} | null> {
  try {
    const token = await getValidToken();
    if (!token) {
      return null;
    }

    // Usa la utility per creare FormData compatibile
    const { formData, mimeType, extension } = createCompatibleFormData(audioUri, modelType);
    console.log("Invio file audio al server per trascrizione completa:", { 
      audioUri, 
      modelType, 
      fileType: mimeType, 
      fileName: `voice_message${extension}`,
      platform: Platform.OS 
    });

    console.log(`Modello utilizzato per la richiesta completa: ${modelType}`);

    const response = await axios.post("/chat_bot_voice", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Risposta completa ricevuta dal server:", response.data);

    // Gestisce la risposta del server
    if (response.data && typeof response.data === "object") {
      // Controlla se è un errore di configurazione del server o rate limiting
      if (response.data.message && (
          response.data.message.includes('❌') || 
          response.data.message.includes('Errore durante il riconoscimento vocale') ||
          response.data.message.includes('Your default credentials were not found') ||
          response.data.message.includes('Application Default Credentials'))) {
        
        // Distingui tra errori di configurazione e rate limiting
        if (response.data.message.includes('429') || 
            response.data.message.includes('rate-limited') || 
            response.data.message.includes('Rate limit') ||
            response.data.message.includes('temporarily rate-limited')) {
          
          console.warn("Rate limiting rilevato:", response.data.message);
          return {
            userMessage: "[Messaggio vocale non processato]",
            botResponse: "Il servizio è temporaneamente sovraccarico. Riprova tra qualche secondo."
          };
        }
        
        console.error("Errore di configurazione del server:", response.data.message);
        return null;
      }

      // Il server restituisce recognized_text (e anche user_message per compatibilità)
      const recognizedText = response.data.recognized_text || response.data.user_message;
      
      // Se abbiamo sia recognized_text che la risposta del bot
      if (recognizedText && response.data.message) {
        console.log("Testo riconosciuto:", recognizedText);
        console.log("Risposta bot:", response.data.message);
        console.log("Confidence:", response.data.confidence);
        
        return {
          userMessage: recognizedText,
          botResponse: response.data.message
        };
      }
      
      // Se abbiamo solo recognized_text (caso raro)
      if (recognizedText) {
        return {
          userMessage: recognizedText,
          botResponse: "Messaggio ricevuto."
        };
      }
    }

    return null;
  } catch (error: any) {
    console.error("Errore nell'invio del messaggio vocale completo:", error);
    return null;
  }
}
