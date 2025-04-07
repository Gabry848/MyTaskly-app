import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import DraggableNote from '../../../components/DraggableNote';

interface Note {
  id: string;
  text: string;
  position: {
    x: number;
    y: number;
  };
  color: string;
  zIndex: number;
}

const COLORS = ['#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#C5CAE9', '#BBDEFB', '#B3E5FC', '#B2EBF2', '#B2DFDB', '#C8E6C9'];

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [nextId, setNextId] = useState(0);
  const [nextZIndex, setNextZIndex] = useState(1);
  const { width, height } = Dimensions.get('window');
  
  const panRefs = useRef<{[key: string]: Animated.ValueXY}>({});

  const addNote = () => {
    if (newNoteText.trim() === '') return;

    const randomX = Math.random() * (width - 200);
    const randomY = Math.random() * (height - 200);
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

    const newNote: Note = {
      id: `note-${nextId}`,
      text: newNoteText,
      position: {
        x: randomX,
        y: randomY,
      },
      color: randomColor,
      zIndex: nextZIndex,
    };

    panRefs.current[newNote.id] = new Animated.ValueXY({ 
      x: randomX, 
      y: randomY 
    });

    setNotes([...notes, newNote]);
    setNewNoteText('');
    setNextId(nextId + 1);
    setNextZIndex(nextZIndex + 1);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
    delete panRefs.current[id];
  };

  const updateNote = (id: string, newText: string) => {
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
      onPanResponderRelease: () => {
        panRefs.current[noteId].flattenOffset();
        
        setNotes(prevNotes => {
          return prevNotes.map(note => {
            if (note.id === noteId) {
              return {
                ...note,
                position: {
                  x: panRefs.current[noteId].x._value,
                  y: panRefs.current[noteId].y._value
                }
              };
            }
            return note;
          });
        });
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
              onDelete={deleteNote}
              onUpdate={updateNote}
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
        <TouchableOpacity style={styles.addButton} onPress={addNote}>
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
