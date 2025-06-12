import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotesProvider } from '../../context/NotesContext';
import { ModernNotesCanvas } from '../../../components/Notes/ModernNotesCanvas';
import { ModernNoteInput } from '../../../components/Notes/ModernNoteInput';
import { NotesErrorBoundary } from '../../../components/Notes/NotesErrorBoundary';
import { useNotesState, useNotesActions } from '../../context/NotesContext';

const NotesContent: React.FC = () => {
  const state = useNotesState();
  const actions = useNotesActions();

  return (
    <NotesErrorBoundary error={state.error} onClearError={actions.clearError}>
      <View style={styles.content}>
        {/* Area canvas per le note - ora moderna e ottimizzata */}
        <View style={styles.canvasContainer}>
          <ModernNotesCanvas
            notes={state.notes}
            isLoading={state.isLoading}
            onUpdatePosition={actions.updateNotePosition}
            onDeleteNote={actions.deleteNote}
            onUpdateNote={actions.updateNote}
            onRefresh={actions.refreshNotes}
          />
        </View>

        {/* Input per nuove note - design moderno con blur */}
        <View style={styles.inputContainer}>
          <ModernNoteInput
            onAddNote={actions.addNote}
            isLoading={state.isLoading}
          />
        </View>
      </View>
    </NotesErrorBoundary>
  );
};

export default function Notes() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.container}>
        <NotesProvider autoRefreshOnFocus={true}>
          <NotesContent />
        </NotesProvider>
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
  content: {
    flex: 1,
  },
  canvasContainer: {
    flex: 1,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
});
