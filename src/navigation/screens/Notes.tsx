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

interface Note {oid
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

  // Aggiungi una nuova nota
  const addNote = () => {
    if (newNoteText.trim() === '') return;

    // Posizione casuale all'interno dei limiti della lavagna
    const randomX = Math.random() * (width - 200);
    const randomY = Math.random() * (height - 200);
    
    // Colore casuale dall'array dei colori
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

    setNotes([...notes, newNote]);
    setNewNoteText('');
    setNextId(nextId + 1);
    setNextZIndex(nextZIndex + 1);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
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

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        {notes.map(note => (
          <DraggableNote 
            key={note.id} 
            note={note} 
            onBringToFront={bringToFront}
            onDelete={deleteNote}
          />
        ))}
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

interface DraggableNoteProps {
  note: Note;
  onBringToFront: (id: string) => void;
  onDelete: (id: string) => void;
}

function DraggableNote({ note, onBringToFront, onDelete }: DraggableNoteProps) {
  const pan = useRef(new Animated.ValueXY({ 
    x: note.position.x, 
    y: note.position.y 
  })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Porta la nota in primo piano quando viene toccata
        onBringToFront(note.id);
        
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.note,
        {
          backgroundColor: note.color,
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          zIndex: note.zIndex,
          elevation: note.zIndex, // Aggiungi elevation per Android
        },
      ]}
    >
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => onDelete(note.id)}
      >
        <FontAwesome name="times" size={16} color="#555" />
      </TouchableOpacity>
      <Text style={styles.noteText}>{note.text}</Text>
    </Animated.View>
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
