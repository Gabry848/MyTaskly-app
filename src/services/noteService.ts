import axios from "axios";
import { getValidToken } from "./authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/authConstants";

// Interfaccia per i dati restituiti dal server
interface ServerNote {
  note_id: string;
  title: string;
  position_x: number;
  position_y: number;
  color?: string;
  zIndex?: number;
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
  zIndex: number;
  user?: string;
  [key: string]: any; // per proprietà aggiuntive
}

// Funzione per convertire dal formato del server al formato interno dell'app
const mapServerNoteToClientNote = (serverNote: ServerNote): Note => {
  return {
    id: serverNote.note_id,
    text: serverNote.title,
    position: {
      x: serverNote.position_x,
      y: serverNote.position_y
    },
    color: serverNote.color || '#FFCDD2', // Colore predefinito se non fornito
    zIndex: serverNote.zIndex || 1 // ZIndex predefinito se non fornito
  };
};

// Funzione per convertire dal formato interno dell'app al formato del server
const mapClientNoteToServerNote = (clientNote: Note): Partial<ServerNote> => {
  return {
    note_id: clientNote.id,
    title: clientNote.text,
    position_x: clientNote.position.x,
    position_y: clientNote.position.y,
    color: clientNote.color,
    zIndex: clientNote.zIndex
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
    return serverNotes.map(mapServerNoteToClientNote);
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
      position_x: note.position.x,
      position_y: note.position.y,
      color: note.color,
      zIndex: note.zIndex,
      user: note.user || username,
    };
    
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
    const token = await getValidToken();
    if (!token) {
      return null;
    }

    // Prepara i dati per l'aggiornamento nel formato atteso dal server
    const noteData: Partial<ServerNote> = {};
    
    if (updatedNote.text !== undefined) {
      noteData.title = updatedNote.text;
    }
    
    if (updatedNote.position !== undefined) {
      noteData.position_x = updatedNote.position.x;
      noteData.position_y = updatedNote.position.y;
    }
    
    if (updatedNote.color !== undefined) {
      noteData.color = updatedNote.color;
    }
    
    if (updatedNote.zIndex !== undefined) {
      noteData.zIndex = updatedNote.zIndex;
    }

    const response = await axios.put(`/notes/${noteId}`, noteData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    
    // Convertiamo la risposta nel formato dell'app
    return mapServerNoteToClientNote(response.data);
  } catch (error) {
    console.error("Errore nell'aggiornamento della nota:", error);
    throw error;
  }
}

// Funzione per eliminare una nota
export async function deleteNote(noteId: string) {
  try {
    const token = await getValidToken();
    if (!token) {
      return null;
    }
    const response = await axios.delete(`/notes/${noteId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Errore nell'eliminazione della nota:", error);
    throw error;
  }
}

// Funzione per aggiornare la posizione di una nota
export async function updateNotePosition(noteId: string, position: { x: number, y: number }) {
  try {
    const token = await getValidToken();
    if (!token) {
      return null;
    }
    
    // Adattiamo al formato atteso dal server
    const data = { 
      position_x: position.x,
      position_y: position.y
    };
    
    const response = await axios.patch(`/notes/${noteId}/position`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    
    // Convertiamo la risposta nel formato dell'app
    return mapServerNoteToClientNote(response.data);
  } catch (error) {
    console.error("Errore nell'aggiornamento della posizione della nota:", error);
    throw error;
  }
}