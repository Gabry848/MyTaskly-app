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
  Alert,
  Platform
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useVoiceChat } from '../../hooks/useVoiceChat';

export interface VoiceChatModalProps {
  visible: boolean;
  onClose: () => void;
  isRecording?: boolean;
  onVoiceResponse?: (response: string) => void;
}

const { height } = Dimensions.get("window");

const VoiceChatModal: React.FC<VoiceChatModalProps> = ({
  visible,
  onClose,
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
    transcripts,
    activeTools,
    isMuted,
    connect,
    disconnect,
    stopPlayback,
    requestPermissions,
    mute,
    unmute,
  } = useVoiceChat();

  // Animazioni
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.3)).current;
  const slideIn = useRef(new Animated.Value(height)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const recordingScale = useRef(new Animated.Value(1)).current;
  const breathingScale = useRef(new Animated.Value(1)).current;
  const liveDotOpacity = useRef(new Animated.Value(1)).current;

  // Notifica trascrizioni assistant al parent
  useEffect(() => {
    if (onVoiceResponse && transcripts.length > 0) {
      const last = transcripts[transcripts.length - 1];
      if (last.role === 'assistant') {
        onVoiceResponse(last.content);
      }
    }
  }, [transcripts, onVoiceResponse]);

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
      // Usa disconnect che gestisce internamente il cleanup di registrazione e player
      disconnect();
    }
  }, [visible, disconnect]);

  // Animazione del cerchio pulsante - solo quando in ascolto
  useEffect(() => {
    const shouldAnimate = isRecording;

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
  }, [isRecording, pulseScale, pulseOpacity]);

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

  // Breathing animation for idle state
  useEffect(() => {
    const shouldBreathe = isConnected && !isRecording && !isProcessing && !isSpeaking && state === 'ready';

    if (shouldBreathe) {
      const breathingAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(breathingScale, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(breathingScale, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      breathingAnimation.start();

      return () => {
        breathingAnimation.stop();
        breathingScale.setValue(1);
      };
    }
  }, [isConnected, isRecording, isProcessing, isSpeaking, state, breathingScale]);

  // Live dot pulse animation
  useEffect(() => {
    if (isConnected) {
      const dotPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(liveDotOpacity, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(liveDotOpacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      dotPulse.start();

      return () => dotPulse.stop();
    }
  }, [isConnected, liveDotOpacity]);

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

  const handleClose = async () => {
    // Avvia l'animazione di chiusura
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

    // Esegui il cleanup in parallelo all'animazione
    // disconnect gestisce internamente il cleanup di registrazione e player
    await disconnect();
  };

  const handleErrorDismiss = () => {
    if (state === 'error') {
      handleConnect();
    }
  };

  // Render dello stato
  const renderStateIndicator = () => {
    switch (state) {
      case 'connecting':
      case 'authenticating':
        return <Text style={styles.subtleText}>Connessione in corso...</Text>;
      case 'setting_up':
        return <Text style={styles.subtleText}>Preparazione assistente...</Text>;
      case 'error':
        return <Text style={styles.subtleText}>Qualcosa è andato storto</Text>;
      case 'recording':
        return <Text style={styles.subtleText}>Ti ascolto...</Text>;
      case 'processing':
        if (activeTools.some(t => t.status === 'running')) {
          return <Text style={styles.subtleText}>Sto eseguendo azioni...</Text>;
        }
        return <Text style={styles.subtleText}>Sto pensando...</Text>;
      case 'speaking':
        return <Text style={styles.subtleText}>Rispondo...</Text>;
      case 'ready':
        return <Text style={styles.subtleText}>Parla quando vuoi</Text>;
      default:
        return null;
    }
  };

  // Mostra l'ultima trascrizione
  const renderLastTranscript = () => {
    if (transcripts.length === 0) return null;
    const last = transcripts[transcripts.length - 1];
    return (
      <Text style={styles.transcriptText} numberOfLines={3}>
        {last.role === 'user' ? 'Tu: ' : ''}{last.content}
      </Text>
    );
  };

  // Render del pulsante principale
  const renderMainButton = () => {
    // Stato: elaborazione o risposta in corso
    if (isProcessing || isSpeaking) {
      return (
        <Animated.View style={[
          styles.orbContainer,
          { transform: [{ scale: recordingScale }] }
        ]}>
          <LinearGradient
            colors={['#0066FF', '#00CCFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.orbGradient}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
      );
    }

    // Stato: connessione / setup
    if (state === 'connecting' || state === 'authenticating' || state === 'setting_up') {
      return (
        <Animated.View style={styles.orbContainer}>
          <LinearGradient
            colors={['#0066FF', '#00CCFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.orbGradient}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
      );
    }

    // Stato: errore
    if (state === 'error') {
      return (
        <Animated.View style={styles.orbContainer}>
          <LinearGradient
            colors={['#FF3B30', '#FF6B6B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.orbGradient}
          >
            <TouchableOpacity
              style={styles.orbButton}
              onPress={handleErrorDismiss}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Riprova connessione"
            >
              <MaterialIcons name="refresh" size={52} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      );
    }

    // Stato: non connesso
    if (!isConnected) {
      return (
        <Animated.View style={styles.orbContainer}>
          <LinearGradient
            colors={['#0066FF', '#00CCFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.orbGradient}
          >
            <TouchableOpacity
              style={styles.orbButton}
              onPress={handleConnect}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Connetti assistente vocale"
            >
              <MaterialIcons name="wifi" size={52} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      );
    }

    // Determine scale for idle state
    const orbScale = isRecording ? 1 : breathingScale;

    // Stato: ascolto attivo o pronto
    return (
      <Animated.View style={[
        styles.orbContainer,
        { transform: [{ scale: orbScale }] }
      ]}>
        <LinearGradient
          colors={['#0066FF', '#00CCFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.orbGradient}
        >
          <Ionicons
            name="mic"
            size={56}
            color="#FFFFFF"
          />
        </LinearGradient>
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
          stopPlayback();
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
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeIn,
            transform: [{ translateY: slideIn }],
          },
        ]}
      >
        {/* Header with Live indicator and Close button */}
        <View style={styles.header}>
          {/* Live Indicator */}
          {isConnected && (
            <View style={styles.liveIndicator}>
              <Animated.View
                style={[
                  styles.liveDot,
                  { opacity: liveDotOpacity }
                ]}
              />
              <Text style={styles.liveText}>Live</Text>
            </View>
          )}

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Chiudi chat vocale"
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Contenuto principale */}
        <View style={styles.content}>
          {/* Messaggio di stato */}
          {renderStateIndicator()}

          {/* Orb animato centrale */}
          <View style={styles.orbOuterContainer}>
            {/* Cerchi di pulsazione - solo quando in ascolto */}
            {isRecording && (
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

            {/* Orb principale */}
            {renderMainButton()}

            {/* Overlay microfono disabilitato */}
            {isMuted && isConnected && (
              <View style={styles.mutedOverlay}>
                <View style={styles.mutedIconContainer}>
                  <Ionicons name="mic-off" size={48} color="#FF3B30" />
                  <Text style={styles.mutedText}>Microfono disattivato</Text>
                </View>
              </View>
            )}
          </View>

          {/* Messaggio di errore */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={handleErrorDismiss}>
                <Text style={styles.retryText}>Riprova</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Widget Area - Transcript */}
        {transcripts.length > 0 && (
          <View style={styles.widgetArea}>
            <Text style={styles.widgetTitle}>Trascrizione</Text>
            <Text style={styles.widgetText} numberOfLines={2}>
              {transcripts[transcripts.length - 1].content}
            </Text>
          </View>
        )}

        {/* Bottom Control Bar */}
        <View style={styles.controlBar}>
          {/* Microphone Button - Primary */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.controlButtonPrimary,
              isMuted && styles.controlButtonMuted,
              isRecording && !isMuted && styles.controlButtonRecording
            ]}
            onPress={() => {
              if (isMuted) {
                unmute();
              } else {
                mute();
              }
            }}
            disabled={!isConnected || state === 'connecting' || isProcessing || isSpeaking}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={isMuted ? "Microfono disattivato" : "Microfono attivo"}
            accessibilityState={{ selected: !isMuted }}
          >
            <Ionicons
              name={isMuted ? "mic-off" : "mic"}
              size={28}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          {/* End Call Button */}
          <TouchableOpacity
            style={[styles.controlButton, styles.controlButtonEnd]}
            onPress={handleClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Chiudi chat vocale"
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "space-between",
  },
  header: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 44,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34C759",
    marginRight: 6,
  },
  liveText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "System",
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(58, 58, 60, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  subtleText: {
    fontSize: 15,
    fontWeight: "300",
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    marginBottom: 40,
    fontFamily: "System",
  },
  orbOuterContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 32,
  },
  pulseCircle: {
    position: "absolute",
    borderRadius: 200,
    borderWidth: 2,
    borderColor: "rgba(0, 102, 255, 0.3)",
  },
  pulseCircle1: {
    width: 280,
    height: 280,
  },
  pulseCircle2: {
    width: 340,
    height: 340,
  },
  orbContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    ...Platform.select({
      ios: {
        shadowColor: "#0066FF",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  orbGradient: {
    width: 240,
    height: 240,
    borderRadius: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  orbButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 120,
  },
  errorContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    borderRadius: 16,
    marginTop: 32,
    maxWidth: "85%",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 13,
    fontWeight: "400",
    textAlign: "center",
    marginBottom: 12,
    fontFamily: "System",
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "System",
  },
  widgetArea: {
    height: 120,
    backgroundColor: "rgba(28, 28, 30, 0.95)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    justifyContent: "flex-start",
  },
  widgetTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 8,
    fontFamily: "System",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  widgetText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#FFFFFF",
    fontFamily: "System",
    lineHeight: 20,
  },
  controlBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 40,
    paddingHorizontal: 32,
    paddingVertical: 24,
    paddingBottom: 40,
    backgroundColor: "#000000",
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(58, 58, 60, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonDisabled: {
    backgroundColor: "rgba(58, 58, 60, 0.4)",
  },
  controlButtonActive: {
    backgroundColor: "rgba(58, 58, 60, 1)",
  },
  controlButtonPrimary: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#0066FF",
    ...Platform.select({
      ios: {
        shadowColor: "#0066FF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  controlButtonRecording: {
    backgroundColor: "#00CCFF",
  },
  controlButtonMuted: {
    backgroundColor: "#FF3B30",
  },
  controlButtonEnd: {
    backgroundColor: "#FF3B30",
    ...Platform.select({
      ios: {
        shadowColor: "#FF3B30",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  mutedOverlay: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  mutedIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  mutedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF3B30",
    marginTop: 8,
    textAlign: "center",
    fontFamily: "System",
  },
});

export default VoiceChatModal;
