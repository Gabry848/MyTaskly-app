import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import VoiceChatModal from './VoiceChatModal';

/**
 * Componente di esempio per testare il VoiceChatModal
 * Questo file dimostra come utilizzare la chat vocale nell'applicazione
 */
export const VoiceChatExample: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleOpenVoiceChat = () => {
    setModalVisible(true);
  };

  const handleCloseVoiceChat = () => {
    setModalVisible(false);
  };

  const handleVoiceResponse = (response: string) => {
    console.log('Risposta vocale ricevuta:', response);
    // Qui potresti aggiornare lo stato dell'app o mostrare la risposta in un'altra parte dell'UI
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Chat Vocale MyTaskly</Text>
        <Text style={styles.description}>
          Premi il pulsante qui sotto per aprire la chat vocale e iniziare a parlare con l'assistente.
        </Text>
        
        <TouchableOpacity
          style={styles.voiceButton}
          onPress={handleOpenVoiceChat}
          activeOpacity={0.8}
        >
          <MaterialIcons name="mic" size={32} color="#fff" />
          <Text style={styles.buttonText}>Avvia Chat Vocale</Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Funzionalità implementate:</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>WebSocket connection per comunicazione real-time</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Registrazione audio con microfono</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Conversione audio in base64 per invio</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Riproduzione risposte audio del bot</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Gestione stati (idle, recording, processing, speaking)</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Controlli pause/resume/cancel</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Riconnessione automatica</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>UI animata e responsiva</Text>
            </View>
          </View>
        </View>

        <View style={styles.techStack}>
          <Text style={styles.techTitle}>Stack tecnologico:</Text>
          <Text style={styles.techText}>• WebSocket per comunicazione bidirezionale</Text>
          <Text style={styles.techText}>• Expo AV per registrazione e riproduzione audio</Text>
          <Text style={styles.techText}>• React Native Reanimated per animazioni</Text>
          <Text style={styles.techText}>• Custom hooks per gestione stato</Text>
          <Text style={styles.techText}>• TypeScript per type safety</Text>
        </View>
      </View>

      <VoiceChatModal
        visible={modalVisible}
        onClose={handleCloseVoiceChat}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
    lineHeight: 24,
  },
  voiceButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  featureList: {
    marginLeft: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  techStack: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  techTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  techText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    marginLeft: 8,
  },
});

export default VoiceChatExample;
