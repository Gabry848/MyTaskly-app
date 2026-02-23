import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChatList, Message } from "../../components/BotChat";
import { ToolWidget } from "../../components/BotChat/types";
import { sendMessageToBot, formatMessage, StreamingCallback, createNewChat } from "../../services/textBotService";
import { getChatWithMessages, ChatMessage } from "../../services/chatHistoryService";
import { reconstructMessagesFromHistory } from "../../components/BotChat/utils/chatHistoryUtils";
import { STORAGE_KEYS } from "../../constants/authConstants";
import { TaskCacheService } from '../../services/TaskCacheService';
import SyncManager from '../../services/SyncManager';
import Badge from "../../components/UI/Badge";
import VoiceChatModal from "../../components/BotChat/VoiceChatModal";
import { useTranslation } from 'react-i18next';
import { ChatHistory } from "../../components/BotChat/ChatHistory";
import { useTutorialContext } from "../../contexts/TutorialContext";

const HomeScreen = () => {
  const { t } = useTranslation();
  const { startTutorial } = useTutorialContext();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);  const [isLoading, setIsLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);  const [userName, setUserName] = useState("Utente");
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceChatVisible, setIsVoiceChatVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [suggestedCommandUsed, setSuggestedCommandUsed] = useState(false);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Costanti
  const USER = 'user';
  const BOT = 'bot';

  // Servizi
  const cacheService = useRef(TaskCacheService.getInstance()).current;
  const syncManager = useRef(SyncManager.getInstance()).current;
  
  // Animazioni
  const messagesSlideIn = useRef(new Animated.Value(50)).current;
  const messagesOpacity = useRef(new Animated.Value(1)).current;
  const inputBottomPosition = useRef(new Animated.Value(0)).current;
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const micButtonAnim = useRef(new Animated.Value(1)).current;
  const chatHistorySlideIn = useRef(new Animated.Value(0)).current;
  const chatHistoryOpacity = useRef(new Animated.Value(0)).current;
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

        // Recupera lo stato del comando suggerito
        const suggestedCommandShown = await AsyncStorage.getItem(
          STORAGE_KEYS.SUGGESTED_COMMAND_SHOWN
        );
        setSuggestedCommandUsed(suggestedCommandShown === 'true');

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
      const greetingText = t('home.greeting', { username: userName });
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
  }, [userName, chatStarted, t]);

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
  // Effetto per gestire le dimensioni dello schermo
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenHeight(window.height);
    });

    return () => subscription?.remove();
  }, []);

  // Effetto per animare il pulsante del microfono
  useEffect(() => {
    Animated.timing(micButtonAnim, {
      toValue: isInputFocused ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();

    console.log('[HOME] Mic button animation state:', { isInputFocused, targetValue: isInputFocused ? 0 : 1 });
  }, [isInputFocused, micButtonAnim]);

  // Effetto per gestire la visualizzazione della tastiera
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        if (chatStarted) {
          // Sposta l'input sopra la tastiera con margine maggiore
          Animated.timing(inputBottomPosition, {
            toValue: event.endCoordinates.height + 10,
            duration: 250,
            useNativeDriver: false,
          }).start();
        }
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        // Forza il reset del focus quando la tastiera si nasconde
        console.log('[HOME] Keyboard hidden, resetting input focus state');
        setIsInputFocused(false);

        if (chatStarted) {
          // Riporta l'input in posizione normale
          Animated.timing(inputBottomPosition, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }).start();
        }
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [chatStarted, inputBottomPosition]);

  const startChatAnimation = useCallback(() => {
    setChatStarted(true);

    // Animazione di entrata per i messaggi
    Animated.timing(messagesSlideIn, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [messagesSlideIn]);

  const generateMessageId = useCallback(() => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);
  const handleVoicePress = () => {
    // Apri la modal della chat vocale
    setIsVoiceChatVisible(true);
  };

  const handleSuggestedCommand = async (command: string) => {
    if (isLoading) return;

    setMessage(command);
    setSuggestedCommandUsed(true);

    // Salva in AsyncStorage che il comando è stato utilizzato
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SUGGESTED_COMMAND_SHOWN, 'true');
    } catch (error) {
      console.error("Errore nel salvare lo stato del comando suggerito:", error);
    }

    // Pass the command directly to handleSubmit to avoid stale state closure
    handleSubmit(command);
  };

  const handleSubmit = async (overrideMessage?: string) => {
    const rawMessage = overrideMessage ?? message;
    console.log('[HOME] handleSubmit triggered. Raw message:', rawMessage);
    const trimmedMessage = rawMessage.trim();
    if (!trimmedMessage || isLoading) return;

    // Se non c'è un chat_id corrente, crea una nuova sessione
    let chatIdToUse = currentChatId;
    if (!chatIdToUse) {
      try {
        chatIdToUse = await createNewChat();
        setCurrentChatId(chatIdToUse);
        console.log('✅ Nuova chat creata automaticamente con ID:', chatIdToUse);
      } catch (error) {
        console.error('❌ Errore durante la creazione automatica della chat:', error);
        // Continua senza chat_id (modalità offline)
      }
    }

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
    setMessages((prev) => {
      const next = [...prev, userMessage];
      console.log('[HOME] Added user message. Count:', next.length);
      return next;
    });

    // Resetta l'input immediatamente per una migliore UX
    setMessage("");
    setIsLoading(true);

    // Chiudi la tastiera dopo l'invio
    Keyboard.dismiss();

    // Crea il messaggio del bot in streaming
    const botMessageId = generateMessageId();
    const initialBotMessage: Message = {
      id: botMessageId,
      text: "",
      sender: "bot",
      start_time: new Date(),
      modelType: "advanced",
      isStreaming: true,
      isComplete: false,
    };

    // Aggiungi il messaggio del bot vuoto per iniziare lo streaming
    setMessages((prev) => {
      const next = [...prev, initialBotMessage];
      console.log('[HOME] Added initial bot message (streaming). Count:', next.length, 'botMessageId:', botMessageId);
      return next;
    });
    setIsLoading(false);

    try {
      // Callback per gestire lo streaming
      const onStreamChunk: StreamingCallback = (
        chunk: string,
        isComplete: boolean,
        toolWidgets?: ToolWidget[],
        chatInfo?: { chat_id: string; is_new: boolean }
      ) => {
        if (typeof chunk !== 'string' && chunk) {
          console.warn('[HOME] onStreamChunk received non-string chunk:', chunk);
        }
        console.log('[HOME] onStreamChunk', {
          isComplete,
          chunkPreview: typeof chunk === 'string' ? chunk.slice(0, 40) : chunk,
          widgetsCount: toolWidgets?.length || 0,
          widgets: toolWidgets?.map(w => ({ toolName: w.toolName, status: w.status, type: w.toolOutput?.type })),
          chatInfo
        });

        // Se riceviamo chat_id dal server, aggiorniamo lo stato
        if (chatInfo?.chat_id) {
          if (chatInfo.is_new) {
            console.log('[HOME] Nuova chat creata automaticamente dal server:', chatInfo.chat_id);
          }
          setCurrentChatId(chatInfo.chat_id);
        }

        if (isComplete) {
          // Lo streaming è completato, applica formatMessage al testo completo e aggiorna toolWidgets
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? {
                    ...msg,
                    text: formatMessage(msg.text),
                    isStreaming: false,
                    isComplete: true,
                    toolWidgets: toolWidgets || msg.toolWidgets
                  }
                : msg
            )
          );
        } else {
          // Aggiungi il chunk al messaggio esistente e aggiorna toolWidgets se presenti
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? {
                    ...msg,
                    text: msg.text + chunk,
                    toolWidgets: toolWidgets || msg.toolWidgets
                  }
                : msg
            )
          );
        }
      };

      // Invia il messaggio al bot con streaming e chat_id
      const result = await sendMessageToBot(
        trimmedMessage,
        "advanced",
        onStreamChunk,
        chatIdToUse || undefined
      );

      // Aggiorna currentChatId se il server ha restituito un chat_id
      if (result.chat_id && result.chat_id !== currentChatId) {
        console.log('[HOME] Aggiornamento chat_id da:', currentChatId, 'a:', result.chat_id);
        setCurrentChatId(result.chat_id);
      }

    } catch (error) {
      console.error("[HOME] Errore nell'invio del messaggio:", error);

      // Aggiorna il messaggio del bot con un errore
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? {
                ...msg,
                text: t('home.chat.error'),
                isStreaming: false,
                isComplete: true,
                modelType: "base"
              }
            : msg
        )
      );
    }
  };

  const handleResetChat = async () => {
    // Se c'è una chat aperta, semplicemente pulisci e esci dalla sessione
    if (currentChatId) {
      console.log('[HOME] Clearing current chat session:', currentChatId);
      setCurrentChatId(null);
    } else {
      console.log('[HOME] Starting new chat (reset current chat)');

      try {
        // Crea una nuova sessione chat sul server solo se non c'è una chat aperta
        const chatId = await createNewChat();
        setCurrentChatId(chatId);
        console.log('✅ Nuova chat creata con ID:', chatId);
      } catch (error) {
        console.error('❌ Errore durante la creazione della nuova chat:', error);
        // Continua comunque con il reset locale anche se fallisce la creazione sul server
        setCurrentChatId(null);
      }
    }

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
    ]).start(async () => {
      // Reset dello stato dopo l'animazione
      setMessages([]);
      setMessage("");
      setChatStarted(false);
      setIsLoading(false);
      setDisplayedText("");
      setIsTyping(false);

      // Leggi il valore persistente del comando suggerito da AsyncStorage
      try {
        const suggestedCommandShown = await AsyncStorage.getItem(
          STORAGE_KEYS.SUGGESTED_COMMAND_SHOWN
        );
        setSuggestedCommandUsed(suggestedCommandShown === 'true');
      } catch (error) {
        console.error("Errore nel leggere lo stato del comando suggerito:", error);
        setSuggestedCommandUsed(false);
      }

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

  const handleVoiceResponse = useCallback((response: string) => {
    // Aggiungi la risposta vocale alla chat come messaggio del bot
    const botMessage: Message = {
      id: generateMessageId(),
      text: response,
      sender: "bot",
      start_time: new Date(),
      modelType: "advanced",
      isStreaming: false,
      isComplete: true,
    };

    // Se è il primo messaggio, avvia l'animazione della chat
    if (!chatStarted) {
      startChatAnimation();
    }

    setMessages((prev) => [...prev, botMessage]);
  }, [chatStarted, generateMessageId, startChatAnimation]);

  const handleChatHistoryPress = async (chatId: string) => {
    console.log('[HOME] Opening chat history:', chatId);

    try {
      // Recupera la chat con tutti i suoi messaggi dal server
      const chatData = await getChatWithMessages(chatId);

      // Trasforma i messaggi dall'API al formato UI (con ricostruzione widget tool)
      const transformedMessages = reconstructMessagesFromHistory(
        chatData.messages,
        USER,
        BOT,
      );

      // Imposta la chat corrente
      setCurrentChatId(chatId);
      setMessages(transformedMessages);

      // Avvia la modalità chat se non è già avviata
      if (!chatStarted) {
        startChatAnimation();
      }

      // Chiudi la cronologia
      setShowChatHistory(false);

      console.log('✅ Chat caricata con successo:', {
        chatId,
        title: chatData.title,
        messageCount: transformedMessages.length
      });
    } catch (error) {
      console.error('❌ Errore durante il caricamento della chat:', error);
      Alert.alert(
        'Errore',
        'Impossibile caricare la chat. Riprova più tardi.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleNewChat = async () => {
    // Se c'è una chat aperta, semplicemente pulisci e esci dalla sessione
    if (currentChatId) {
      console.log('[HOME] Clearing current chat session:', currentChatId);
      setCurrentChatId(null);
      setMessages([]);
      setChatStarted(false);
      setShowChatHistory(false);
      console.log('✅ Chat pulita e uscito dalla sessione');
      return;
    }

    // Altrimenti, crea una nuova sessione chat sul server
    console.log('[HOME] Starting new chat from history');

    try {
      const chatId = await createNewChat();
      setCurrentChatId(chatId);
      setMessages([]);
      setChatStarted(false);
      setShowChatHistory(false);

      console.log('✅ Nuova chat creata con ID:', chatId);
    } catch (error) {
      console.error('❌ Errore durante la creazione della nuova chat:', error);
      // In caso di errore, continua comunque senza chat_id
      setCurrentChatId(null);
      setMessages([]);
      setChatStarted(false);
      setShowChatHistory(false);
    }
  };

  const handleToggleChatHistory = () => {
    if (!showChatHistory) {
      // Apri la cronologia con animazione
      setShowChatHistory(true);
      Animated.parallel([
        Animated.timing(chatHistoryOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(chatHistorySlideIn, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Chiudi la cronologia con animazione
      Animated.parallel([
        Animated.timing(chatHistoryOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(chatHistorySlideIn, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowChatHistory(false);
      });
    }
  };

  const handleStartTutorial = async () => {
    try {
      // Clear tutorial completion status to allow restart
      await AsyncStorage.removeItem('@mytaskly:tutorial_completed');
      // Start the tutorial
      startTutorial();
    } catch (error) {
      console.error('[HOME] Error starting tutorial:', error);
    }
  };

  // Calcolo dinamico del padding top basato sull'altezza dello schermo
  const getGreetingPaddingTop = () => {
    if (screenHeight < 700) return Math.max(screenHeight * 0.15, 80); // Schermi piccoli
    if (screenHeight < 800) return Math.max(screenHeight * 0.20, 120); // Schermi medi
    return Math.max(screenHeight * 0.25, 180); // Schermi grandi
  };

  // Gesto swipe da destra a sinistra per aprire la cronologia
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Inizia il gesto con almeno 10px di movimento orizzontale
    .failOffsetY([-20, 20]) // Fallisce se c'è troppo movimento verticale
    .onEnd((event) => {
      'worklet';
      console.log('[HOME] Swipe gesture detected:', {
        translationX: event.translationX,
        velocityX: event.velocityX,
        showChatHistory,
      });

      // Swipe da destra a sinistra per aprire (soglia più bassa per il simulatore)
      if (event.translationX < -50 && !showChatHistory) {
        console.log('[HOME] Opening chat history via swipe');
        runOnJS(handleToggleChatHistory)();
      }
      // Swipe da sinistra a destra per chiudere
      else if (event.translationX > 50 && showChatHistory) {
        console.log('[HOME] Closing chat history via swipe');
        runOnJS(handleToggleChatHistory)();
      }
    });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        {/* Header con titolo principale e indicatori sync */}
        <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Mytaskly</Text>
        </View>
        <View style={styles.headerActions}>
          {/* Tutorial Help Button */}
          <TouchableOpacity
            style={[styles.resetButton, { marginRight: 8 }]}
            onPress={handleStartTutorial}
            activeOpacity={0.7}
          >
            <Ionicons
              name="help-circle-outline"
              size={24}
              color="#666666"
            />
          </TouchableOpacity>

          {/* Chat History Toggle Button */}
            <TouchableOpacity
              style={[styles.resetButton, { marginRight: 8 }]}
              onPress={handleToggleChatHistory}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showChatHistory ? "chatbubbles" : "chatbubbles-outline"}
                size={24}
                color={showChatHistory ? "#007AFF" : "#666666"}
              />
            </TouchableOpacity>

          {chatStarted && !showChatHistory && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetChat}
              activeOpacity={0.7}
            >
              <Ionicons name="add-outline" size={24} color="#666666" />
            </TouchableOpacity>
          )}
          <Badge />
        </View>
      </View>

      <GestureDetector gesture={swipeGesture}>
        <View style={styles.mainContent}>
          {/* Chat History View */}
          {showChatHistory ? (
          <Animated.View
            style={[
              styles.chatHistoryContainer,
              {
                opacity: chatHistoryOpacity,
                transform: [
                  {
                    translateX: chatHistorySlideIn.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0],
                    }),
                  },
                  {
                    scale: chatHistorySlideIn.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <ChatHistory
              onChatPress={handleChatHistoryPress}
              onNewChat={handleNewChat}
            />
          </Animated.View>
        ) : (
          <>
            {/* Contenuto principale */}
            <View style={chatStarted ? styles.contentChatStarted : [styles.content, { paddingTop: getGreetingPaddingTop() }]}>
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
                      <Animated.View
                          style={{
                            opacity: micButtonAnim,
                            width: micButtonAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 38],
                            }),
                            overflow: 'hidden',
                          }}
                        >
                          <TouchableOpacity
                            style={styles.attachButton}
                            onPress={handleVoicePress}
                            activeOpacity={0.7}
                            disabled={isLoading || isInputFocused}
                          >
                            <Ionicons name="mic-outline" size={22} color={isLoading ? "#ccc" : "#000"} />
                          </TouchableOpacity>
                        </Animated.View>
                      <TextInput
                        style={[styles.textInput, { maxHeight: 120 }]}
                        placeholder={t('home.chat.placeholder')}
                        placeholderTextColor="#999"
                        value={message}
                        onChangeText={setMessage}
                        multiline={true}
                      onSubmitEditing={() => handleSubmit()}
                      returnKeyType="send"
                      blurOnSubmit={true}
                      editable={!isLoading}
                      onFocus={() => {
                        console.log('[HOME] TextInput focused (under greeting)');
                        setIsInputFocused(true);
                      }}
                      onBlur={() => {
                        console.log('[HOME] TextInput blurred (under greeting)');
                        setIsInputFocused(false);
                      }}
                    />
                    <TouchableOpacity
                      style={styles.sendButton}
                      onPress={() => handleSubmit()}
                      activeOpacity={0.7}
                      disabled={isLoading || !message.trim()}
                      >
                        <Ionicons name="send" size={20} color={isLoading || !message.trim() ? "#ccc" : "#000"} />
                      </TouchableOpacity>
                    </View>
                </View>

                {/* Comando suggerito */}
                {!suggestedCommandUsed && (
                  <View style={styles.suggestedCommandsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.suggestedCommandButton,
                        isLoading && styles.suggestedCommandButtonDisabled,
                      ]}
                      onPress={() => handleSuggestedCommand(t('home.chat.suggestedCommand'))}
                      activeOpacity={0.7}
                      disabled={isLoading}
                    >
                      <Text style={[
                        styles.suggestedCommandText,
                        isLoading && styles.suggestedCommandTextDisabled,
                      ]}>
                        {t('home.chat.suggestedCommand')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
          {/* Lista dei messaggi - visibile quando la chat inizia */}
          {chatStarted && (
            <Animated.View
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
                      {t('home.chat.botTyping')}
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
              <TouchableOpacity
                style={styles.calendarToggleButton}
                onPress={() => {/* TODO: Open calendar */}}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Ionicons name="calendar-outline" size={24} color={isLoading ? "#ccc" : "#000"} />
              </TouchableOpacity>
              <Animated.View
                style={{
                  opacity: micButtonAnim,
                  width: micButtonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 38],
                  }),
                  overflow: 'hidden',
                }}
              >
                <TouchableOpacity
                  style={styles.attachButton}
                  onPress={handleVoicePress}
                  activeOpacity={0.7}
                  disabled={isLoading || isInputFocused}
                >
                  <Ionicons name="mic-outline" size={22} color={isLoading ? "#ccc" : "#000"} />
                </TouchableOpacity>
              </Animated.View>
              <TextInput
                style={[styles.textInput, { maxHeight: 120 }]}
                placeholder={t('home.chat.placeholder')}
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                multiline={true}
                onSubmitEditing={() => handleSubmit()}
                returnKeyType="send"
                blurOnSubmit={true}
                editable={!isLoading}
                onFocus={() => {
                  console.log('[HOME] TextInput focused (chat started)');
                  setIsInputFocused(true);
                }}
                onBlur={() => {
                  console.log('[HOME] TextInput blurred (chat started)');
                  setIsInputFocused(false);
                }}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => handleSubmit()}
                activeOpacity={0.7}
                disabled={isLoading || !message.trim()}
              >
                <Ionicons name="send" size={20} color={isLoading || !message.trim() ? "#ccc" : "#000"} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
          </>
        )}
        </View>
      </GestureDetector>

      {/* Voice Chat Modal */}
      <VoiceChatModal
        visible={isVoiceChatVisible}
        onClose={handleVoiceChatClose}
        isRecording={isRecording}
        onVoiceResponse={handleVoiceResponse}
      />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  keyboardAwareScrollView: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollViewContent: {
    flexGrow: 1,
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
    paddingTop: 100, // Ridotto per essere più responsivo
    paddingBottom: 80,
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
    minHeight: 70,
    marginBottom: 20,
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
    marginTop: 30,
  },
  animatedInputWrapper: {
    width: "100%",
    alignItems: "center",
  },
  greetingText: {
    fontSize: Platform.select({ ios: 28, android: 26 }),
    fontWeight: "300",
    color: "#000000",
    textAlign: "center",
    lineHeight: Platform.select({ ios: 36, android: 34 }),
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
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e1e5e9",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
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
  calendarToggleButton: {
    marginRight: 8,
    padding: 4,
  },
  attachButton: {
    marginRight: 8,
    padding: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    color: "#000000",
    fontFamily: "System",
    fontWeight: "400",
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
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
  chatHistoryContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
});

export default HomeScreen;
