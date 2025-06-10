// Test component per verificare la funzionalità delle note ottimizzate
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { OptimizedNotesCanvas } from '../Notes/OptimizedNotesCanvas';
import { Note } from '../../src/services/noteService';

// Dati di test
const TEST_NOTES: Note[] = [
  {
    id: 'test-1',
    text: 'Nota di test 1 - Trascina per testare',
    position: { x: 50, y: 100 },
    color: '#FFCDD2',
    zIndex: 1,
    key: 'test-1',
  },
  {
    id: 'test-2', 
    text: 'Nota di test 2 - Long press per editare',
    position: { x: 200, y: 200 },
    color: '#E1BEE7',
    zIndex: 2,
    key: 'test-2',
  },
];

export const NotesTestComponent: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(TEST_NOTES);

  const handleUpdatePosition = (id: string, position: { x: number; y: number }) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id ? { ...note, position } : note
      )
    );
    console.log(`Nota ${id} spostata a:`, position);
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    Alert.alert('Info', `Nota ${id} eliminata`);
  };

  const handleUpdateNote = (id: string, text: string) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id ? { ...note, text } : note
      )
    );
    console.log(`Nota ${id} aggiornata:`, text);
  };

  const handleBringToFront = (id: string) => {
    setNotes(prevNotes => {
      const maxZ = Math.max(...prevNotes.map(n => n.zIndex));
      return prevNotes.map(note =>
        note.id === id ? { ...note, zIndex: maxZ + 1 } : note
      );
    });
    console.log(`Nota ${id} portata in primo piano`);
  };

  return (
    <View style={styles.container}>      <OptimizedNotesCanvas
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
});

export default NotesTestComponent;
