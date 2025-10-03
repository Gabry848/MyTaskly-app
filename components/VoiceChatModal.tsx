import React, { useRef, useEffect } from "react";
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
  const {
    state,
    error,
    hasPermissions,
    isConnected,
    isRecording,
    isProcessing,
    isSpeaking,
    isSpeechActive,
    connect,
    disconnect,
    stopRecording,
    cancelRecording,
    stopPlayback,
    sendControl,
    requestPermissions,
  } = useVoiceChat();

  // Animazioni
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.3)).current;
  const slideIn = useRef(new Animated.Value(height)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const recordingScale = useRef(new Animated.Value(1)).current;

  // Animazione di entrata del modal
  useEffect(() => {
    if (visible) {
      slideIn.setValue(height);
      fadeIn.setValue(0);

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
      if (isRecording) cancelRecording();
      if (isSpeaking) stopPlayback();
      disconnect();
    }
  }, [visible]);

  // Animazione del cerchio pulsante - solo quando in ascolto
  useEffect(() => {
    const shouldAnimate = isRecording && isSpeechActive;

    if (shouldAnimate) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseScale, {
              toValue: 1.15,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseScale, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.4,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    }
  }, [isRecording, isSpeechActive, pulseScale, pulseOpacity]);

  // Animazione durante elaborazione/risposta
  useEffect(() => {
    if (isProcessing || isSpeaking) {
      const thinkingAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(recordingScale, {
            toValue: 1.08,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(recordingScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      thinkingAnimation.start();

      return () => {
        thinkingAnimation.stop();
        recordingScale.setValue(1);
      };
    }
  }, [isProcessing, isSpeaking, recordingScale]);

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

  const handleClose = () => {
    if (isRecording) cancelRecording();
    if (isSpeaking) stopPlayback();
    disconnect();

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

  const handleErrorDismiss = () => {
    if (state === 'error') {
      handleConnect();
    }
  };

  // Render dello stato - versione minimale
  const renderStateIndicator = () => {
    if (state === 'connecting') {
      return <Text style={styles.subtleText}>Connessione in corso...</Text>;
    }

    if (state === 'error') {
      return <Text style={styles.subtleText}>Qualcosa è andato storto</Text>;
    }

    if (isRecording && isSpeechActive) {
      return <Text style={styles.subtleText}>Ti ascolto...</Text>;
    }

    if (isProcessing || isSpeaking) {
      return <Text style={styles.subtleText}>Sto pensando...</Text>;
    }

    if (isConnected && !isRecording) {
      return <Text style={styles.subtleText}>Parla quando vuoi</Text>;
    }

    return null;
  };

  // Render del pulsante principale - versione minimale
  const renderMainButton = () => {
    // Stato: elaborazione o risposta in corso
    if (isProcessing || isSpeaking) {
      return (
        <Animated.View style={[
          styles.microphoneCircle,
          styles.thinkingCircle,
          { transform: [{ scale: recordingScale }] }
        ]}>
          <ActivityIndicator size="large" color="#fff" />
        </Animated.View>
      );
    }

    // Stato: connessione
    if (state === 'connecting') {
      return (
        <Animated.View style={styles.microphoneCircle}>
          <ActivityIndicator size="large" color="#fff" />
        </Animated.View>
      );
    }

    // Stato: errore
    if (state === 'error') {
      return (
        <Animated.View style={styles.microphoneCircle}>
          <TouchableOpacity
            style={styles.microphoneButton}
            onPress={handleErrorDismiss}
            activeOpacity={0.8}
          >
            <MaterialIcons name="refresh" size={52} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>
      );
    }

    // Stato: non connesso
    if (!isConnected) {
      return (
        <Animated.View style={styles.microphoneCircle}>
          <TouchableOpacity
            style={styles.microphoneButton}
            onPress={handleConnect}
            activeOpacity={0.8}
          >
            <MaterialIcons name="wifi" size={52} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>
      );
    }

    // Stato: ascolto attivo con animazione semplice
    const isListening = isRecording && isSpeechActive;

    return (
      <Animated.View style={[
        styles.microphoneCircle,
        isListening && styles.listeningCircle,
      ]}>
        <Ionicons
          name={isListening ? "mic" : "mic-outline"}
          size={56}
          color="#ffffff"
        />
      </Animated.View>
    );
  };

  // Render pulsante di stop durante elaborazione/risposta
  const renderStopButton = () => {
    if (!isProcessing && !isSpeaking) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.stopButton}
        onPress={() => {
          if (isSpeaking) stopPlayback();
          if (isProcessing) sendControl('cancel');
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.stopButtonText}>Interrompi</Text>
      </TouchableOpacity>
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
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.95)" />

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
            <Ionicons name="close" size={26} color="rgba(255, 255, 255, 0.8)" />
          </TouchableOpacity>
        </View>

        {/* Contenuto principale */}
        <View style={styles.content}>
          {/* Titolo minimale */}
          <Text style={styles.title}>Assistente Vocale</Text>

          {/* Messaggio di stato semplice */}
          {renderStateIndicator()}

          {/* Cerchio animato centrale */}
          <View style={styles.microphoneContainer}>
            {/* Cerchi di pulsazione - solo quando in ascolto */}
            {(isRecording && isSpeechActive) && (
              <>
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
              </>
            )}

            {/* Pulsante principale */}
            {renderMainButton()}
          </View>

          {/* Pulsante stop durante elaborazione */}
          {renderStopButton()}

          {/* Messaggio di errore minimalista */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={handleErrorDismiss}>
                <Text style={styles.retryText}>Riprova</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer con istruzioni semplici */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Parla naturalmente
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "space-between",
  },
  header: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 44,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: "flex-end",
  },
  closeButton: {
    padding: 10,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: "200",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 64,
    fontFamily: "System",
    letterSpacing: 0.8,
  },
  subtleText: {
    fontSize: 15,
    fontWeight: "300",
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    marginBottom: 52,
    fontFamily: "System",
  },
  microphoneContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 48,
  },
  pulseCircle: {
    position: "absolute",
    borderRadius: 150,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.4)",
  },
  pulseCircle1: {
    width: 240,
    height: 240,
  },
  pulseCircle2: {
    width: 300,
    height: 300,
  },
  microphoneCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  listeningCircle: {
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    borderColor: "rgba(76, 175, 80, 0.3)",
  },
  thinkingCircle: {
    backgroundColor: "rgba(33, 150, 243, 0.15)",
    borderColor: "rgba(33, 150, 243, 0.3)",
  },
  microphoneButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 80,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 64,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    fontWeight: "300",
    color: "rgba(255, 255, 255, 0.35)",
    textAlign: "center",
    fontFamily: "System",
    letterSpacing: 0.3,
  },
  stopButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 28,
    marginTop: 40,
  },
  stopButtonText: {
    fontSize: 14,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.75)",
    fontFamily: "System",
    letterSpacing: 0.2,
  },
  errorContainer: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 18,
    backgroundColor: "rgba(244, 67, 54, 0.08)",
    borderRadius: 20,
    marginTop: 40,
    maxWidth: "85%",
  },
  errorText: {
    color: "rgba(255, 107, 107, 0.85)",
    fontSize: 13,
    fontWeight: "300",
    textAlign: "center",
    marginBottom: 14,
    fontFamily: "System",
  },
  retryText: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 13,
    fontWeight: "400",
    fontFamily: "System",
  },
});

export default VoiceChatModal;
