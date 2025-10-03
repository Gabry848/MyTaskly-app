import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useVoiceChat, VoiceChatState } from '../src/hooks/useVoiceChat';
import { formatDuration, AUDIO_LEVEL_CONFIG } from '../src/utils/audioUtils';

interface VoiceChatModalProps {
  visible: boolean;
  onClose: () => void;
  isRecording?: boolean;
  onVoiceResponse?: (response: string) => void;
}

const { height } = Dimensions.get("window");

const VoiceChatModal: React.FC<VoiceChatModalProps> = ({
  visible,
  onClose,
  isRecording: externalIsRecording = false,
  onVoiceResponse,
}) => {
  // Hook personalizzato per gestire la chat vocale
  const {
    state,
    error,
    serverStatus,
    recordingDuration,
    hasPermissions,
    chunksReceived,
    isConnected,
    isRecording,
    isProcessing,
    isSpeaking,
    canRecord,
    canStop,
    vadEnabled,
    audioLevel,
    isSpeechActive,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    cancelRecording,
    stopPlayback,
    sendControl,
    requestPermissions,
    toggleVAD,
  } = useVoiceChat();

  // Animazioni esistenti
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.3)).current;
  const slideIn = useRef(new Animated.Value(height)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const recordingScale = useRef(new Animated.Value(1)).current;

  // Animazione di entrata del modal
  useEffect(() => {
    if (visible) {
      // Reset delle animazioni
      slideIn.setValue(height);
      fadeIn.setValue(0);

      // Animazione di entrata
      Animated.parallel([
        Animated.timing(slideIn, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideIn, fadeIn]);

  // Auto-connessione quando il modal si apre
  useEffect(() => {
    if (visible && state === 'idle') {
      handleConnect();
    }
  }, [visible]);

  // Cleanup quando il modal si chiude
  useEffect(() => {
    if (!visible) {
      if (isRecording) {
        cancelRecording();
      }
      if (isSpeaking) {
        stopPlayback();
      }
      disconnect();
    }
  }, [visible]);

  // Animazione del cerchio pulsante
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    if (visible) {
      pulseAnimation.start();
    }

    return () => {
      pulseAnimation.stop();
    };
  }, [visible, pulseScale, pulseOpacity]);

  // Animazione durante la registrazione
  useEffect(() => {
    if (isRecording) {
      const recordingAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(recordingScale, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(recordingScale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      recordingAnimation.start();

      return () => {
        recordingAnimation.stop();
      };
    } else {
      recordingScale.setValue(1);
    }
  }, [isRecording, recordingScale]);

  // Gestione connessione
  const handleConnect = async () => {
    if (!hasPermissions) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permessi Richiesti',
          'La chat vocale richiede l\'accesso al microfono per funzionare.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
    }
    
    await connect();
  };

  // Gestione stop manuale (la registrazione ora parte automaticamente)
  const handleManualStop = async () => {
    if (isRecording) {
      await stopRecording();
    }
  };

  const handleClose = () => {
    // Cleanup prima della chiusura
    if (isRecording) {
      cancelRecording();
    }
    if (isSpeaking) {
      stopPlayback();
    }
    disconnect();

    // Animazione di uscita
    Animated.parallel([
      Animated.timing(slideIn, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeIn, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Gestione errori
  const handleErrorDismiss = () => {
    if (state === 'error') {
      handleConnect();
    }
  };

  // Render dello stato
  const renderStateIndicator = () => {
    const getStateInfo = (currentState: VoiceChatState) => {
      switch (currentState) {
        case 'idle':
          return { icon: 'mic-off', color: '#666', text: 'Inattivo' };
        case 'connecting':
          return { icon: 'wifi', color: '#FFA500', text: 'Connessione...' };
        case 'connected':
          return { icon: 'mic', color: '#4CAF50', text: 'Pronto' };
        case 'recording':
          return { icon: 'fiber-manual-record', color: '#F44336', text: 'Registrando...' };
        case 'processing':
          return { icon: 'sync', color: '#2196F3', text: 'Elaborazione...' };
        case 'speaking':
          return { icon: 'volume-up', color: '#9C27B0', text: 'Riproduzione streaming...' };
        case 'error':
          return { icon: 'error', color: '#F44336', text: 'Errore' };
        case 'disconnected':
          return { icon: 'wifi-off', color: '#666', text: 'Disconnesso' };
        default:
          return { icon: 'help', color: '#666', text: 'Sconosciuto' };
      }
    };

    const { icon, color, text } = getStateInfo(state);

    return (
      <View style={styles.stateContainer}>
        <MaterialIcons name={icon as any} size={18} color={color} />
        <Text style={[styles.stateText, { color }]}>{text}</Text>
      </View>
    );
  };

  // Render del pulsante principale (semplificato)
  const renderMainButton = () => {
    if (state === 'connecting' || isProcessing) {
      return (
        <Animated.View style={[
          styles.microphoneCircle,
          styles.microphoneCircleProcessing,
          { transform: [{ scale: recordingScale }] }
        ]}>
          <ActivityIndicator size="large" color="#fff" />
        </Animated.View>
      );
    }

    if (!isConnected && state !== 'error') {
      return (
        <Animated.View style={[
          styles.microphoneCircle,
          { transform: [{ scale: recordingScale }] }
        ]}>
          <TouchableOpacity
            style={styles.microphoneButton}
            onPress={handleConnect}
            activeOpacity={0.8}
          >
            <MaterialIcons name="wifi" size={48} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>
      );
    }

    if (state === 'error') {
      return (
        <Animated.View style={[
          styles.microphoneCircle,
          styles.microphoneCircleRecording,
          { transform: [{ scale: recordingScale }] }
        ]}>
          <TouchableOpacity
            style={styles.microphoneButton}
            onPress={handleErrorDismiss}
            activeOpacity={0.8}
          >
            <MaterialIcons name="refresh" size={48} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>
      );
    }

    // Pulsante per stop manuale quando sta registrando
    if (isRecording) {
      return (
        <Animated.View style={[
          styles.microphoneCircle,
          styles.microphoneCircleRecording,
          { transform: [{ scale: recordingScale }] }
        ]}>
          <TouchableOpacity
            style={styles.microphoneButton}
            onPress={handleManualStop}
            activeOpacity={0.8}
          >
            <Ionicons name="stop" size={48} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>
      );
    }

    // Icona microfono quando è in ascolto (non cliccabile, registrazione automatica)
    return (
      <Animated.View style={[
        styles.microphoneCircle,
        { transform: [{ scale: recordingScale }] }
      ]}>
        <Ionicons name="mic" size={48} color="#ffffff" />
      </Animated.View>
    );
  };

  // VAD è sempre attivo, non serve più il toggle

  // Render audio level indicator
  const renderAudioLevel = () => {
    if (!isRecording) {
      return null;
    }

    // Normalizza dB usando il range corretto (da -80 dB silenzio a -10 dB voce forte)
    const normalizedLevel = Math.max(0, Math.min(100,
      ((audioLevel - AUDIO_LEVEL_CONFIG.MIN_DB) / (AUDIO_LEVEL_CONFIG.MAX_DB - AUDIO_LEVEL_CONFIG.MIN_DB)) * 100
    ));

    return (
      <View style={styles.audioLevelContainer}>
        <View style={styles.audioLevelBar}>
          <View
            style={[
              styles.audioLevelFill,
              {
                width: `${normalizedLevel}%`,
                backgroundColor: isSpeechActive ? "#4CAF50" : "#666",
              },
            ]}
          />
        </View>
        <Text style={styles.audioLevelText}>
          {isSpeechActive ? "🎤 Voce rilevata" : "⏸️ In attesa..."}
        </Text>
      </View>
    );
  };

  // Render dei controlli aggiuntivi
  const renderControls = () => {
    if (!isConnected || state === 'error') {
      return null;
    }

    return (
      <View style={styles.controlsContainer}>
        {isSpeaking && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={stopPlayback}
          >
            <MaterialIcons name="stop" size={24} color="#666" />
            <Text style={styles.controlText}>Stop</Text>
          </TouchableOpacity>
        )}

        {(isProcessing || isSpeaking) && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => sendControl('cancel')}
          >
            <MaterialIcons name="cancel" size={24} color="#666" />
            <Text style={styles.controlText}>Annulla</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render informazioni server
  const renderServerStatus = () => {
    if (!serverStatus) return null;

    return (
      <View style={styles.serverStatusContainer}>
        <Text style={styles.serverStatusPhase}>
          {serverStatus.phase.replace('_', ' ').toUpperCase()}
        </Text>
        <Text style={styles.serverStatusMessage}>
          {serverStatus.message}
        </Text>
        {serverStatus.phase === 'audio_streaming' && chunksReceived > 0 && (
          <Text style={styles.serverStatusMessage}>
            Chunks ricevuti: {chunksReceived}
          </Text>
        )}
      </View>
    );
  };

  // Render durata registrazione
  const renderRecordingDuration = () => {
    if (!isRecording || recordingDuration === 0) return null;

    return (
      <View style={styles.durationContainer}>
        <MaterialIcons name="access-time" size={16} color="#F44336" />
        <Text style={styles.durationText}>
          {formatDuration(recordingDuration)}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.8)" />
      
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeIn,
            transform: [{ translateY: slideIn }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Contenuto principale */}
        <View style={styles.content}>
          {/* Titolo */}
          <Text style={styles.title}>Chat Vocale</Text>
          
          {/* Stato e sottotitolo dinamici */}
          {renderStateIndicator()}

          {/* Audio level indicator */}
          {renderAudioLevel()}

          {/* Stato del server */}
          {renderServerStatus()}

          {/* Cerchio animato centrale */}
          <View style={styles.microphoneContainer}>
            {/* Cerchi di pulsazione */}
            <Animated.View
              style={[
                styles.pulseCircle,
                styles.pulseCircle1,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.pulseCircle,
                styles.pulseCircle2,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            />

            {/* Pulsante principale */}
            {renderMainButton()}
          </View>

          {/* Durata registrazione */}
          {renderRecordingDuration()}
          
          {/* Controlli aggiuntivi */}
          {renderControls()}

          {/* Messaggio di errore */}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color="#F44336" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Footer con istruzioni */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Parla chiaramente. La registrazione si fermerà automaticamente.
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    justifyContent: "space-between",
  },
  header: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "flex-end",
  },
  closeButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "300",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
    fontFamily: "System",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "400",
    color: "#cccccc",
    textAlign: "center",
    marginBottom: 80,
    fontFamily: "System",
  },
  microphoneContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 60,
  },
  pulseCircle: {
    position: "absolute",
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  pulseCircle1: {
    width: 200,
    height: 200,
  },
  pulseCircle2: {
    width: 250,
    height: 250,
  },
  microphoneCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  microphoneCircleRecording: {
    backgroundColor: "#ff4444",
    borderColor: "#ff6666",
  },
  microphoneCircleProcessing: {
    backgroundColor: "#4444ff",
    borderColor: "#6666ff",
  },
  microphoneButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 70,
  },
  statusContainer: {
    alignItems: "center",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#bbbbbb",
    textAlign: "center",
    fontFamily: "System",
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 50,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#888888",
    textAlign: "center",
    fontFamily: "System",
  },
  // Nuovi stili per i componenti aggiunti
  stateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
  },
  stateText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "System",
  },
  serverStatusContainer: {
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(33, 150, 243, 0.2)",
    borderRadius: 12,
    minHeight: 40,
    justifyContent: "center",
  },
  serverStatusPhase: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#87CEEB",
    marginBottom: 2,
    fontFamily: "System",
  },
  serverStatusMessage: {
    fontSize: 10,
    color: "#cccccc",
    textAlign: "center",
    fontFamily: "System",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(244, 67, 54, 0.2)",
    borderRadius: 16,
  },
  durationText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B6B",
    fontFamily: "monospace",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  controlButton: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    minWidth: 60,
  },
  controlText: {
    marginTop: 4,
    fontSize: 11,
    color: "#cccccc",
    fontWeight: "500",
    fontFamily: "System",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(244, 67, 54, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    maxWidth: "90%",
  },
  errorText: {
    marginLeft: 8,
    color: "#FF6B6B",
    fontSize: 12,
    flex: 1,
    fontFamily: "System",
  },
  // Audio level indicator styles
  audioLevelContainer: {
    width: "80%",
    alignItems: "center",
    marginBottom: 16,
  },
  audioLevelBar: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  audioLevelFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.1s ease-out",
  },
  audioLevelText: {
    fontSize: 11,
    color: "#cccccc",
    fontWeight: "500",
    fontFamily: "System",
  },
});

export default VoiceChatModal;
