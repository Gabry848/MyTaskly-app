import React from 'react';
import { View, StyleSheet, Text, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotesProvider } from '../../src/context/NotesContext';
import { ModernNotesCanvas } from './ModernNotesCanvas';
import { ModernNoteInput } from './ModernNoteInput';
import { NotesErrorBoundary } from './NotesErrorBoundary';
import { useNotesState, useNotesActions } from '../../src/context/NotesContext';

const ModernNotesTestContent: React.FC = () => {
  const state = useNotesState();
  const actions = useNotesActions();

  return (
    <NotesErrorBoundary error={state.error} onClearError={actions.clearError}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Modern Notes Test</Text>
          <Text style={styles.subtitle}>
            {state.notes.length} note{state.notes.length !== 1 ? '' : 'a'}
            {state.isLoading && ' (caricamento...)'}
          </Text>
        </View>

        {/* Canvas Area */}
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

        {/* Input Area */}
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

export const ModernNotesTest: React.FC = () => {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <NotesProvider autoRefreshOnFocus={true}>
        <ModernNotesTestContent />
      </NotesProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  canvasContainer: {
    flex: 1,
  },
  inputContainer: {
    backgroundColor: 'transparent',
  },
});

export default ModernNotesTest;
