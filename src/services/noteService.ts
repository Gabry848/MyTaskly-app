import axios from "./axiosInterceptor";
import { getValidToken } from "./authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/authConstants";

// Interfaccia per i dati restituiti dal server
interface ServerNote {
  note_id: string | number; // Il server può restituire sia string che number
  title: string;
  position_x: number;
  position_y: number;
  color?: string;
  user?: string;
  [key: string]: any;
}

// Definizione dell'interfaccia Note utilizzata nell'app
export interface Note {
  id: string;
  text: string;
  position: {
    x: number;
    y: number;
  };
  color: string;
  zIndex: number; // manteniamo zIndex nell'app ma non lo inviamo al server
  user?: string;
  [key: string]: any;
}

// Funzione per convertire dal formato del server al formato interno dell'app
const mapServerNoteToClientNote = (serverNote: ServerNote): Note => {
  console.log(`[DEBUG] mapServerNoteToClientNote: Converting server note:`, serverNote);
  console.log(`[DEBUG] mapServerNoteToClientNote: Server title: "${serverNote.title}"`);
  
  // Validazione dei dati del server
  if (!serverNote || typeof serverNote !== 'object') {
    console.error('[DEBUG] mapServerNoteToClientNote: Invalid server note object:', serverNote);
    throw new Error('Invalid server note object');
  }
    if (!serverNote.note_id) {
    console.error('[DEBUG] mapServerNoteToClientNote: Missing note_id:', serverNote.note_id);
    throw new Error('Missing note_id from server');
  }
  
  // Converti note_id in stringa (il server potrebbe inviare un numero)
  const noteId = String(serverNote.note_id);
  if (!noteId || noteId === 'undefined' || noteId === 'null') {
    console.error('[DEBUG] mapServerNoteToClientNote: Invalid note_id after conversion:', noteId);
    throw new Error('Invalid note_id from server');
  }
  
  // Assicurati che il title sia sempre una stringa
  const noteText = typeof serverNote.title === 'string' ? serverNote.title : '';
  if (noteText === '' && serverNote.title !== '') {
    console.warn('[DEBUG] mapServerNoteToClientNote: Non-string title converted to empty string:', serverNote.title);
  }
  const result = {
    id: noteId,
    text: noteText,
    position: {
      x: Number(serverNote.position_x) || 0,
      y: Number(serverNote.position_y) || 0
    },
    color: serverNote.color || '#FFCDD2', // Colore predefinito se non fornito
    zIndex: 1 // Valore predefinito
  };
  
  // Validazione finale del risultato
  if (!isFinite(result.position.x) || !isFinite(result.position.y)) {
    console.error('[DEBUG] mapServerNoteToClientNote: Invalid position after conversion:', result.position);
    result.position.x = 0;
    result.position.y = 0;
  }
  
  console.log(`[DEBUG] mapServerNoteToClientNote: Mapped result text: "${result.text}"`);
  return result;
};

// Funzione per convertire dal formato interno dell'app al formato del server
const mapClientNoteToServerNote = (clientNote: Note): Partial<ServerNote> => {
  return {
    note_id: clientNote.id,
    title: clientNote.text,
    position_x: clientNote.position.x,
    position_y: clientNote.position.y,
    color: clientNote.color
    // zIndex non viene inviato al server
  };
};

