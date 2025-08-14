import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Animated,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChatList, Message } from "../../../components/BotChat";
import { sendMessageToBot } from "../../services/botservice";
import { STORAGE_KEYS } from "../../constants/authConstants";
import TaskCacheService from '../../services/TaskCacheService';
import SyncManager, { SyncStatus } from '../../services/SyncManager';
import Badge from "../../../components/Badge";
import VoiceChatModal from "../../../components/VoiceChatModal";

const Home20 = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);  const [isLoading, setIsLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);  const [userName, setUserName] = useState("Utente");
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceChatVisible, setIsVoiceChatVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const navigation = useNavigation();
  
  // Servizi
  const cacheService = useRef(TaskCacheService.getInstance()).current;
  const syncManager = useRef(SyncManager.getInstance()).current;
  
  // Animazioni
  const messagesSlideIn = useRef(new Animated.Value(50)).current;
  const messagesOpacity = useRef(new Animated.Value(1)).current;
  const inputBottomPosition = useRef(new Animated.Value(0)).current;
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  // Setup sync status listener
  useEffect(() => {
    const handleSyncStatus = (status: SyncStatus) => {
      setSyncStatus(status);
    };
    
    syncManager.addSyncListener(handleSyncStatus);
    
    // Ottieni stato iniziale
    syncManager.getSyncStatus().then(setSyncStatus);
    
    return () => {
      syncManager.removeSyncListener(handleSyncStatus);
    };
  }, [syncManager]);
  
  // Effetto per recuperare il nome dell'utente e inizializzare cache
  useEffect(() => {
    const initialize = async () => {
      try {
        // Recupera nome utente
        const storedUserName = await AsyncStorage.getItem(
          STORAGE_KEYS.USER_NAME
        );
        if (storedUserName) {
          setUserName(storedUserName);
        }
        
        // Inizializza cache in background
        const hasCachedData = await cacheService.hasCachedData();
        if (!hasCachedData) {
          console.log('[HOME] Nessun dato in cache, avvio sync iniziale');
          syncManager.startSync();
        } else {
          console.log('[HOME] Dati in cache presenti');
        }
      } catch (error) {
        console.error("Errore nell'inizializzazione:", error);
      }
    };

    initialize();
  }, [cacheService, syncManager]);
  // Effetto per l'animazione di scrittura del testo di saluto
  useEffect(() => {
    if (userName && !chatStarted) {
      const greetingText = `Ciao ${userName},\ncosa vuoi fare oggi?`;
      let currentIndex = 0;
      setDisplayedText("");
      setIsTyping(true);

      const typingInterval = setInterval(() => {
        if (currentIndex <= greetingText.length) {
          setDisplayedText(greetingText.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 50); // Velocità di scrittura: 50ms per carattere

      return () => {
        clearInterval(typingInterval);
      };
    }
  }, [userName, chatStarted]);

  // Effetto per l'animazione del cursore lampeggiante
  useEffect(() => {
    if (isTyping) {
      const blinkAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(cursorOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      blinkAnimation.start();

      return () => {
        blinkAnimation.stop();
      };
    } else {
      // Ferma l'animazione e nascondi il cursore quando la scrittura è finita
      cursorOpacity.setValue(0);
    }
  }, [isTyping, cursorOpacity]);
  // Effetto per gestire la visualizzazione della tastiera
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        if (chatStarted) {
          // Sposta solo l'input sopra la tastiera
          Animated.timing(inputBottomPosition, {
            toValue: event.endCoordinates.height - 35, // 35px   di margine dalla tastiera (5px in più)
            duration: 250,
            useNativeDriver: false,
          }).start();
        }
        // Non fare nulla per l'input del saluto - deve rimanere fermo
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        if (chatStarted) {
          // Riporta l'input in posizione normale
          Animated.timing(inputBottomPosition, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }).start();
        }
        // Non fare nulla per l'input del saluto - deve rimanere fermo
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [chatStarted, inputBottomPosition]);

  const startChatAnimation = () => {
    setChatStarted(true);

    // Animazione di entrata per i messaggi
    Animated.timing(messagesSlideIn, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };
  const handleVoicePress = () => {
    // Apri la modal della chat vocale
    setIsVoiceChatVisible(true);
  };

  const handleSuggestedCommand = async (command: string) => {
    if (isLoading) return;

    setMessage(command);
    
    // Simula un breve delay per far vedere il testo nell'input
    setTimeout(() => {
      handleSubmit();
    }, 200);
  };

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading) return;

    const userMessage: Message = {
      id: generateMessageId(),
      text: trimmedMessage,
      sender: "user",
      start_time: new Date(),
    };

    // Se è il primo messaggio, avvia l'animazione della chat
    if (!chatStarted) {
      startChatAnimation();
    }

    // Aggiungi il messaggio dell'utente
    setMessages((prev) => [...prev, userMessage]);

    // Resetta l'input immediatamente per una migliore UX
    setMessage("");
    setIsLoading(true);

    try {
      // Invia il messaggio al bot
      const botResponse = await sendMessageToBot(
        trimmedMessage,
        "advanced", // Puoi renderlo configurabile
        messages
      );

      // Crea il messaggio del bot
      const botMessage: Message = {
        id: generateMessageId(),
        text: botResponse,
        sender: "bot",
        start_time: new Date(),
        modelType: "advanced",
      };

      // Aggiungi la risposta del bot con un leggero delay per una migliore UX
      setTimeout(() => {
        setMessages((prev) => [...prev, botMessage]);
        setIsLoading(false);
      }, 300);
    } catch (error) {
      console.error("Errore nell'invio del messaggio:", error);

      // Messaggio di errore del bot
      const errorMessage: Message = {
        id: generateMessageId(),
        text: "Mi dispiace, si è verificato un errore. Riprova più tardi.",
        sender: "bot",
        start_time: new Date(),
        modelType: "base",
      };

      setTimeout(() => {
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
      }, 300);
    }
  };
  const handleGoBack = () => {
    navigation.goBack();
  };  const handleResetChat = () => {
    // Animazione di uscita per i messaggi
    Animated.parallel([
      Animated.timing(messagesOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(messagesSlideIn, {
        toValue: -30, // Sposta leggermente verso l'alto mentre svanisce
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset dello stato dopo l'animazione
      setMessages([]);
      setMessage("");
      setChatStarted(false);
      setIsLoading(false);
      setDisplayedText("");
      setIsTyping(false);

      // Reset delle animazioni per il prossimo utilizzo
      messagesSlideIn.setValue(50);
      messagesOpacity.setValue(1);
      inputBottomPosition.setValue(0);
      cursorOpacity.setValue(1);
    });
  };

  const handleVoiceChatClose = () => {
    setIsVoiceChatVisible(false);
    setIsRecording(false);
  };

  const handleVoiceResponse = (response: string) => {
    // Aggiungi la risposta vocale alla chat come messaggio del bot
    const botMessage: Message = {
      id: generateMessageId(),
      text: response,
      sender: "bot",
      start_time: new Date(),
      modelType: "advanced",
    };

    // Se è il primo messaggio, avvia l'animazione della chat
    if (!chatStarted) {
      startChatAnimation();
    }

    setMessages((prev) => [...prev, botMessage]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header con titolo principale e indicatori sync */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Mytaskly</Text>
          {syncStatus && (
            <View style={styles.syncIndicatorHome}>
              {syncStatus.isSyncing ? (
                <View style={styles.syncingContainer}>
                  <ActivityIndicator size="small" color="#666666" />
                  <Text style={styles.syncText}>Sincronizzando...</Text>
                </View>
              ) : !syncStatus.isOnline ? (
                <View style={styles.offlineContainer}>
                  <Ionicons name="cloud-offline-outline" size={16} color="#ff6b6b" />
                  <Text style={styles.offlineText}>Modalità offline</Text>
                </View>
              ) : syncStatus.pendingChanges > 0 ? (
                <View style={styles.pendingContainer}>
                  <Ionicons name="sync-outline" size={16} color="#ffa726" />
                  <Text style={styles.pendingText}>{syncStatus.pendingChanges} modifiche da sincronizzare</Text>
                </View>
              ) : (
                <View style={styles.onlineContainer}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#4caf50" />
                  <Text style={styles.onlineText}>Sincronizzato</Text>
                </View>
              )}
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {chatStarted && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetChat}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={24} color="#666666" />
            </TouchableOpacity>
          )}
          <Badge />
        </View>
      </View>

      <View style={styles.mainContent}>
        {/* Contenuto principale */}
        <View style={chatStarted ? styles.contentChatStarted : styles.content}>
          {/* Saluto personalizzato - nascosto quando la chat inizia */}
          {!chatStarted && (
            <View style={styles.greetingSection}>
              <View style={styles.greetingTextContainer}>
                <Text style={styles.greetingText}>
                  {displayedText}
                  {isTyping && (
                    <Animated.Text style={[styles.cursorText, { opacity: cursorOpacity }]}>
                      |
                    </Animated.Text>
                  )}
                </Text>
              </View>

              {/* Input area - sotto il saluto quando la chat non è iniziata */}
              <View style={styles.inputSectionUnderGreeting}>
                <View style={styles.animatedInputWrapper}>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Scrivi un messaggio..."
                      placeholderTextColor="#999999"
                      value={message}
                      onChangeText={setMessage}
                      multiline={false}
                      onSubmitEditing={handleSubmit}
                      returnKeyType="send"
                      editable={!isLoading}
                    />

                    {/* Mostra il pulsante di invio se c'è del testo, altrimenti il microfono */}
                    {message.trim() ? (
                      <TouchableOpacity
                        style={[
                          styles.sendButton,
                          isLoading && styles.sendButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        activeOpacity={0.7}
                        disabled={isLoading}
                      >
                        <Ionicons
                          name="send"
                          size={20}
                          color={isLoading ? "#ccc" : "#000"}
                        />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.voiceButton,
                          isLoading && styles.voiceButtonDisabled,
                        ]}
                        onPress={handleVoicePress}
                        activeOpacity={0.7}
                        disabled={isLoading}
                      >
                        <Ionicons
                          name="mic"
                          size={24}
                          color={isLoading ? "#ccc" : "#666666"}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Comando suggerito */}
                <View style={styles.suggestedCommandsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.suggestedCommandButton,
                      isLoading && styles.suggestedCommandButtonDisabled,
                    ]}
                    onPress={() => handleSuggestedCommand("Cosa puoi fare?")}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <Text style={[
                      styles.suggestedCommandText,
                      isLoading && styles.suggestedCommandTextDisabled,
                    ]}>
                      💡 Cosa puoi fare?
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          {/* Lista dei messaggi - visibile quando la chat inizia */}
          {chatStarted && (            <Animated.View
              style={[
                styles.chatSection,
                {
                  opacity: messagesOpacity,
                  transform: [{ translateY: messagesSlideIn }],
                },
              ]}
            >
              <ChatList messages={messages} />
              {/* Indicatore di caricamento */}
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingBubble}>
                    <Text style={styles.loadingText}>
                      Il bot sta scrivendo...
                    </Text>
                    <View style={styles.loadingDots}>
                      <View style={styles.dot} />
                      <View style={styles.dot} />
                      <View style={styles.dot} />
                    </View>
                  </View>
                </View>
              )}
            </Animated.View>
          )}
        </View>

        {/* Input area in basso - visibile solo quando la chat è iniziata */}
        {chatStarted && (
          <Animated.View
            style={[
              styles.inputSection,
              {
                position: "absolute",
                bottom: inputBottomPosition,
                left: 0,
                right: 0,
              },
            ]}
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Scrivi un messaggio..."
                placeholderTextColor="#999999"
                value={message}
                onChangeText={setMessage}
                multiline={false}
                onSubmitEditing={handleSubmit}
                returnKeyType="send"
                editable={!isLoading}
              />

              {/* Mostra il pulsante di invio se c'è del testo, altrimenti il microfono */}
              {message.trim() ? (
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    isLoading && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  activeOpacity={0.7}
                  disabled={isLoading}
                >
                  <Ionicons
                    name="send"
                    size={20}
                    color={isLoading ? "#ccc" : "#000"}
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.voiceButton,
                    isLoading && styles.voiceButtonDisabled,
                  ]}
                  onPress={handleVoicePress}
                  activeOpacity={0.7}
                  disabled={isLoading}
                >
                  <Ionicons
                    name="mic"
                    size={24}
                    color={isLoading ? "#ccc" : "#666666"}
                  />
                </TouchableOpacity>
              )}
            </View>          </Animated.View>
        )}
      </View>

      {/* Voice Chat Modal */}
      <VoiceChatModal
        visible={isVoiceChatVisible}
        onClose={handleVoiceChatClose}
        isRecording={isRecording}
        onVoiceResponse={handleVoiceResponse}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 15,
    paddingBottom: 40,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    position: "relative",
  },
  titleSection: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  syncIndicatorHome: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  syncText: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 6,
    fontFamily: 'System',
    fontWeight: '300',
  },
  offlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  offlineText: {
    fontSize: 13,
    color: '#ff6b6b',
    marginLeft: 6,
    fontFamily: 'System',
    fontWeight: '300',
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  pendingText: {
    fontSize: 13,
    color: '#ffa726',
    marginLeft: 6,
    fontFamily: 'System',
    fontWeight: '300',
  },
  onlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  onlineText: {
    fontSize: 13,
    color: '#4caf50',
    marginLeft: 6,
    fontFamily: 'System',
    fontWeight: '300',
  },
  resetButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "transparent",
    marginTop: 15,
  },
  backButton: {
    marginTop: 12,
    marginRight: 20,
    padding: 8,
  },
  mainTitle: {
    paddingTop: 10,
    fontSize: 30,
    fontWeight: "200", // Più leggero per un look più elegante
    color: "#000000",
    textAlign: "left",
    fontFamily: "System",
    letterSpacing: -1.5,
    marginBottom: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 250, // Aumentato per abbassare il saluto
    paddingBottom: 80, // Ridotto per dare più spazio alla chat
  },
  contentChatStarted: {
    flex: 1,
    paddingHorizontal: 0, // Rimosso padding laterale per la chat
    paddingTop: 0, // Ancora più in alto per massimizzare lo spazio della chat
    paddingBottom: 80,
  },  greetingSection: {
    marginBottom: 30,
  },
  greetingTextContainer: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: 90, // Altezza minima per evitare sfarfallii
  },
  cursorText: {
    fontSize: 34,
    fontWeight: "300",
    color: "#000000",
    fontFamily: "System",
    letterSpacing: -0.8,
  },
  inputSectionUnderGreeting: {
    alignItems: "center",
    paddingHorizontal: 0,
    marginTop: 40,
  },
  animatedInputWrapper: {
    width: "100%",
    alignItems: "center",
  },
  greetingText: {
    fontSize: 34,
    fontWeight: "300", // Leggermente più leggero
    color: "#000000",
    textAlign: "center",
    lineHeight: 44,
    fontFamily: "System",
    letterSpacing: -0.8,
  },
  chatSection: {
    flex: 1,
    marginBottom: 10, // Ridotto per ottimizzare lo spazio
  },
  loadingContainer: {
    paddingHorizontal: 15,
    marginVertical: 6,
    alignItems: "flex-start",
  },
  loadingBubble: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 16,
    maxWidth: "80%",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
    marginRight: 8,
    fontFamily: "System",
  },
  loadingDots: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#999999",
    marginHorizontal: 2,
  },
  inputSection: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: "#ffffff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 16,
    width: "100%",
    maxWidth: 420,
    borderWidth: 1.5,
    borderColor: "#e1e5e9",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    color: "#000000",
    fontFamily: "System",
    fontWeight: "400",
    paddingVertical: 10,
  },
  voiceButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  voiceButtonDisabled: {
    backgroundColor: "#f8f8f8",
  },
  sendButton: {
    marginLeft: 12,
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#e8e8e8",
  },
  suggestedCommandsContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  suggestedCommandButton: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#e1e5e9",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  suggestedCommandButtonDisabled: {
    backgroundColor: "#f0f0f0",
    borderColor: "#e8e8e8",
  },
  suggestedCommandText: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "500",
    fontFamily: "System",
  },
  suggestedCommandTextDisabled: {
    color: "#999999",
  },
});

export default Home20;
