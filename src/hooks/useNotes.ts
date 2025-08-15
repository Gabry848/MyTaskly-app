import { useState, useEffect, useCallback, useRef } from 'react';
import { Dimensions } from 'react-native';
import { Note, addNote, deleteNote, getNotes, updateNote, updateNotePosition } from '../services/noteService';
import { useFocusEffect } from '@react-navigation/native';

const COLORS = [
  '#FFCDD2', // Rosa chiaro
  '#F8BBD0', // Rosa
  '#E1BEE7', // Violetto chiaro
  '#D1C4E9', // Violetto
  '#C5CAE9', // Indaco chiaro
  '#BBDEFB', // Blu chiaro
  '#B3E5FC', // Azzurro
  '#B2EBF2', // Ciano
  '#B2DFDB', // Verde acqua
  '#C8E6C9', // Verde chiaro
];

interface UseNotesOptions {
  autoRefreshOnFocus?: boolean;
}

export interface NotesState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  nextZIndex: number;
}

export interface NotesActions {
  addNote: (text: string) => Promise<void>;
  updateNote: (id: string, text: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  updateNotePosition: (id: string, position: { x: number; y: number }) => Promise<void>;
  refreshNotes: () => Promise<void>;
  clearError: () => void;
  generateRandomPosition: () => { x: number; y: number };
}

export function useNotes(options: UseNotesOptions = {}): [NotesState, NotesActions] {
  const { autoRefreshOnFocus = true } = options;
  const [state, setState] = useState<NotesState>({
    notes: [],
    isLoading: false,
    error: null,
    nextZIndex: 1,
  });

  const { width, height } = Dimensions.get('window');
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateState = useCallback((updates: Partial<NotesState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const generateRandomPosition = useCallback(() => {
    const padding = 50;
    const noteWidth = 200;
    const noteHeight = 160;
    
    // Griglia 50x50 con punti ogni 40px = 2000x2000px totali
    const GRID_SIZE = 40;
    const GRID_POINTS = 50;
    const CANVAS_SIZE = GRID_POINTS * GRID_SIZE;
    
    // Genera posizioni al centro della griglia (intorno al punto 25,25)
    const centerArea = CANVAS_SIZE / 2;
    const areaSize = Math.min(width, height); // Area del viewport
    
    const minX = centerArea - areaSize / 2 + padding;
    const maxX = centerArea + areaSize / 2 - noteWidth - padding;
    const minY = centerArea - areaSize / 2 + padding;
    const maxY = centerArea + areaSize / 2 - noteHeight - padding;
    
    return {
      x: Math.random() * (maxX - minX) + minX,
      y: Math.random() * (maxY - minY) + minY,
    };
  }, [width, height]);

  const getRandomColor = useCallback(() => {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }, []);

  const validateNote = useCallback((note: any): boolean => {
    if (!note || typeof note !== 'object') return false;
    if (!note.id || typeof note.id !== 'string') return false;
    if (typeof note.text !== 'string') return false;
    if (!note.position || typeof note.position.x !== 'number' || typeof note.position.y !== 'number') return false;
    if (!isFinite(note.position.x) || !isFinite(note.position.y)) return false;
    return true;
  }, []);

  const refreshNotes = useCallback(async () => {
    // Cancella operazioni precedenti
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    updateState({ isLoading: true, error: null });
    
    try {
      const fetchedNotes = await getNotes();
      
      // Valida e filtra le note
      const validNotes = fetchedNotes.filter(validateNote);
      
      if (validNotes.length !== fetchedNotes.length) {
        console.warn(`Filtrate ${fetchedNotes.length - validNotes.length} note non valide`);
      }

      // Calcola il prossimo zIndex
      const maxZIndex = validNotes.length > 0 
        ? Math.max(...validNotes.map(note => note.zIndex || 1))
        : 0;

      updateState({
        notes: validNotes,
        nextZIndex: maxZIndex + 1,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      if (!abortControllerRef.current?.signal.aborted) {
        console.error('Errore nel caricamento delle note:', error);
        updateState({
          isLoading: false,
          error: 'Impossibile caricare le note dal server',
        });
      }
    }
  }, [updateState, validateNote]);

  // Auto-refresh quando la schermata riceve il focus
  useFocusEffect(
    useCallback(() => {
      if (autoRefreshOnFocus) {
        refreshNotes();
      }
      return () => {
        // Cleanup: cancella operazioni in corso
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }, [autoRefreshOnFocus, refreshNotes])
  );

  // Carica le note inizialmente
  useEffect(() => {
    refreshNotes();
  }, [refreshNotes]);

  const addNoteAction = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const position = generateRandomPosition();
    const color = getRandomColor();
    
    console.log('addNoteAction - Creating note:', { tempId, text, position, color });
    
    // Usa setState con funzione per evitare dipendenze dallo state
    setState(prevState => {
      const newNote: Note = {
        id: tempId,
        text: text.trim(),
        position,
        color,
        zIndex: prevState.nextZIndex,
      };

      console.log('addNoteAction - New note created:', newNote);
      console.log('addNoteAction - Previous notes count:', prevState.notes.length);

      return {
        ...prevState,
        notes: [...prevState.notes, newNote],
        nextZIndex: prevState.nextZIndex + 1,
      };
    });

    try {
      // Ottieni lo state aggiornato per la chiamata API
      setState(prevState => {
        const newNote = prevState.notes.find(note => note.id === tempId);
        if (newNote) {
          // Chiamata asincrona per salvare
          addNote(newNote).then(savedNote => {
            setState(currentState => ({
              ...currentState,
              notes: currentState.notes.map(note =>
                note.id === tempId ? { ...note, id: savedNote.id } : note
              ),
            }));
          }).catch(error => {
            console.error('Errore nel salvataggio della nota:', error);
            setState(currentState => ({
              ...currentState,
              notes: currentState.notes.filter(note => note.id !== tempId),
              error: 'Impossibile salvare la nota',
            }));
          });
        }
        return prevState;
      });
    } catch (error: any) {
      console.error('Errore nel salvataggio della nota:', error);
    }
  }, [generateRandomPosition, getRandomColor]);

  const updateNoteAction = useCallback(async (id: string, newText: string) => {
    if (!id.trim() || !newText.trim()) return;

    // Aggiornamento ottimistico
    setState(prevState => ({
      ...prevState,
      notes: prevState.notes.map(note =>
        note.id === id ? { ...note, text: newText.trim() } : note
      ),
    }));

    try {
      await updateNote(id, { text: newText.trim() });
    } catch (error: any) {
      console.error('Errore nell\'aggiornamento della nota:', error);
      updateState({ error: 'Impossibile aggiornare la nota' });
      // Ripristina lo stato precedente
      refreshNotes();
    }
  }, [updateState, refreshNotes]);

  const deleteNoteAction = useCallback(async (id: string) => {
    if (!id.trim()) return;

    // Rimozione ottimistica
    setState(prevState => ({
      ...prevState,
      notes: prevState.notes.filter(note => note.id !== id),
    }));

    try {
      await deleteNote(id);
    } catch (error: any) {
      console.error('Errore nell\'eliminazione della nota:', error);
      updateState({ error: 'Impossibile eliminare la nota' });
      // Ripristina lo stato precedente
      refreshNotes();
    }
  }, [updateState, refreshNotes]);

  const updateNotePositionAction = useCallback(async (id: string, newPosition: { x: number; y: number }) => {
    if (!id.trim() || !isFinite(newPosition.x) || !isFinite(newPosition.y)) return;

    // Aggiornamento ottimistico della posizione
    setState(prevState => ({
      ...prevState,
      notes: prevState.notes.map(note =>
        note.id === id ? { ...note, position: newPosition } : note
      ),
    }));

    try {
      await updateNotePosition(id, newPosition);
    } catch (error: any) {
      console.error('Errore nell\'aggiornamento della posizione:', error);
      // Non mostriamo errore per le posizioni per non interrompere il drag
    }
  }, []);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const actions: NotesActions = {
    addNote: addNoteAction,
    updateNote: updateNoteAction,
    deleteNote: deleteNoteAction,
    updateNotePosition: updateNotePositionAction,
    refreshNotes,
    clearError,
    generateRandomPosition,
  };

  return [state, actions];
}
