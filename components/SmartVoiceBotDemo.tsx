import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { useOptimizedVoiceBot } from '../src/hooks/useOptimizedVoiceBot';
import { 
  sendVoiceMessageWithSmartHandling,
  diagnoseVoiceBotIssues 
} from '../src/services/botservice';

/**
 * Componente di esempio che dimostra la gestione intelligente degli errori
 * del bot vocale con diagnostica automatica e retry
 */
export function SmartVoiceBotDemo() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);

  // Hook per gestione avanzata
  const {
    sendSmartVoiceMessage,
    runDiagnostics,
    isProcessing,
    currentResponse,
    streamingProgress,
    lastError,
    hasError
  } = useOptimizedVoiceBot();

  /**
   * Avvia registrazione audio
   */
  const startRecording = async () => {
    try {
      console.log('🎤 Avvio registrazione...');
      
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Errore', 'Permessi audio necessari');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      console.log('🎤 Registrazione avviata');

    } catch (error) {
      console.error('❌ Errore avvio registrazione:', error);
      Alert.alert('Errore', 'Impossibile avviare la registrazione');
    }
  };

  /**
   * Ferma registrazione audio
   */
  const stopRecording = async () => {
    if (!recording) return;

    try {
      console.log('🛑 Fermo registrazione...');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
      console.log('✅ Registrazione salvata:', uri);
    } catch (error) {
      console.error('❌ Errore stop registrazione:', error);
    }
  };

  /**
   * Invia messaggio con gestione intelligente (hook)
   */
  const sendWithHook = async () => {
    if (!audioUri) {
      Alert.alert('Errore', 'Nessuna registrazione disponibile');
      return;
    }

    const chatHistory = [
      { sender: 'user', text: 'Ciao' },
      { sender: 'bot', text: 'Ciao! Come posso aiutarti?' }
    ];

    await sendSmartVoiceMessage(audioUri, "advanced", chatHistory);
  };

  /**
   * Invia messaggio con gestione intelligente (funzione diretta)
   */
  const sendWithDirectFunction = async () => {
    if (!audioUri) {
      Alert.alert('Errore', 'Nessuna registrazione disponibile');
      return;
    }

    try {
      const result = await sendVoiceMessageWithSmartHandling(audioUri, {
        modelType: "advanced",
        previousMessages: [],
        onProgress: (message) => {
          console.log('📋 Progresso:', message);
          // Qui potresti aggiornare un indicatore di progresso nell'UI
        },
        onChunkReceived: (chunk) => {
          console.log('📝 Chunk:', chunk);
          // Qui potresti aggiornare progressivamente il testo nell'UI
        },
        maxRetries: 3
      });

      if (result.success) {
        Alert.alert('Successo', `Risposta: ${result.response}`);
        console.log('📊 Metadati:', result.metadata);
      } else {
        Alert.alert('Errore', result.response);
        if (result.metadata?.diagnosticInfo) {
          console.log('🔍 Info diagnostiche:', result.metadata.diagnosticInfo);
        }
      }
    } catch (error) {
      console.error('❌ Errore invio diretto:', error);
      Alert.alert('Errore', 'Invio fallito');
    }
  };

  /**
   * Esegui diagnostica del servizio
   */
  const runServiceDiagnostics = async () => {
    if (!audioUri) {
      Alert.alert('Errore', 'Nessuna registrazione per la diagnostica');
      return;
    }

    try {
      // Usando l'hook
      const result = await runDiagnostics(audioUri);
      setDiagnosticResult(result);

      if (result) {
        Alert.alert(
          'Diagnostica Completata',
          `${result.diagnosis}\n\nRaccomandazioni:\n${result.recommendations.join('\n')}`
        );
      }
    } catch (error) {
      console.error('❌ Errore diagnostica:', error);
    }
  };

  /**
   * Esegui diagnostica diretta
   */
  const runDirectDiagnostics = async () => {
    if (!audioUri) {
      Alert.alert('Errore', 'Nessuna registrazione per la diagnostica');
      return;
    }

    try {
      const diagnosis = await diagnoseVoiceBotIssues(audioUri);
      setDiagnosticResult(diagnosis);

      Alert.alert(
        'Diagnostica Diretta',
        `Stato: ${diagnosis.serverStatus}\n` +
        `Diagnosi: ${diagnosis.diagnosis}\n\n` +
        `Raccomandazioni:\n${diagnosis.recommendations.join('\n')}\n\n` +
        `Può ritentare: ${diagnosis.canRetry ? 'Sì' : 'No'}`
      );
    } catch (error) {
      console.error('❌ Errore diagnostica diretta:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧠 Bot Vocale con Gestione Intelligente</Text>
      
      {/* === SEZIONE REGISTRAZIONE === */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📹 Registrazione Audio</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, recording ? styles.buttonRecording : styles.buttonPrimary]}
            onPress={recording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            <Text style={styles.buttonText}>
              {recording ? '🛑 Ferma' : '🎤 Registra'}
            </Text>
          </TouchableOpacity>
          
          {audioUri && (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => setAudioUri(null)}
            >
              <Text style={styles.buttonText}>🗑️ Cancella</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {audioUri && (
          <Text style={styles.info}>✅ Audio registrato pronto per l'invio</Text>
        )}
      </View>

      {/* === SEZIONE INVIO INTELLIGENTE === */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧠 Invio con Gestione Intelligente</Text>
        
        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonPrimary,
            (!audioUri || isProcessing) && styles.buttonDisabled
          ]}
          onPress={sendWithHook}
          disabled={!audioUri || isProcessing}
        >
          <Text style={styles.buttonText}>
            {isProcessing ? '⏳ Elaborando...' : '🧠 Invia con Hook'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonSecondary,
            !audioUri && styles.buttonDisabled
          ]}
          onPress={sendWithDirectFunction}
          disabled={!audioUri}
        >
          <Text style={styles.buttonText}>📤 Invia Diretto</Text>
        </TouchableOpacity>
      </View>

      {/* === SEZIONE DIAGNOSTICA === */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔍 Diagnostica Servizio</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonWarning]}
            onPress={runServiceDiagnostics}
            disabled={!audioUri || isProcessing}
          >
            <Text style={styles.buttonText}>🔍 Diagnostica Hook</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.buttonWarning]}
            onPress={runDirectDiagnostics}
            disabled={!audioUri}
          >
            <Text style={styles.buttonText}>🔬 Diagnostica Diretta</Text>
          </TouchableOpacity>
        </View>

        {diagnosticResult && (
          <View style={styles.diagnosticContainer}>
            <Text style={styles.diagnosticTitle}>🔍 Ultimo Risultato Diagnostica:</Text>
            <Text style={styles.diagnosticText}>
              Stato Server: {diagnosticResult.serverStatus}
            </Text>
            <Text style={styles.diagnosticText}>
              Diagnosi: {diagnosticResult.diagnosis}
            </Text>
            <Text style={styles.diagnosticText}>
              Può Ritentare: {diagnosticResult.canRetry ? 'Sì' : 'No'}
            </Text>
          </View>
        )}
      </View>

      {/* === SEZIONE STATO CORRENTE === */}
      {isProcessing && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏳ Stato Elaborazione</Text>
          
          {streamingProgress && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressTitle}>📝 Progresso:</Text>
              <Text style={styles.progressText}>{streamingProgress}</Text>
            </View>
          )}
        </View>
      )}

      {/* === SEZIONE RISPOSTE === */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💬 Risultati</Text>
        
        {currentResponse && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseTitle}>✅ Ultima Risposta:</Text>
            <Text style={styles.responseText}>{currentResponse}</Text>
          </View>
        )}
        
        {hasError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>❌ Ultimo Errore:</Text>
            <Text style={styles.errorText}>{lastError}</Text>
          </View>
        )}
      </View>

      {/* === SEZIONE INFO === */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ Come Funziona</Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Gestione Intelligente</Text>: Retry automatico con backoff esponenziale{'\n'}
          • <Text style={styles.bold}>Diagnostica Automatica</Text>: Identifica problemi e suggerisce soluzioni{'\n'}
          • <Text style={styles.bold}>Fallback Progressivo</Text>: Advanced → Base → Metodo Originale{'\n'}
          • <Text style={styles.bold}>Analisi Errori</Text>: Distingue rate limit, config, rete{'\n'}
          • <Text style={styles.bold}>Messaggi User-Friendly</Text>: Spiegazioni chiare degli errori
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: '#8E8E93',
  },
  buttonRecording: {
    backgroundColor: '#FF3B30',
  },
  buttonWarning: {
    backgroundColor: '#FF9500',
  },
  buttonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  info: {
    fontSize: 14,
    color: '#34C759',
    textAlign: 'center',
    marginTop: 8,
  },
  diagnosticContainer: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  diagnosticTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  diagnosticText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 4,
  },
  responseContainer: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  responseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C62828',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
});

export default SmartVoiceBotDemo;
