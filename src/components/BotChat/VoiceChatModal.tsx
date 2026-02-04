import React, { useRef, useEffect, useState, useMemo } from "react";
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
  Platform,
  FlatList
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useVoiceChat } from '../../hooks/useVoiceChat';

// Tipi per i messaggi della voice chat
type VoiceChatMessageType =
  | { type: 'transcript'; role: 'user' | 'assistant'; content: string; timestamp: Date }
  | { type: 'tool_call'; toolName: string; args: string; timestamp: Date }
  | { type: 'tool_output'; toolName: string; output: string; timestamp: Date };

interface VoiceChatMessage {
  id: string;
  data: VoiceChatMessageType;
}

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
  const slideIn = useRef(new Animated.Value(height)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const liveDotOpacity = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef<FlatList>(null);

  // Combina trascrizioni e tool calls/outputs in un'unica lista di messaggi
  const chatMessages = useMemo<VoiceChatMessage[]>(() => {
    const messages: VoiceChatMessage[] = [];
    let messageIndex = 0;

    // Aggiungi trascrizioni
    transcripts.forEach((transcript, idx) => {
      messages.push({
        id: `transcript-${idx}`,
        data: {
          type: 'transcript',
          role: transcript.role,
          content: transcript.content,
          timestamp: new Date()
        }
      });
      messageIndex++;
    });

    // Aggiungi tool calls e outputs
    activeTools.forEach((tool, idx) => {
      // Tool call
      messages.push({
        id: `tool-call-${idx}`,
        data: {
          type: 'tool_call',
          toolName: tool.name,
          args: tool.args,
          timestamp: new Date()
        }
      });
      messageIndex++;

      // Tool output (se presente)
      if (tool.status === 'complete' && tool.output) {
        messages.push({
          id: `tool-output-${idx}`,
          data: {
            type: 'tool_output',
            toolName: tool.name,
            output: tool.output,
            timestamp: new Date()
          }
        });
        messageIndex++;
      }
    });

    return messages;
  }, [transcripts, activeTools]);

  // Auto-scroll quando arrivano nuovi messaggi
  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages.length]);

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

  // Render di un singolo messaggio della chat
  const renderChatMessage = ({ item }: { item: VoiceChatMessage }) => {
    const { data } = item;

    if (data.type === 'transcript') {
      const isUser = data.role === 'user';
      return (
        <View style={[
          styles.chatMessageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer
        ]}>
          <View style={[
            styles.chatMessageBubble,
            isUser ? styles.userBubble : styles.assistantBubble
          ]}>
            <Text style={[
              styles.chatMessageText,
              isUser ? styles.userText : styles.assistantText
            ]}>
              {data.content}
            </Text>
          </View>
        </View>
      );
    }

    if (data.type === 'tool_call') {
      return (
        <View style={styles.toolMessageContainer}>
          <View style={styles.toolCallBubble}>
            <View style={styles.toolHeader}>
              <MaterialIcons name="build" size={16} color="#0066FF" />
              <Text style={styles.toolHeaderText}>Esecuzione tool</Text>
            </View>
            <Text style={styles.toolName}>{data.toolName}</Text>
            <Text style={styles.toolArgs} numberOfLines={2}>{data.args}</Text>
          </View>
        </View>
      );
    }

    if (data.type === 'tool_output') {
      return (
        <View style={styles.toolMessageContainer}>
          <View style={styles.toolOutputBubble}>
            <View style={styles.toolHeader}>
              <MaterialIcons name="check-circle" size={16} color="#34C759" />
              <Text style={styles.toolHeaderText}>Risultato</Text>
            </View>
            <Text style={styles.toolName}>{data.toolName}</Text>
            <Text style={styles.toolOutput} numberOfLines={3}>{data.output}</Text>
          </View>
        </View>
      );
    }

    return null;
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

        {/* Contenuto principale - Chat */}
        <View style={styles.content}>
          {/* Messaggio di stato in alto */}
          <View style={styles.statusBar}>
            {renderStateIndicator()}
            {isMuted && isConnected && (
              <View style={styles.mutedBadge}>
                <Ionicons name="mic-off" size={14} color="#FF3B30" />
                <Text style={styles.mutedBadgeText}>Muto</Text>
              </View>
            )}
          </View>

          {/* Lista messaggi */}
          {chatMessages.length > 0 ? (
            <FlatList
              ref={flatListRef}
              data={chatMessages}
              renderItem={renderChatMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chatList}
              showsVerticalScrollIndicator={false}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />
          ) : (
            <View style={styles.emptyChat}>
              {state === 'connecting' || state === 'authenticating' || state === 'setting_up' ? (
                <>
                  <ActivityIndicator size="large" color="#0066FF" style={{ marginBottom: 16 }} />
                  <Text style={styles.emptyChatText}>Connessione in corso...</Text>
                </>
              ) : state === 'error' ? (
                <>
                  <MaterialIcons name="error-outline" size={48} color="#FF3B30" style={{ marginBottom: 16 }} />
                  <Text style={styles.emptyChatText}>Errore di connessione</Text>
                  <TouchableOpacity onPress={handleErrorDismiss} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Riprova</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Ionicons name="mic" size={48} color="#0066FF" style={{ marginBottom: 16 }} />
                  <Text style={styles.emptyChatText}>Inizia a parlare</Text>
                  <Text style={styles.emptyChatSubtext}>La conversazione apparirà qui</Text>
                </>
              )}
            </View>
          )}

          {/* Messaggio di errore */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
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
    paddingHorizontal: 0,
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  subtleText: {
    fontSize: 13,
    fontWeight: "300",
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "System",
  },
  mutedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 59, 48, 0.2)",
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
  chatList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  emptyChat: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyChatText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "System",
  },
  emptyChatSubtext: {
    fontSize: 14,
    fontWeight: "300",
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    fontFamily: "System",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#0066FF",
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "System",
  },
  chatMessageContainer: {
    marginVertical: 6,
  },
  userMessageContainer: {
    alignItems: "flex-end",
  },
  assistantMessageContainer: {
    alignItems: "flex-start",
  },
  chatMessageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: "#0066FF",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: "rgba(58, 58, 60, 0.8)",
    borderBottomLeftRadius: 4,
  },
  chatMessageText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: "System",
    fontWeight: "400",
  },
  userText: {
    color: "#FFFFFF",
  },
  assistantText: {
    color: "#FFFFFF",
  },
  toolMessageContainer: {
    marginVertical: 6,
    alignItems: "center",
  },
  toolCallBubble: {
    backgroundColor: "rgba(0, 102, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(0, 102, 255, 0.3)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    maxWidth: "85%",
  },
  toolOutputBubble: {
    backgroundColor: "rgba(52, 199, 89, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(52, 199, 89, 0.3)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    maxWidth: "85%",
  },
  toolHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  toolHeaderText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    textTransform: "uppercase",
    fontFamily: "System",
  },
  toolName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
    fontFamily: "System",
  },
  toolArgs: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: "System",
  },
  toolOutput: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: "System",
  },
  errorContainer: {
    backgroundColor: "rgba(244, 67, 54, 0.15)",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 13,
    fontWeight: "400",
    textAlign: "center",
    fontFamily: "System",
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
});

export default VoiceChatModal;
