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

  // Gestione errori
  useEffect(() => {
    if (error) {
      Alert.alert('Errore', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  const renderConnectedView = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Status section */}
      <View style={styles.statusSection}>
        <Ionicons name="checkmark-circle" size={56} color="#000000" />
        <Text style={styles.statusTitle}>Google Calendar Connesso</Text>
        <Text style={styles.statusDescription}>
          Il tuo account Google Calendar è collegato con successo.
        </Text>
      </View>

      {/* Sincronizzazione manuale */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sincronizzazione</Text>
        <Text style={styles.sectionDescription}>
          Gestisci manualmente la sincronizzazione tra i tuoi task e il calendario.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.row, isLoading && styles.rowDisabled]}
        onPress={handleSyncTasks}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <View style={styles.rowLeft}>
          <Ionicons name="arrow-forward-outline" size={22} color="#000000" />
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowLabel}>Esporta task su Calendar</Text>
            <Text style={styles.rowHint}>Crea/aggiorna eventi dai tuoi task</Text>
          </View>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color="#000000" />
        ) : (
          <Ionicons name="chevron-forward" size={18} color="#c7c7cc" />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.row, isLoading && styles.rowDisabled]}
        onPress={handleSyncEvents}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <View style={styles.rowLeft}>
          <Ionicons name="arrow-back-outline" size={22} color="#000000" />
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowLabel}>Importa eventi come task</Text>
            <Text style={styles.rowHint}>Crea task dagli eventi del tuo calendario</Text>
          </View>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color="#000000" />
        ) : (
          <Ionicons name="chevron-forward" size={18} color="#c7c7cc" />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.row, isLoading && styles.rowDisabled]}
        onPress={handleFullSync}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <View style={styles.rowLeft}>
          <Ionicons name="sync-outline" size={22} color="#000000" />
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowLabel}>Sincronizzazione completa</Text>
            <Text style={styles.rowHint}>Esporta task e importa eventi in un unico step</Text>
          </View>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color="#000000" />
        ) : (
          <Ionicons name="chevron-forward" size={18} color="#c7c7cc" />
        )}
      </TouchableOpacity>

      {/* Account */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.sectionDescription}>
          Gestisci la connessione al tuo account Google.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.row, isLoading && styles.rowDisabled]}
        onPress={handleDisconnect}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <View style={styles.rowLeft}>
          <Ionicons name="log-out-outline" size={22} color="#dc3545" />
          <View style={styles.rowTextWrap}>
            <Text style={[styles.rowLabel, styles.destructiveText]}>Disconnetti account</Text>
            <Text style={styles.rowHint}>I tuoi task esistenti non verranno eliminati</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );

  const renderNotConnectedView = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Hero section */}
      <View style={styles.heroSection}>
        <Ionicons name="calendar-outline" size={56} color="#000000" />
        <Text style={styles.heroTitle}>Collega Google Calendar</Text>
        <Text style={styles.heroDescription}>
          Sincronizza automaticamente i tuoi task con Google Calendar e importa i tuoi eventi come nuovi task.
        </Text>
      </View>

      {/* Connect button */}
      <View style={styles.connectButtonContainer}>
        <TouchableOpacity
          style={[styles.connectButton, isLoading && styles.connectButtonDisabled]}
          onPress={handleConnect}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#ffffff" />
              <Text style={styles.connectButtonText}>Connetti con Google</Text>
            </>
          )}
        </TouchableOpacity>
        {isLoading && (
          <Text style={styles.connectingHint}>
            Apertura browser per l'autorizzazione…
          </Text>
        )}
      </View>

      {/* Funzionalità */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Funzionalità</Text>
        <Text style={styles.sectionDescription}>
          Scopri cosa puoi fare con Google Calendar integrato.
        </Text>
      </View>

      <View style={styles.infoItem}>
        <Ionicons name="sync-outline" size={20} color="#000000" />
        <Text style={styles.infoItemText}>
          <Text style={{ fontWeight: '500' }}>Sincronizzazione automatica</Text>
          {' — '}Task e eventi sempre aggiornati
        </Text>
      </View>

      <View style={styles.infoItem}>
        <Ionicons name="create-outline" size={20} color="#000000" />
        <Text style={styles.infoItemText}>
          <Text style={{ fontWeight: '500' }}>Crea task da eventi</Text>
          {' — '}Importa impegni dal tuo calendario
        </Text>
      </View>

      <View style={styles.infoItem}>
        <Ionicons name="notifications-outline" size={20} color="#000000" />
        <Text style={styles.infoItemText}>
          <Text style={{ fontWeight: '500' }}>Promemoria intelligenti</Text>
          {' — '}Non perdere nessuna scadenza
        </Text>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.wipBanner}>
        <Ionicons name="flask-outline" size={15} color="#FF9800" />
        <Text style={styles.wipText}>Funzionalità in Beta — potrebbero verificarsi problemi</Text>
      </View>

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
  },
  wipBanner: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
    gap: 8,
  },
  wipText: {
    fontSize: 13,
    color: '#FF9800',
    fontWeight: '600',
    fontFamily: 'System',
  },
  // Section header (coerente con NotificationSettings)
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'System',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    fontFamily: 'System',
  },
  // Toggle / action row (coerente con NotificationSettings)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  rowTextWrap: {
    marginLeft: 15,
    flex: 1,
  },
  rowLabel: {
    fontSize: 17,
    color: '#000000',
    fontWeight: '400',
    fontFamily: 'System',
  },
  rowHint: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
    fontFamily: 'System',
  },
  destructiveText: {
    color: '#dc3545',
  },
  // Connected: status section
  statusSection: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  statusDescription: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'System',
  },
  statsText: {
    fontSize: 14,
    color: '#000000',
    marginTop: 12,
    fontFamily: 'System',
    fontWeight: '500',
  },
  // Not-connected: hero section
  heroSection: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  heroDescription: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'System',
  },
  // Connect button
  connectButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    alignItems: 'center',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    gap: 10,
  },
  connectButtonDisabled: {
    backgroundColor: '#495057',
  },
  connectButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: 'System',
  },
  connectingHint: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 10,
    fontFamily: 'System',
  },
  // Info list (coerente con NotificationSettings)
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoItemText: {
    fontSize: 15,
    color: '#495057',
    marginLeft: 15,
    flex: 1,
    fontFamily: 'System',
    lineHeight: 20,
  },
});
