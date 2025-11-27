import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useNotifications, registerForPushNotificationsAsync, sendTokenToBackend } from '../../services/notificationService';

export default function DebugNotifications() {
  const { expoPushToken, notification } = useNotifications();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [manualToken, setManualToken] = useState<string>('');

  useEffect(() => {
    const getDebugInfo = async () => {
      const permissions = await Notifications.getPermissionsAsync();
      const isExpoGo = Constants.appOwnership === 'expo';
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      setDebugInfo({
        isDevice: Device.isDevice,
        deviceType: Device.deviceType,
        permissions: permissions.status,
        isExpoGo,
        projectId,
        appOwnership: Constants.appOwnership,
        executionEnvironment: Constants.executionEnvironment
      });
    };
    
    getDebugInfo();
  }, []);

  const handleManualTokenRequest = async () => {
    console.log('🔍 Richiesta manuale token...');
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setManualToken(token);
        console.log('✅ Token ottenuto manualmente:', token);
        
        // Prova a inviarlo al backend
        const success = await sendTokenToBackend(token);
        Alert.alert(
          'Token ottenuto!', 
          `Token: ${token.substring(0, 50)}...\nInvio al backend: ${success ? 'Successo' : 'Fallito'}`
        );
      } else {
        Alert.alert('Errore', 'Token non ottenuto');
      }
    } catch (error) {
      console.error('❌ Errore token manuale:', error);
      Alert.alert('Errore', `Errore: ${error}`);
    }
  };

  const handleTestNotification = async () => {
    try {
      // Invia notifica locale di test
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🧪 Test Locale",
          body: "Questa è una notifica locale di test",
          data: { test: true },
        },
        trigger: null,
      });
      Alert.alert('Successo', 'Notifica locale inviata!');
    } catch (error) {
      Alert.alert('Errore', `Errore notifica locale: ${error}`);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        🔍 Debug Notifiche Expo
      </Text>
      
      <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>📊 Info Sistema:</Text>
        <Text>• Device fisico: {debugInfo.isDevice ? '✅' : '❌'}</Text>
        <Text>• Device type: {debugInfo.deviceType}</Text>
        <Text>• Expo Go: {debugInfo.isExpoGo ? '✅' : '❌'}</Text>
        <Text>• App Ownership: {debugInfo.appOwnership}</Text>
        <Text>• Execution Env: {debugInfo.executionEnvironment}</Text>
        <Text>• Permessi: {debugInfo.permissions}</Text>
        <Text>• Project ID: {debugInfo.projectId ? '✅' : '❌'}</Text>
      </View>

      <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>🎯 Token Status:</Text>
        <Text>• Hook Token: {expoPushToken ? `${expoPushToken.substring(0, 30)}...` : '❌ Nessuno'}</Text>
        <Text>• Manual Token: {manualToken ? `${manualToken.substring(0, 30)}...` : '❌ Nessuno'}</Text>
      </View>

      <TouchableOpacity 
        style={{ backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginBottom: 10 }}
        onPress={handleManualTokenRequest}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          🔄 Richiedi Token Manualmente
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={{ backgroundColor: '#34C759', padding: 15, borderRadius: 8, marginBottom: 10 }}
        onPress={handleTestNotification}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          🧪 Test Notifica Locale
        </Text>
      </TouchableOpacity>

      {notification && (
        <View style={{ backgroundColor: '#FFF3CD', padding: 15, borderRadius: 8, marginTop: 10 }}>
          <Text style={{ fontWeight: 'bold' }}>📨 Ultima Notifica:</Text>
          <Text>{JSON.stringify(notification.request.content, null, 2)}</Text>
        </View>
      )}
    </ScrollView>
  );
}
