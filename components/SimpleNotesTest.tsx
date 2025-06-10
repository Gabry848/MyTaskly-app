// Test component minimalista per verificare che le note funzionino
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { OptimizedNotesCanvas } from './Notes/OptimizedNotesCanvas';
import { Note } from '../src/services/noteService';

const SIMPLE_TEST_NOTES: Note[] = [
  {
    id: 'simple-1',
    text: 'Test nota 1',
    position: { x: 50, y: 100 },
    color: '#FFCDD2',
    zIndex: 1,
  },
  {
    id: 'simple-2',
    text: 'Test nota 2',
    position: { x: 200, y: 200 },
    color: '#E1BEE7',
    zIndex: 2,
  },
];

export const SimpleNotesTest: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(SIMPLE_TEST_NOTES);

  const handleUpdatePosition = (id: string, position: { x: number; y: number }) => {
    console.log(`Nota ${id} spostata a:`, position);
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id ? { ...note, position } : note
      )
    );
  };

  const handleDeleteNote = (id: string) => {
    console.log(`Eliminando nota ${id}`);
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    Alert.alert('Info', `Nota ${id} eliminata`);
  };

  const handleUpdateNote = (id: string, text: string) => {
    console.log(`Aggiornando nota ${id}:`, text);
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id ? { ...note, text } : note
      )
    );
  };

  const handleBringToFront = (id: string) => {
    console.log(`Portando in primo piano nota ${id}`);
    setNotes(prevNotes => {
      const maxZ = Math.max(...prevNotes.map(n => n.zIndex));
      return prevNotes.map(note =>
        note.id === id ? { ...note, zIndex: maxZ + 1 } : note
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Test Notes - {notes.length} note</Text>
      </View>      <OptimizedNotesCanvas
        notes={notes}
        onUpdatePosition={handleUpdatePosition}
        onDeleteNote={handleDeleteNote}
        onUpdateNote={handleUpdateNote}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default SimpleNotesTest;
