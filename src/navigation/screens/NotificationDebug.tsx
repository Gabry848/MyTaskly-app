import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationManager } from '../../../components/NotificationManager';
import { sendTestNotification, getAllScheduledNotifications } from '../../services/notificationService';
import { useTaskNotifications } from '../../services/taskNotificationService';

export default function NotificationDebugScreen() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  const { scheduleTaskNotification } = useTaskNotifications();

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleSendTestNotification = async () => {
    setIsLoading(true);
    try {
      const success = await sendTestNotification();
      if (success) {
        Alert.alert('✅ Successo', 'Notifica di test inviata con successo!');
      } else {
        Alert.alert('❌ Errore', 'Impossibile inviare la notifica di test. Controlla la connessione al server.');
      }
    } catch {
      Alert.alert('❌ Errore', 'Si è verificato un errore durante l\'invio della notifica.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleTestTaskNotification = async () => {
    setIsLoading(true);
    try {
      // Crea un task di esempio che scade tra 2 minuti
      const testTask = {
        id: 'test-task-123',
        title: 'Task di Test',
        description: 'Questo è un task di test per le notifiche',
        status: 'pending',
        end_time: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minuti da ora
      };

      const notificationId = await scheduleTaskNotification(testTask);
      if (notificationId) {
        Alert.alert(
          '✅ Successo', 
          'Notifica di test programmata! Riceverai una notifica tra circa 1 minuto (1 ora prima della "scadenza" del task di test).'
        );
        updateScheduledCount();
      } else {
        Alert.alert('❌ Errore', 'Impossibile programmare la notifica di test.');
      }
    } catch {
      Alert.alert('❌ Errore', 'Si è verificato un errore durante la programmazione della notifica.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateScheduledCount = async () => {
    try {
      const notifications = await getAllScheduledNotifications();
      setScheduledCount(notifications.length);
    } catch (error) {
      console.error('Errore nel conteggio notifiche:', error);
    }
  };

  // Aggiorna il conteggio quando la schermata si carica
  useEffect(() => {
    updateScheduledCount();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>Debug Notifiche</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Informazioni */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>ℹ️ Informazioni</Text>
          <Text style={styles.infoText}>
            Questa schermata ti permette di testare e debuggare il sistema di notifiche push.
            {'\n\n'}
            📱 <Text style={styles.bold}>Requisiti:</Text>
            {'\n'}• Dispositivo fisico (le notifiche non funzionano su simulatore)
            {'\n'}• Connessione al backend attiva
            {'\n'}• Permessi notifiche concessi
            {'\n\n'}
            🔧 <Text style={styles.bold}>Come testare:</Text>
            {'\n'}1. Verifica che il token Expo sia visualizzato qui sotto
            {'\n'}2. Premi &quot;Test Notifica&quot; per inviare una notifica di prova
            {'\n'}3. Controlla che la notifica arrivi correttamente
          </Text>
        </View>

        {/* Test rapido */}
        <View style={styles.testSection}>
          <Text style={styles.sectionTitle}>🧪 Test Rapido</Text>
          
          <TouchableOpacity 
            style={[styles.testButton, isLoading && styles.testButtonDisabled]} 
            onPress={handleSendTestNotification}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>
              {isLoading ? '⏳ Invio in corso...' : '🚀 Invia Notifica di Test (Remote)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.testButton, { backgroundColor: '#4CAF50', marginTop: 10 }, isLoading && styles.testButtonDisabled]} 
            onPress={handleScheduleTestTaskNotification}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>
              {isLoading ? '⏳ Programmazione...' : '📅 Programma Notifica Task (Locale)'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.infoSmall}>
            📊 Notifiche programmate: {scheduledCount}
          </Text>
        </View>

        {/* Manager completo */}
        <NotificationManager showDebugInfo={true} />

        {/* Istruzioni aggiuntive */}
        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>📋 Risoluzione Problemi</Text>
          <Text style={styles.instructionText}>
            <Text style={styles.bold}>❌ Token non visualizzato:</Text>
            {'\n'}• Controlla i permessi notifiche nelle impostazioni del dispositivo
            {'\n'}• Riavvia l&apos;app
            {'\n\n'}
            <Text style={styles.bold}>❌ Notifica non ricevuta:</Text>
            {'\n'}• Verifica la connessione al backend
            {'\n'}• Controlla che il backend supporti l&apos;endpoint /notifications/test-notification
            {'\n'}• Assicurati di essere su un dispositivo fisico
            {'\n\n'}
            <Text style={styles.bold}>❌ Errore di invio:</Text>
            {'\n'}• Controlla i log della console per dettagli
            {'\n'}• Verifica l&apos;autenticazione con il backend
          </Text>
        </View>
      </ScrollView>
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
    fontSize: 28,
    fontWeight: '300',
    color: '#000000',
    fontFamily: 'System',
    letterSpacing: -1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  testSection: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionsSection: {
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonDisabled: {
    backgroundColor: '#bbbbbb',
  },
  testButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  infoSmall: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
