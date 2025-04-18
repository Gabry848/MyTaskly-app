import axios from 'axios';

// Configura Axios con l'API key di OpenAI
const openaiAPI = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer YOUR_OPENAI_API_KEY`, // Sostituire con la tua API key
  },
});

/**
 * Invia un messaggio all'API di ChatGPT e ottiene una risposta
 * @param {Array} messages - Array di messaggi nel formato richiesto da OpenAI
 * @returns {Promise<string>} - La risposta del bot
 */
export const sendMessageToChatGPT = async (messages) => {
  try {
    const response = await openaiAPI.post('/chat/completions', {
      model: 'gpt-3.5-turbo', // Puoi cambiare con 'gpt-4' se preferisci
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Errore nella chiamata API a ChatGPT:', error);
    throw new Error('Impossibile ottenere una risposta dal bot: ' + error.message);
  }
};

/**
 * Converte un file audio in testo usando l'API Whisper di OpenAI
 * @param {string} audioUri - URI del file audio registrato
 * @returns {Promise<string>} - Il testo trascritto
 */
export const transcribeAudio = async (audioUri) => {
  try {
    // Crea un oggetto FormData per inviare il file audio
    const formData = new FormData();
    
    // Aggiungi il file audio al FormData
    const audioFile = {
      uri: audioUri,
      type: 'audio/m4a', // Il formato potrebbe variare in base al dispositivo
      name: 'audio.m4a',
    };
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    formData.append('language', 'it'); // Per l'italiano

    // Invia la richiesta a Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer YOUR_OPENAI_API_KEY`, // Usa la stessa API key
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const data = await response.json();
    
    if (data.text) {
      return data.text;
    } else {
      throw new Error('Nessun testo riconosciuto');
    }
  } catch (error) {
    console.error('Errore nella trascrizione audio:', error);
    throw new Error("Impossibile trascrivere l'audio: " + error.message);
  }
};