// Funzione per ottenere tutte le note dell'utente
export async function getNotes(): Promise<Note[]> {
  try {
    const token = await getValidToken();
    if (!token) {
      return [];
    }

    const response = await axios.get(`/notes`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    
    // Mappiamo le note dal formato del server al formato dell'app
    const serverNotes = response.data as ServerNote[];
    
    // Valida che la risposta sia un array
    if (!Array.isArray(serverNotes)) {
      console.error('[DEBUG] getNotes: Server response is not an array:', serverNotes);
      return [];
    }
      // Mappa e filtra le note valide
    const mappedNotes: Note[] = [];
    for (const serverNote of serverNotes) {
      try {
        const clientNote = mapServerNoteToClientNote(serverNote);
        
        // Validazione aggiuntiva per assicurarsi che la nota sia valida prima di aggiungerla
        if (clientNote && 
            typeof clientNote === 'object' && 
            typeof clientNote.id === 'string' && 
            clientNote.id.length > 0 &&
            typeof clientNote.text === 'string' &&
            clientNote.position &&
            typeof clientNote.position.x === 'number' &&
            typeof clientNote.position.y === 'number' &&
            isFinite(clientNote.position.x) &&
            isFinite(clientNote.position.y)) {
          mappedNotes.push(clientNote);
        } else {
          console.error('[DEBUG] getNotes: Invalid mapped note, skipping:', clientNote);
        }
      } catch (error) {
        console.error('[DEBUG] getNotes: Failed to map server note:', serverNote, error);
        // Continua con le altre note invece di fallire completamente
      }
    }
    
    console.log(`[DEBUG] getNotes: Successfully mapped ${mappedNotes.length} out of ${serverNotes.length} notes`);
    return mappedNotes;
  } catch (error) {
    console.error("Errore nel recupero delle note:", error);
    return [];
  }
}

// Funzione per aggiungere una nuova nota
export async function addNote(note: Note): Promise<Note | null> {
  try {
    const token = await getValidToken();
    if (!token) {
      return null;
    }
    const username = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
    
    // Convertiamo la nota nel formato atteso dal server
    const serverNote = {
      title: note.text,
      position_x: Math.round(note.position.x).toString(),
      position_y: Math.round(note.position.y).toString(),
    };
    console.log("serverNote", serverNote);

    const response = await axios.post("/notes", serverNote, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    
    // Convertiamo la risposta dal server al formato dell'app
    return mapServerNoteToClientNote(response.data);
  } catch (error) {
    console.error("Errore nella creazione della nota:", error);
    throw error;
  }
}

// Funzione per aggiornare una nota esistente
export async function updateNote(noteId: string, updatedNote: Partial<Note>): Promise<Note | null> {
  try {
    console.log(`[DEBUG] noteService.updateNote: Updating note ${noteId} with data:`, updatedNote);
    
    const token = await getValidToken();
    if (!token) {
      return null;
    }

    // Prepara i dati per l'aggiornamento nel formato atteso dal server
    const noteData: Partial<ServerNote> = {};
    
    if (updatedNote.text !== undefined) {
      noteData.title = updatedNote.text;
      console.log(`[DEBUG] noteService.updateNote: Setting title to: "${noteData.title}"`);
    }
    
    if (updatedNote.position !== undefined) {
      noteData.position_x = updatedNote.position.x;
      noteData.position_y = updatedNote.position.y;
    }
    
    if (updatedNote.color !== undefined) {
      noteData.color = updatedNote.color;
    }    
    // Non inviamo zIndex al server

    console.log(`[DEBUG] noteService.updateNote: Sending to server:`, noteData);
    const response = await axios.put(`/notes/${noteId}`, noteData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    
    console.log(`[DEBUG] noteService.updateNote: Server response:`, response.data);
    // Convertiamo la risposta nel formato dell'app
    const result = mapServerNoteToClientNote(response.data);
    console.log(`[DEBUG] noteService.updateNote: Mapped result:`, result);
    return result;
  } catch (error) {
    console.error("Errore nell'aggiornamento della notafdsfsfs:", error);
    throw error;
  }
}

// Funzione per eliminare una nota
export async function deleteNote(noteId: string) {
  try {
    console.log(`[DEBUG] deleteNote called for noteId: ${noteId}`);
    
    if (!noteId || noteId.trim() === '') {
      throw new Error('Invalid note ID provided for deletion');
    }
    
    const token = await getValidToken();
    if (!token) {
      console.error('[DEBUG] No valid token available for note deletion');
      throw new Error('Authentication token not available');
    }
    
    console.log(`[DEBUG] Making DELETE request to /notes/${noteId}`);
    const response = await axios.delete(`/notes/${noteId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    
    console.log(`[DEBUG] Delete response status: ${response.status}`);
    console.log(`[DEBUG] Delete response data:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[DEBUG] Errore nell'eliminazione della nota ${noteId}:`, error);
    if (error.response) {
      console.error(`[DEBUG] Response status: ${error.response.status}`);
      console.error(`[DEBUG] Response data:`, error.response.data);
    }
    throw error;
  }
}

// Funzione per aggiornare la posizione di una nota
export async function updateNotePosition(noteId: string, position: { x: number, y: number }) {
  try {
    console.log(`[DEBUG] updateNotePosition called for note ${noteId}:`, position);
    
    if (!noteId || noteId.trim() === '') {
      throw new Error('Invalid note ID provided');
    }
    
    if (typeof position.x !== 'number' || typeof position.y !== 'number' || 
        !isFinite(position.x) || !isFinite(position.y)) {
      throw new Error('Invalid position coordinates');
    }
    
    const token = await getValidToken();
    if (!token) {
      throw new Error('Authentication token not available');
    }
    
    // Adattiamo al formato atteso dal server
    const data = { 
      position_x: Math.round(position.x).toString(),
      position_y: Math.round(position.y).toString()
    };
    
    console.log(`[DEBUG] Sending position data to server:`, data);
    
    const response = await axios.put(`/notes/${noteId}/position`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    
    console.log(`[DEBUG] Position update response:`, response.status);
    return response.data;
  } catch (error) {
    console.error(`[DEBUG] Errore nell'aggiornamento della posizione della nota ${noteId}:`, error);
    throw error;
  }
}