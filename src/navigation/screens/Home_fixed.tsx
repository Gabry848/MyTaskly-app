import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Animated,
  Keyboard,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ChatList, Message } from "../../../components/BotChat";
import { sendMessageToBot } from "../../services/botservice";

const { width, height } = Dimensions.get("window");

const Home20 = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const navigation = useNavigation();

  // Animazioni
  const messagesSlideIn = useRef(new Animated.Value(50)).current;
  const inputBottomPosition = useRef(new Animated.Value(0)).current;

  // Effetto per gestire la visualizzazione della tastiera
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        if (chatStarted) {
          // Sposta solo l'input sopra la tastiera
          Animated.timing(inputBottomPosition, {
            toValue: event.endCoordinates.height - 50, // 50px di margine dalla tastiera
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
    // Gestione del pulsante microfono
    console.log("Voice button pressed");
  };

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading) return;

    const userMessage: Message = {
      id: generateMessageId(),
      text: trimmedMessage,
      sender: "user",
      createdAt: new Date(),
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
        createdAt: new Date(),
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
        createdAt: new Date(),
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header con titolo principale */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Mytaskly</Text>
      </View>

      <View style={styles.mainContent}>
        {/* Contenuto principale */}
        <View style={chatStarted ? styles.contentChatStarted : styles.content}>
          {/* Saluto personalizzato - nascosto quando la chat inizia */}
          {!chatStarted && (
            <View style={styles.greetingSection}>
              <Text style={styles.greetingText}>
                Ciao Gabry,{"\n"}che vuoi fare oggi?
              </Text>

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
              </View>
            </View>
          )}

          {/* Lista dei messaggi - visibile quando la chat inizia */}
          {chatStarted && (
            <Animated.View
              style={[
                styles.chatSection,
                {
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
                position: 'absolute',
                bottom: inputBottomPosition,
                left: 0,
                right: 0,
              }
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
            </View>
          </Animated.View>
        )}
      </View>
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
  },
  greetingSection: {
    marginBottom: 30,
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
});

export default Home20;
