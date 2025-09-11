import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, StatusBar, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function GoogleCalendar() {
  const navigation = useNavigation();
  const [isConnected, setIsConnected] = useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleConnect = () => {
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  const renderConnectedView = () => (
    <View style={styles.contentContainer}>
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        <Text style={styles.successTitle}>Google Calendar Connesso</Text>
        <Text style={styles.successDescription}>
          Il tuo account Google Calendar è stato collegato con successo. 
          I tuoi eventi verranno sincronizzati automaticamente.
        </Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Sincronizzazione</Text>
        <Text style={styles.infoDescription}>
          • Gli eventi vengono sincronizzati ogni 15 minuti
        </Text>
        <Text style={styles.infoDescription}>
          • I nuovi task possono essere creati dai tuoi eventi
        </Text>
        <Text style={styles.infoDescription}>
          • Le modifiche vengono aggiornate in tempo reale
        </Text>
      </View>

      <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
        <Text style={styles.disconnectButtonText}>Disconnetti Account</Text>
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

      <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
        <Ionicons name="logo-google" size={20} color="#ffffff" />
        <Text style={styles.connectButtonText}>Connetti Google Calendar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
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
    borderWidth: 1,
    borderColor: '#FF5722',
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
});