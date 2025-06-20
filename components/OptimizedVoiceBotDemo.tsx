import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { useOptimizedVoiceBot, useSimpleVoiceBot } from '../src/hooks/useOptimizedVoiceBot';

/**
 * Componente di esempio che dimostra l'uso del bot vocale ottimizzato
 */
export function OptimizedVoiceBotDemo() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<"base" | "advanced">("advanced");

  // Hook avanzato per controllo completo
  const {
    sendOptimizedVoiceMessage,
    comparePerformance,
    stopStreaming,
    resetStates,
    isProcessing,
    currentResponse,
    streamingProgress,
    audioChunksReceived,
    lastError,
    performanceStats,
    realtimeStats,
    hasError,
    isStreamingActive,
    progressPercentage
  } = useOptimizedVoiceBot();

  // Hook semplificato per uso base
  const simpleBot = useSimpleVoiceBot();

  /**
   * Avvia registrazione audio
   */
  const startRecording = async () => {
    try {
      console.log('🎤 Avvio registrazione...');
      
      // Richiedi permessi
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Errore', 'Permessi audio necessari');
        return;
      }

      // Configura audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Avvia registrazione
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
   * Invia messaggio con modalità ottimizzata
   */
  const sendOptimizedMessage = async () => {
    if (!audioUri) {
      Alert.alert('Errore', 'Nessuna registrazione disponibile');
      return;
    }

    try {
      await sendOptimizedVoiceMessage(audioUri, selectedMode, true);
    } catch (error) {
      console.error('❌ Errore invio ottimizzato:', error);
    }
  };

  /**
   * Invia messaggio con hook semplificato
   */
  const sendSimpleMessage = async (useStreaming: boolean) => {
    if (!audioUri) {
      Alert.alert('Errore', 'Nessuna registrazione disponibile');
      return;
    }

    await simpleBot.sendVoiceMessage(audioUri, useStreaming);
  };

  /**
   * Confronta performance
   */
  const runPerformanceTest = async () => {
    if (!audioUri) {
      Alert.alert('Errore', 'Nessuna registrazione disponibile');
      return;
    }

    try {
      const results = await comparePerformance(audioUri);
      
      Alert.alert(
        'Risultati Performance',
        `Base: ${results.base.time}ms\n` +
        `Advanced: ${results.advanced.time}ms\n` +
        `Miglioramento: ${results.improvement.toFixed(1)}%`
      );
    } catch (error) {
      console.error('❌ Errore test performance:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🚀 Bot Vocale Ottimizzato</Text>
      
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

      {/* === SEZIONE MODALITÀ === */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Modalità Bot</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              selectedMode === "base" ? styles.buttonSelected : styles.buttonSecondary
            ]}
            onPress={() => setSelectedMode("base")}
          >
            <Text style={styles.buttonText}>📤 Base</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.button,
              selectedMode === "advanced" ? styles.buttonSelected : styles.buttonSecondary
            ]}
            onPress={() => setSelectedMode("advanced")}
          >
            <Text style={styles.buttonText}>🚀 Advanced</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.modeDescription}>
          {selectedMode === "base" 
            ? "Upload completo del file (più stabile)"
            : "Streaming con latenza ridotta (più veloce)"
          }
        </Text>
      </View>

      {/* === SEZIONE CONTROLLI === */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎛️ Controlli</Text>
        
        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonPrimary,
            (!audioUri || isProcessing) && styles.buttonDisabled
          ]}
          onPress={sendOptimizedMessage}
          disabled={!audioUri || isProcessing}
        >
          <Text style={styles.buttonText}>
            {isProcessing ? '⏳ Elaborando...' : '🚀 Invia Ottimizzato'}
          </Text>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => sendSimpleMessage(false)}
            disabled={!audioUri || simpleBot.isLoading}
          >
            <Text style={styles.buttonText}>📤 Simple Base</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => sendSimpleMessage(true)}
            disabled={!audioUri || simpleBot.isLoading}
          >
            <Text style={styles.buttonText}>🚀 Simple Stream</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonWarning]}
            onPress={runPerformanceTest}
            disabled={!audioUri || isProcessing}
          >
            <Text style={styles.buttonText}>📊 Test Performance</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.buttonDanger]}
            onPress={stopStreaming}
            disabled={!isStreamingActive}
          >
            <Text style={styles.buttonText}>🛑 Stop Stream</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={resetStates}
        >
          <Text style={styles.buttonText}>🔄 Reset</Text>
        </TouchableOpacity>
      </View>

      {/* === SEZIONE STATI REAL-TIME === */}
      {isStreamingActive && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Streaming Real-Time</Text>
          
          <View style={styles.statsContainer}>
            <Text style={styles.stat}>⏱️ Tempo: {realtimeStats.elapsedTime}ms</Text>
            <Text style={styles.stat}>📝 Chunk testo: {realtimeStats.textChunksReceived}</Text>
            <Text style={styles.stat}>🎵 Chunk audio: {realtimeStats.audioChunksReceived}</Text>
            <Text style={styles.stat}>⚡ Media/chunk: {realtimeStats.averageChunkTime.toFixed(0)}ms</Text>
          </View>
          
          {streamingProgress && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressTitle}>📝 Progresso streaming:</Text>
              <Text style={styles.progressText}>{streamingProgress}</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progressPercentage}%` }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>
      )}

      {/* === SEZIONE RISPOSTE === */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💬 Risposte</Text>
        
        {/* Risposta hook avanzato */}
        {currentResponse && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseTitle}>🚀 Risposta Ottimizzata:</Text>
            <Text style={styles.responseText}>{currentResponse}</Text>
          </View>
        )}
        
        {/* Risposta hook semplice */}
        {simpleBot.response && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseTitle}>📱 Risposta Semplice:</Text>
            <Text style={styles.responseText}>{simpleBot.response}</Text>
          </View>
        )}
        
        {/* Errori */}
        {hasError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>❌ Errore Hook Avanzato:</Text>
            <Text style={styles.errorText}>{lastError}</Text>
          </View>
        )}
        
        {simpleBot.hasError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>❌ Errore Hook Semplice:</Text>
            <Text style={styles.errorText}>{simpleBot.error}</Text>
          </View>
        )}
      </View>

      {/* === SEZIONE STATISTICHE === */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Statistiche Performance</Text>
        
        <View style={styles.statsContainer}>
          <Text style={styles.stat}>⏱️ Durata ultima richiesta: {performanceStats.duration}ms</Text>
          <Text style={styles.stat}>🎯 Modalità: {performanceStats.streamingMode ? 'Streaming' : 'Upload'}</Text>
          <Text style={styles.stat}>📦 Chunk ricevuti: {performanceStats.chunksReceived}</Text>
          <Text style={styles.stat}>🎵 Audio chunks: {audioChunksReceived}</Text>
        </View>
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
  buttonSelected: {
    backgroundColor: '#34C759',
  },
  buttonRecording: {
    backgroundColor: '#FF3B30',
  },
  buttonWarning: {
    backgroundColor: '#FF9500',
  },
  buttonDanger: {
    backgroundColor: '#FF3B30',
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
  modeDescription: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  statsContainer: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 6,
  },
  stat: {
    fontSize: 14,
    color: '#333',
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
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
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
});

export default OptimizedVoiceBotDemo;
