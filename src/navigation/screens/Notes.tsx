import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Animated,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import DraggableNote from '../../../components/DraggableNote';
import { Note as NoteInterface, addNote, deleteNote, getNotes, updateNote, updateNotePosition } from '../../services/noteService';

const COLORS = ['#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#C5CAE9', '#BBDEFB', '#B3E5FC', '#B2EBF2', '#B2DFDB', '#C8E6C9'];

export default function Notes() {
  const [notes, setNotes] = useState<NoteInterface[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [nextZIndex, setNextZIndex] = useState(1);
  const { width, height } = Dimensions.get('window');
  const [isLoading, setIsLoading] = useState(false);
  
  const panRefs = useRef<{[key: string]: Animated.ValueXY}>({});

  // Carica le note dal server all'avvio
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const fetchedNotes = await getNotes();
      setNotes(fetchedNotes);
      
      // Trova lo zIndex più alto tra le note esistenti
      if (fetchedNotes.length > 0) {
        const highestZIndex = Math.max(...fetchedNotes.map(note => note.zIndex));
        setNextZIndex(highestZIndex + 1);
      }
      
      // Inizializza i riferimenti animati per ogni nota
      fetchedNotes.forEach(note => {
        if (!panRefs.current[note.id]) {
          panRefs.current[note.id] = new Animated.ValueXY({ 
            x: note.position.x, 
            y: note.position.y 
          });
        }
      });
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
    panRefs.current[newNote.id] = new Animated.ValueXY({ 
      x: randomX, 
      y: randomY 
    });
    
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
      
      // Aggiorna il riferimento animato con il nuovo ID
      if (savedNote && savedNote.id) {
        panRefs.current[savedNote.id] = panRefs.current[newNote.id];
        delete panRefs.current[newNote.id];
      }
    } catch (error) {
      console.error("Errore nel salvataggio della nota:", error);
      Alert.alert("Errore", "Impossibile salvare la nota sul server");
      
      // Rimuove la nota se il salvataggio fallisce
      setNotes(prevNotes => prevNotes.filter(note => note.id !== newNote.id));
      delete panRefs.current[newNote.id];
    }
  };

  const handleDeleteNote = async (id: string) => {
    // Rimuove localmente la nota prima di eliminarla sul server
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    delete panRefs.current[id];

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

  const bringToFront = (id: string) => {
    const newZIndex = nextZIndex + 1;
    setNotes(prevNotes => {
      const index = prevNotes.findIndex(n => n.id === id);
      if (index === -1) return prevNotes;
      const updatedNotes = [...prevNotes];
      const [selectedNote] = updatedNotes.splice(index, 1);
      selectedNote.zIndex = newZIndex;
      updatedNotes.push(selectedNote);
      
      // Aggiorna lo zIndex sul server
      updateNote(id, { zIndex: newZIndex })
        .catch(error => {
          console.error("Errore nell'aggiornamento dello zIndex:", error);
        });
      
      return updatedNotes;
    });
    setNextZIndex(newZIndex);
  };

  const createPanResponder = (noteId: string) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        bringToFront(noteId);
        
        panRefs.current[noteId].setOffset({
          x: panRefs.current[noteId].x._value,
          y: panRefs.current[noteId].y._value
        });
        panRefs.current[noteId].setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: panRefs.current[noteId].x, dy: panRefs.current[noteId].y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: async () => {
        panRefs.current[noteId].flattenOffset();
        
        const newPosition = {
          x: panRefs.current[noteId].x._value,
          y: panRefs.current[noteId].y._value
        };
        
        // Aggiorna localmente la posizione della nota
        setNotes(prevNotes => {
          return prevNotes.map(note => {
            if (note.id === noteId) {
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
          await updateNotePosition(noteId, newPosition);
        } catch (error) {
          console.error("Errore nell'aggiornamento della posizione:", error);
          // Non mostriamo un alert qui per non interrompere l'esperienza utente
        }
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        {notes.map(note => {
          if (!panRefs.current[note.id]) {
            panRefs.current[note.id] = new Animated.ValueXY({ 
              x: note.position.x, 
              y: note.position.y 
            });
          }
          
          return (
            <DraggableNote 
              key={note.id} 
              note={note} 
              panResponder={createPanResponder(note.id)}
              pan={panRefs.current[note.id]}
              onDelete={handleDeleteNote}
              onUpdate={handleUpdateNote}
            />
          );
        })}
      </View>
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
    backgroundColor: '#F5F5F5',
  },
  board: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
  note: {
    position: 'absolute',
    width: 200,
    minHeight: 120,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noteText: {
    fontSize: 16,
    color: '#333',
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
