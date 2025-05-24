import axios from "axios";
import { getValidToken } from "./authService";

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
      ...(modelType === "base"
      ? {}
      : { previous_messages: formattedPreviousMessages }),
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
 * Crea una nuova chat con un messaggio di benvenuto
 * @returns {Promise<Array>} - Array con i messaggi di benvenuto
 */
export async function createNewChat() {
  // Messaggi di benvenuto predefiniti
  return [];
}
