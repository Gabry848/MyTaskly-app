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
  Alert,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
    requestPermissions,
    mute,
    unmute,
  } = useVoiceChat();

  // Animazioni
  const slideIn = useRef(new Animated.Value(height)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
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


  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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

          {/* Status Badge */}
          <View style={styles.headerCenter}>
            {renderStateIndicator()}
            {isMuted && isConnected && (
              <View style={styles.mutedBadge}>
                <Ionicons name="mic-off" size={14} color="#FF3B30" />
                <Text style={styles.mutedBadgeText}>Muto</Text>
              </View>
            )}
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Chiudi chat vocale"
          >
            <Ionicons name="close" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

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
              color={isMuted ? "#000000" : "#FFFFFF"}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
  },
  header: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 44,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E1E5E9",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(52, 199, 89, 0.1)",
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
    color: "#34C759",
    fontFamily: "System",
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E1E5E9",
  },
  subtleText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#666666",
    fontFamily: "System",
  },
  mutedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  mutedBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FF3B30",
    fontFamily: "System",
  },
  // Control Bar
  controlBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 40,
    paddingHorizontal: 32,
    paddingVertical: 24,
    paddingBottom: 40,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E1E5E9",
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E1E5E9",
  },
  controlButtonDisabled: {
    backgroundColor: "#F8F9FA",
    opacity: 0.5,
  },
  controlButtonActive: {
    backgroundColor: "#E1E5E9",
  },
  controlButtonPrimary: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#000000",
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  controlButtonRecording: {
    backgroundColor: "#000000",
  },
  controlButtonMuted: {
    backgroundColor: "#E1E5E9",
  },
  controlButtonEnd: {
    backgroundColor: "#000000",
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});

export default VoiceChatModal;
