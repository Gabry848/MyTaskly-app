import React, { useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, StatusBar, Text, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';

export default function GoogleCalendar() {
  const {
    isConnected,
    isLoading,
    syncStatus,
    error,
    connectToGoogle,
    disconnect,
    performInitialSync,
    syncTasksToCalendar,
    syncCalendarToTasks,
    refreshStatus,
    clearError
  } = useGoogleCalendar();

  const handleConnect = async () => {
    await connectToGoogle();
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnetti Google Calendar',
      'Sei sicuro di voler disconnettere il tuo account Google Calendar? I tuoi task esistenti non verranno eliminati.',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Disconnetti', style: 'destructive', onPress: disconnect }
      ]
    );
  };

  const handleSyncTasks = async () => {
    await syncTasksToCalendar();
  };

  const handleSyncEvents = async () => {
    await syncCalendarToTasks();
  };

  const handleFullSync = async () => {
    await performInitialSync();
  };

  // Controlla stato connessione all'avvio
  useEffect(() => {
    refreshStatus();
  }, []);

  // Gestione errori
  useEffect(() => {
    if (error) {
      Alert.alert('Errore', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  const renderConnectedView = () => (
    <ScrollView style={styles.content}>
      <View style={styles.statusSection}>
        <Ionicons name="checkmark-circle" size={64} color="#28a745" />
        <Text style={styles.statusTitle}>Google Calendar Connesso</Text>
        <Text style={styles.statusDescription}>
          Il tuo account Google Calendar è stato collegato con successo.
          {syncStatus && (
            `\n\nTask sincronizzati: ${syncStatus.synced_tasks}/${syncStatus.total_tasks} (${syncStatus.sync_percentage.toFixed(1)}%)`
          )}
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Opzioni di Sincronizzazione</Text>
      </View>

      <TouchableOpacity style={styles.syncButton} onPress={handleSyncTasks}>
        <Ionicons name="arrow-forward-outline" size={20} color="#000000" />
        <Text style={styles.syncButtonText}>Sincronizza Task → Calendario</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.syncButton} onPress={handleSyncEvents}>
        <Ionicons name="arrow-back-outline" size={20} color="#000000" />
        <Text style={styles.syncButtonText}>Importa Eventi → Task</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.syncButton} onPress={handleFullSync}>
        <Ionicons name="sync-outline" size={20} color="#000000" />
        <Text style={styles.syncButtonText}>Sincronizzazione Completa</Text>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Account</Text>
      </View>

      <TouchableOpacity
        style={[styles.disconnectButton, isLoading && styles.disconnectButtonDisabled]}
        onPress={handleDisconnect}
        disabled={isLoading}
      >
        {isLoading ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator size="small" color="#dc3545" />
          </View>
        ) : (
          <View style={styles.buttonContent}>
            <Ionicons name="log-out-outline" size={20} color="#dc3545" />
            <Text style={styles.disconnectButtonText}>Disconnetti Account</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderNotConnectedView = () => (
    <ScrollView style={styles.content}>
      <View style={styles.setupSection}>
        <Ionicons name="calendar-outline" size={64} color="#000000" />
        <Text style={styles.setupTitle}>Configura Google Calendar</Text>
        <Text style={styles.setupDescription}>
          Collega il tuo account Google Calendar per sincronizzare automaticamente
          i tuoi eventi e creare task dai tuoi impegni.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Funzionalità</Text>
      </View>

      <View style={styles.featureItem}>
        <Ionicons name="sync-outline" size={24} color="#000000" />
        <Text style={styles.featureText}>Sincronizzazione automatica</Text>
      </View>

      <View style={styles.featureItem}>
        <Ionicons name="create-outline" size={24} color="#000000" />
        <Text style={styles.featureText}>Creazione task da eventi</Text>
      </View>

      <View style={styles.featureItem}>
        <Ionicons name="notifications-outline" size={24} color="#000000" />
        <Text style={styles.featureText}>Promemoria intelligenti</Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Work in Progress Banner */}
      <View style={styles.wipBanner}>
        <Ionicons name="construct-outline" size={20} color="#FF9800" />
        <Text style={styles.wipText}>Work in Progress</Text>
      </View>

      {/* Content */}
      {isConnected ? renderConnectedView() : renderNotConnectedView()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  wipBanner: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
  },
  wipText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'System',
  },
  statusSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
    fontFamily: 'System',
  },
  statusDescription: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'System',
  },
  setupSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
    fontFamily: 'System',
  },
  setupDescription: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'System',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  syncButtonText: {
    fontSize: 17,
    color: '#000000',
    marginLeft: 15,
    fontWeight: '400',
    flex: 1,
    fontFamily: 'System',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  featureText: {
    fontSize: 17,
    color: '#000000',
    marginLeft: 15,
    fontWeight: '400',
    fontFamily: 'System',
  },
  disconnectButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  disconnectButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disconnectButtonText: {
    color: '#dc3545',
    fontSize: 17,
    fontWeight: '400',
    marginLeft: 15,
    fontFamily: 'System',
  },
});
