import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
  Text,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
// Utilizziamo solo OptimizedNotesCanvas per evitare conflitti
import { OptimizedNotesCanvas } from '../../../components/Notes/OptimizedNotesCanvas';
import { SimpleNotesTest } from '../../../components/SimpleNotesTest';
import { Note as NoteInterface, addNote, deleteNote, getNotes, updateNote, updateNotePosition } from '../../services/noteService';

const COLORS = ['#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#C5CAE9', '#BBDEFB', '#B3E5FC', '#B2EBF2', '#B2DFDB', '#C8E6C9'];

export default function Notes() {
  const [notes, setNotes] = useState<NoteInterface[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [nextZIndex, setNextZIndex] = useState(1);
  const { width, height } = Dimensions.get('window');
  const [isLoading, setIsLoading] = useState(false);

  // Hook che viene eseguito ogni volta che la pagina riceve il focus
  useFocusEffect(
    useCallback(() => {
      console.log('Notes screen focused - refreshing notes');
      fetchNotes();
      
      // Pulizia quando la pagina perde il focus
      return () => {
        console.log('Notes screen unfocused');
      };
    }, [])
  );

  // Carica le note dal server all'avvio
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching notes from server...');
      const fetchedNotes = await getNotes();
      console.log(`Fetched ${fetchedNotes.length} notes from server`);
      
      setNotes(fetchedNotes);
      
      // Trova lo zIndex più alto tra le note esistenti
      if (fetchedNotes.length > 0) {
        const highestZIndex = Math.max(...fetchedNotes.map(note => note.zIndex));
        setNextZIndex(highestZIndex + 1);
      }
    } catch (error) {
      console.error("Errore nel caricamento delle note:", error);
      Alert.alert("Errore", "Impossibile caricare le note dal server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (newNoteText.trim() === '') return;

    const randomX = Math.random() * (width - 200);
    const randomY = Math.random() * (height - 200);
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

    const newNote: NoteInterface = {
      id: `temp-${Date.now()}`, // ID temporaneo
      text: newNoteText,
      position: {
        x: randomX,
        y: randomY,
      },
      color: randomColor,
      zIndex: nextZIndex,
      key: `temp-${Date.now()}`,
    };

    // Aggiunge localmente la nota prima di salvarla sul server
    setNotes(prevNotes => [...prevNotes, newNote]);
    
    setNewNoteText('');
    setNextZIndex(nextZIndex + 1);

    try {
      // Invia la nota al server
      const savedNote = await addNote(newNote);
      
      // Aggiorna l'ID temporaneo con l'ID restituito dal server
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === newNote.id ? { ...note, id: savedNote.id } : note
        )
      );
    } catch (error) {
      console.error("Errore nel salvataggio della nota:", error);
      Alert.alert("Errore", "Impossibile salvare la nota sul server");
      
      // Rimuove la nota se il salvataggio fallisce
      setNotes(prevNotes => prevNotes.filter(note => note.id !== newNote.id));
    }
  };  const handleDeleteNote = async (id: string) => {
    console.log(`[DEBUG] handleDeleteNote called for note ${id}`);
    console.log(`[DEBUG] ID type: ${typeof id}, ID value: "${id}"`);
    
    // Converti l'ID in stringa per sicurezza
    const stringId = String(id);
    console.log(`[DEBUG] Converted ID to string: "${stringId}"`);
    
    if (!stringId || stringId.trim() === '') {
      console.error('[DEBUG] Invalid note ID provided for deletion');
      return;
    }
    
    console.log(`[DEBUG] ID validation passed`);
    
    // TEMPORANEO: Elimina direttamente senza conferma per debug
    console.log(`[DEBUG] Proceeding with deletion of note ${stringId} (no confirmation)`);
    
    console.log(`[DEBUG] About to enter try block`);
    try {
      console.log(`[DEBUG] Inside try block - about to remove from local state`);
      // Rimuove localmente la nota prima di eliminarla sul server
      console.log(`[DEBUG] Removing note ${stringId} from local state`);
      
      console.log(`[DEBUG] Current notes before deletion:`, notes.map(n => ({ id: n.id, text: n.text.substring(0, 20) })));
      
      setNotes(prevNotes => {
        console.log(`[DEBUG] Inside setNotes callback`);
        const filteredNotes = prevNotes.filter(note => {
          const shouldKeep = String(note.id) !== stringId;
          console.log(`[DEBUG] Note ${note.id}: shouldKeep = ${shouldKeep}`);
          return shouldKeep;
        });
        console.log(`[DEBUG] Local notes count: ${prevNotes.length} -> ${filteredNotes.length}`);
        return filteredNotes;
      });

      console.log(`[DEBUG] Local state update completed, about to call server`);
      // Elimina la nota sul server
      console.log(`[DEBUG] Calling deleteNote service for note ${stringId}`);
      const result = await deleteNote(stringId);
      console.log(`[DEBUG] Note ${stringId} deleted successfully from server:`, result);
    } catch (error) {
      console.error(`[DEBUG] Errore nell'eliminazione della nota ${stringId}:`, error);
      Alert.alert("Errore", "Impossibile eliminare la nota dal server");
      
      // Se l'eliminazione fallisce, recarica tutte le note dal server
      console.log('[DEBUG] Reloading notes due to deletion error');
      fetchNotes();
    }
    console.log(`[DEBUG] handleDeleteNote function completed`);
  };
  const handleUpdateNote = async (id: string, newText: string) => {
    console.log(`[DEBUG] handleUpdateNote called for note ${id} with text:`, newText);
    
    if (!id || id.trim() === '') {
      console.error('[DEBUG] Invalid note ID provided for update');
      return;
    }
    
    try {
      // Aggiorna localmente la nota prima di aggiornarla sul server
      setNotes(prevNotes => {
        return prevNotes.map(note => {
          if (note.id === id) {
            return {
              ...note,
              text: newText
            };
          }
          return note;
        });
      });

      // Aggiorna la nota sul server
      await updateNote(id, { text: newText });
      console.log(`[DEBUG] Note ${id} updated successfully`);
    } catch (error) {
      console.error(`[DEBUG] Errore nell'aggiornamento della nota ${id}:`, error);
      Alert.alert("Errore", "Impossibile aggiornare la nota sul server");
      
      // Se l'aggiornamento fallisce, recarica tutte le note dal server
      fetchNotes();
    }
  };  const handleUpdatePosition = async (id: string, newPosition: { x: number; y: number }) => {
    console.log(`[DEBUG] handleUpdatePosition called for note ${id}:`, newPosition);
    
    if (!id || id.trim() === '') {
      console.error('[DEBUG] Invalid note ID provided for position update');
      return;
    }
    
    // Validazione delle coordinate
    if (typeof newPosition.x !== 'number' || typeof newPosition.y !== 'number' || 
        !isFinite(newPosition.x) || !isFinite(newPosition.y)) {
      console.error('[DEBUG] Invalid position coordinates:', newPosition);
      return;
    }
    
    try {
      // Aggiorna localmente la posizione della nota
      setNotes(prevNotes => {
        return prevNotes.map(note => {
          if (note.id === id) {
            return {
              ...note,
              position: newPosition
            };
          }
          return note;
        });
      });
      
      // Aggiorna la posizione sul server
      console.log(`[DEBUG] Invio posizione al server per la nota ${id}`);
      await updateNotePosition(id, newPosition);
      console.log(`[DEBUG] Posizione aggiornata con successo sul server per nota ${id}`);
    } catch (error) {
      console.error(`[DEBUG] Errore nell'aggiornamento della posizione per nota ${id}:`, error);      // Non mostriamo un alert qui per non interrompere l'esperienza utente
    }
  };

  return (
    <View style={styles.container}>
      {/* Area delle note con OptimizedNotesCanvas per prestazioni massime */}
      <View style={styles.notesArea}>        {notes.length >= 0 ? (
          <OptimizedNotesCanvas
            notes={notes}
            onUpdatePosition={handleUpdatePosition}
            onDeleteNote={handleDeleteNote}
            onUpdateNote={handleUpdateNote}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <Text>Caricamento note...</Text>
          </View>
        )}
      </View>
      
      {/* Area di input non soggetta a pan e zoom */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newNoteText}
          onChangeText={setNewNoteText}
          placeholder="Scrivi una nuova nota..."
          multiline
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddNote}>
          <FontAwesome name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  notesArea: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    // Questo assicura che l'input rimanga in posizione fissa e non sia soggetto a pan e zoom
    position: 'relative',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#f9f9f9',
    borderRadius: 25,
    paddingHorizontal: 15,
    fontSize: 16,
    elevation: 2,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    elevation: 3,
  },
});
