import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import NotesCanvas from '../../../components/NotesCanvas';
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
  };

  const handleDeleteNote = async (id: string) => {
    // Rimuove localmente la nota prima di eliminarla sul server
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));

    try {
      // Elimina la nota sul server
      await deleteNote(id);
    } catch (error) {
      console.error("Errore nell'eliminazione della nota:", error);
      Alert.alert("Errore", "Impossibile eliminare la nota dal server");
      
      // Se l'eliminazione fallisce, recarica tutte le note dal server
      fetchNotes();
    }
  };

  const handleUpdateNote = async (id: string, newText: string) => {
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

    try {
      // Aggiorna la nota sul server
      await updateNote(id, { text: newText });
    } catch (error) {
      console.error("Errore nell'aggiornamento della nota:", error);
      Alert.alert("Errore", "Impossibile aggiornare la nota sul server");
      
      // Se l'aggiornamento fallisce, recarica tutte le note dal server
      fetchNotes();
    }
  };

  const handleUpdatePosition = async (id: string, newPosition: { x: number; y: number }) => {
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
    try {
      console.log("Invio posizione al server per la nota", id);
      await updateNotePosition(id, newPosition);
      console.log("Posizione aggiornata con successo sul server");
    } catch (error) {
      console.error("Errore nell'aggiornamento della posizione:", error);
      // Non mostriamo un alert qui per non interrompere l'esperienza utente
    }
  };

  const handleBringToFront = (id: string) => {
    const newZIndex = nextZIndex + 1;
    setNotes(prevNotes => {
      const index = prevNotes.findIndex(n => n.id === id);
      if (index === -1) return prevNotes;
      const updatedNotes = [...prevNotes];
      const [selectedNote] = updatedNotes.splice(index, 1);
      selectedNote.zIndex = newZIndex;
      updatedNotes.push(selectedNote);
      return updatedNotes;
    });
    setNextZIndex(newZIndex);
  };

  return (
    <View style={styles.container}>
      {/* Area delle note con NotesCanvas per gestire pan e zoom */}
      <View style={styles.notesArea}>
        <NotesCanvas
          notes={notes}
          onUpdatePosition={handleUpdatePosition}
          onDeleteNote={handleDeleteNote}
          onUpdateNote={handleUpdateNote}
          onBringToFront={handleBringToFront}
        />
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
