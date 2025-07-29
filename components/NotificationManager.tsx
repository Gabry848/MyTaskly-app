import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNotifications } from '../src/services/notificationService';

interface NotificationManagerProps {
  showDebugInfo?: boolean;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ 
  showDebugInfo = false 
}) => {
  const { expoPushToken, notification, sendTestNotification } = useNotifications();

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (success) {
      Alert.alert('✅ Successo', 'Notifica di test inviata!');
    } else {
      Alert.alert('❌ Errore', 'Impossibile inviare la notifica di test');
    }
  };

  if (!showDebugInfo) {
    return null; // Componente invisibile in produzione
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📱 Gestione Notifiche</Text>
      
      {/* Mostra il token solo in modalità debug */}
      {expoPushToken && (
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenLabel}>Expo Push Token:</Text>
          <Text style={styles.tokenText} numberOfLines={3}>
            {expoPushToken}
          </Text>
        </View>
      )}

      {/* Mostra l'ultima notifica ricevuta */}
      {notification && (
        <View style={styles.notificationContainer}>
          <Text style={styles.notificationLabel}>📨 Ultima Notifica:</Text>
          <Text style={styles.notificationTitle}>
            📋 {notification.request.content.title}
          </Text>
          <Text style={styles.notificationBody}>
            💬 {notification.request.content.body}
          </Text>
        </View>
      )}

      {/* Pulsante per testare le notifiche */}
      <TouchableOpacity 
        style={styles.testButton} 
        onPress={handleTestNotification}
      >
        <Text style={styles.testButtonText}>🧪 Invia Test Notifica</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  tokenContainer: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  tokenLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  notificationContainer: {
    backgroundColor: '#e6f3ff',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  notificationLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notificationTitle: {
    marginBottom: 2,
  },
  notificationBody: {
    color: '#666',
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
