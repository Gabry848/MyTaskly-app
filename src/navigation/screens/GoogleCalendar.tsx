import React, { useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, StatusBar, Text, ActivityIndicator, Alert } from 'react-native';
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
    <View style={styles.contentContainer}>
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        <Text style={styles.successTitle}>Google Calendar Connesso</Text>
        <Text style={styles.successDescription}>
          Il tuo account Google Calendar è stato collegato con successo.
          {syncStatus && (
            `\n\nTask sincronizzati: ${syncStatus.synced_tasks}/${syncStatus.total_tasks} (${syncStatus.sync_percentage.toFixed(1)}%)`
          )}
        </Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Opzioni di Sincronizzazione</Text>
        <TouchableOpacity style={styles.syncButton} onPress={handleSyncTasks}>
          <Ionicons name="arrow-forward-outline" size={20} color="#4285F4" />
          <Text style={styles.syncButtonText}>Sincronizza Task → Calendario</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.syncButton} onPress={handleSyncEvents}>
          <Ionicons name="arrow-back-outline" size={20} color="#4285F4" />
          <Text style={styles.syncButtonText}>Importa Eventi → Task</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.syncButton} onPress={handleFullSync}>
          <Ionicons name="sync-outline" size={20} color="#4285F4" />
          <Text style={styles.syncButtonText}>Sincronizzazione Completa</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.disconnectButton, isLoading && styles.disconnectButtonDisabled]} 
        onPress={handleDisconnect}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FF5722" />
        ) : (
          <Text style={styles.disconnectButtonText}>Disconnetti Account</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderNotConnectedView = () => (
    <View style={styles.contentContainer}>
      <View style={styles.setupContainer}>
        <Ionicons name="calendar-outline" size={80} color="#666666" />
        <Text style={styles.setupTitle}>Configura Google Calendar</Text>
        <Text style={styles.setupDescription}>
          Collega il tuo account Google Calendar per sincronizzare automaticamente 
          i tuoi eventi e creare task dai tuoi impegni.
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <Ionicons name="sync-outline" size={24} color="#4285F4" />
          <Text style={styles.featureText}>Sincronizzazione automatica</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="create-outline" size={24} color="#4285F4" />
          <Text style={styles.featureText}>Creazione task da eventi</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="notifications-outline" size={24} color="#4285F4" />
          <Text style={styles.featureText}>Promemoria intelligenti</Text>
        </View>
      </View>

      {/* <TouchableOpacity 
        style={[styles.connectButton, isLoading && styles.connectButtonDisabled]} 
        onPress={handleConnect}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Ionicons name="logo-google" size={20} color="#ffffff" />
        )}
        <Text style={styles.connectButtonText}>
          {isLoading ? 'Connessione in corso...' : 'Connetti Google Calendar'}
        </Text> */}
      {/* </TouchableOpacity> */}
    </View>
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
  header: {
    paddingTop: 20,
    paddingHorizontal: 15,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: {
    padding: 8,
    marginRight: 15,
  },
  title: {
    fontSize: 30,
    fontWeight: '200',
    color: '#000000',
    fontFamily: 'System',
    letterSpacing: -1.5,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  setupContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  setupDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    marginVertical: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 15,
    fontWeight: '500',
  },
  connectButton: {
    backgroundColor: '#4285F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  successDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  infoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginVertical: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 15,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20,
  },
  disconnectButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  disconnectButtonText: {
    color: '#FF5722',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  connectButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  disconnectButtonDisabled: {
    opacity: 0.6,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    marginBottom: 10,
  },
  syncButtonText: {
    fontSize: 15,
    color: '#333333',
    marginLeft: 12,
    fontWeight: '500',
    flex: 1,
  },
  wipBanner: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wipText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
    marginLeft: 8,
  },
});