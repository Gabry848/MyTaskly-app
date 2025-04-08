import axios from "axios";
import { getValidToken } from "./authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/authConstants";

// Definizione dell'interfaccia Note
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

// Funzione per ottenere tutte le note dell'utente
export async function getNotes() {
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
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero delle note:", error);
    return [];
  }
}

// Funzione per aggiungere una nuova nota
export async function addNote(note: Note) {
  try {
    const token = await getValidToken();
    if (!token) {
      return null;
    }
    const username = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
    const data = {
      text: note.text,
      position: {
        x: note.position.x,
        y: note.position.y,
      },
      color: note.color,
      zIndex: note.zIndex,
      user: note.user || username,
    };
    
    const response = await axios.post("/notes", data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Errore nella creazione della nota:", error);
    throw error;
  }
}

// Funzione per aggiornare una nota esistente
export async function updateNote(noteId: string, updatedNote: Partial<Note>) {
  try {
    const token = await getValidToken();
    if (!token) {
      return null;
    }

    // Prepara i dati per l'aggiornamento
    const noteData = {
      text: updatedNote.text,
      position: updatedNote.position,
      color: updatedNote.color,
      zIndex: updatedNote.zIndex,
    };

    const response = await axios.put(`/notes/${noteId}`, noteData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
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
    
    const data = { position };
    
    const response = await axios.patch(`/notes/${noteId}/position`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Errore nell'aggiornamento della posizione della nota:", error);
    throw error;
  }
}