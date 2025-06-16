import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// Importazioni temporaneamente commentate per disabilitare la pagina
// import { NotesProvider } from '../../context/NotesContext';
// import { ModernNotesCanvas } from '../../../components/Notes/ModernNotesCanvas';
// import { ModernNoteInput } from '../../../components/Notes/ModernNoteInput';
// import { NotesErrorBoundary } from '../../../components/Notes/NotesErrorBoundary';
// import { useNotesState, useNotesActions } from '../../context/NotesContext';

// PAGINA TEMPORANEAMENTE DISABILITATA
// Componente semplificato che mostra un messaggio di disabilitazione

const NotesContent: React.FC = () => {
  return (
    <View style={styles.disabledContainer}>
      <Text style={styles.disabledTitle}>Note temporaneamente disabilitate</Text>
      <Text style={styles.disabledMessage}>
        La pagina delle note è temporaneamente non disponibile.
        {'\n'}Tornerà presto!
      </Text>
    </View>
  );
};

export default function Notes() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.container}>
        <NotesContent />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // Stili per la pagina disabilitata
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  disabledTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  disabledMessage: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Stili originali commentati per riferimento futuro
  // content: {
  //   flex: 1,
  // },
  // canvasContainer: {
  //   flex: 1,
  // },
  // inputContainer: {
  //   position: 'absolute',
  //   bottom: 0,
  //   left: 0,
  //   right: 0,
  //   backgroundColor: 'transparent',
  //   zIndex: 1000,
  // },
});
