import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useNotifications, registerForPushNotificationsAsync } from '../src/services/notificationService';

interface NotificationManagerProps {
  showDebugInfo?: boolean;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ 
  showDebugInfo = false 
}) => {
  const { expoPushToken, notification, sendTestNotification } = useNotifications();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const getDebugInfo = async () => {
      const permissions = await Notifications.getPermissionsAsync();
      const isExpoGo = Constants.appOwnership === 'expo';
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      setDebugInfo({
        isDevice: Device.isDevice,
        permissions: permissions.status,
        isExpoGo,
        projectId: projectId ? 'Presente' : 'Mancante',
        appOwnership: Constants.appOwnership,
        executionEnvironment: Constants.executionEnvironment
      });
    };
    
    if (showDebugInfo) {
      getDebugInfo();
    }
  }, [showDebugInfo]);

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (success) {
      Alert.alert('✅ Successo', 'Notifica di test inviata!');
    } else {
      Alert.alert('❌ Errore', 'Impossibile inviare la notifica di test');
    }
  };

  const handleManualTokenRequest = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        Alert.alert('Token Ottenuto!', `Token: ${token.substring(0, 50)}...`);
      } else {
        Alert.alert('Errore', 'Token non ottenuto. Controlla i permessi e la configurazione.');
      }
    } catch (error) {
      Alert.alert('Errore', `Errore: ${error}`);
    }
  };

  if (!showDebugInfo) {
    return null; // Componente invisibile in produzione
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📱 Gestione Notifiche</Text>
      
      {/* Informazioni di debug */}
      {showDebugInfo && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>🔍 Info Sistema:</Text>
          <Text style={styles.debugText}>• Device fisico: {debugInfo.isDevice ? '✅' : '❌'}</Text>
          <Text style={styles.debugText}>• Expo Go: {debugInfo.isExpoGo ? '✅' : '❌'}</Text>
          <Text style={styles.debugText}>• Permessi: {debugInfo.permissions || 'N/A'}</Text>
          <Text style={styles.debugText}>• Project ID: {debugInfo.projectId || 'N/A'}</Text>
          <Text style={styles.debugText}>• App Owner: {debugInfo.appOwnership || 'N/A'}</Text>
        </View>
      )}
      
      {/* Mostra il token */}
      <View style={styles.tokenContainer}>
        <Text style={styles.tokenLabel}>🎯 Expo Push Token:</Text>
        {expoPushToken ? (
          <Text style={styles.tokenText} numberOfLines={3}>
            ✅ {expoPushToken}
          </Text>
        ) : (
          <View>
            <Text style={styles.noTokenText}>❌ Token non disponibile</Text>
            {showDebugInfo && (
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={handleManualTokenRequest}
              >
                <Text style={styles.retryButtonText}>🔄 Riprova Ottenere Token</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

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
  debugContainer: {
    backgroundColor: '#e8f4fd',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b3d9ff',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0066cc',
  },
  debugText: {
    fontSize: 12,
    color: '#0066cc',
    marginBottom: 2,
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
    color: '#00aa00',
  },
  noTokenText: {
    fontSize: 12,
    color: '#cc0000',
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#ff9800',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
