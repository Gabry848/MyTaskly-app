import axios from "axios";
import { getValidToken } from "./authService";

/**
 * Invia un messaggio al bot e riceve una risposta
 * @param {string} userMessage - Il messaggio dell'utente da inviare al bot
 * @param {string} modelType - Il tipo di modello da utilizzare ('base' o 'advanced')
 * @returns {Promise<string>} - La risposta del bot
 */
export async function sendMessageToBot(
  userMessage: string, 
  modelType: 'base' | 'advanced' = 'base'
): Promise<string> {
  try {
    const token = await getValidToken();
    if (!token) {
      return 'Mi dispiace, sembra che tu non sia autenticato. Effettua il login per continuare.';
    }
    
    const response = await axios.post('/chat_bot',
      { 
        quest: userMessage,
        model_type: modelType // Aggiunto parametro per il tipo di modello
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    // Stampa la risposta del server per debug
    console.log('Risposta ricevuta dal server:', response.data);
    
    // Controlla il formato della risposta e estrai il valore corretto
    if (response.data && typeof response.data === 'object') {
      // Se la risposta è un oggetto con chiave 'response'
      if (response.data.response) {
        return response.data.response;
      }
    }
    
    // Se la risposta è già una stringa, restituiscila direttamente
    return response.data || 'Non ho capito la tua richiesta. Potresti riprovare?';
  } catch (error) {
    console.error('Errore nella comunicazione con il bot:', error);
    return 'Mi dispiace, si è verificato un errore. Riprova più tardi.';
  }
}

/**
 * Crea una nuova chat con un messaggio di benvenuto
 * @returns {Promise<Array>} - Array con i messaggi di benvenuto
 */
export async function createNewChat() {
  // Messaggi di benvenuto predefiniti
  return [
    {
      id: Math.random().toString(),
      text: 'Benvenuto in Taskly!',
      sender: 'bot' as 'bot',
      createdAt: new Date(),
    },
    {
      id: Math.random().toString(),
      text: 'Sono il tuo assistente personale per la gestione delle attività.',
      sender: 'bot' as 'bot',
      createdAt: new Date(),
    },
    {
      id: Math.random().toString(),
      text: 'Come posso aiutarti oggi?',
      sender: 'bot' as 'bot',
      createdAt: new Date(),
    },
  ];
}