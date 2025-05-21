import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { sendMessageToBot, createNewChat } from '../../services/botservice';
import { 
  ChatHeader, 
  ChatInput, 
  ChatList, 
  Message,
  ChatSession, 
  chatStyles 
} from '../../../components/BotChat';

// Componente memorizzato per l'input della chat
const MemoizedChatInput = memo(({ 
  onSendMessage 
}: { 
  onSendMessage: (text: string) => void 
}) => {
  const [localInputText, setLocalInputText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = useCallback(() => {
    if (localInputText.trim() === '') return;
    onSendMessage(localInputText);
    setLocalInputText('');
    // Necessario per mantenere il focus dopo l'invio
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [localInputText, onSendMessage]);

  return (
    <View style={styles.inputContainer}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={localInputText}
        onChangeText={setLocalInputText}
        placeholder="Scrivi un messaggio..."
        placeholderTextColor="#999"
        onSubmitEditing={handleSend}
        returnKeyType="send"
        autoFocus={Platform.OS === 'ios'}
        keyboardType="default"
        spellCheck={false}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <TouchableOpacity 
        style={styles.sendButton} 
        onPress={handleSend}
        disabled={localInputText.trim() === ''}
      >
        <MaterialIcons 
          name="send" 
          size={24} 
          color={localInputText.trim() === '' ? '#CCC' : '#007bff'} 
        />
      </TouchableOpacity>
    </View>
  );
});

const BotChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const flatListRef = useRef<FlatList>(null);
  
  // ID utente e bot
  const USER = 'user';
  const BOT = 'bot';

  useEffect(() => {
    // Inizializzazione con messaggi di esempio dal bot
    setMessages([
      {
        id: Math.random().toString(),
        text: 'Benvenuto in Taskly!',
        sender: BOT,
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        id: Math.random().toString(),
        text: 'Sono il tuo assistente personale per la gestione delle attività.',
        sender: BOT,
        createdAt: new Date(Date.now() - 4 * 60 * 1000),
      },
      {
        id: Math.random().toString(),
        text: 'Come posso aiutarti oggi?',
        sender: BOT,
        createdAt: new Date(Date.now() - 2 * 60 * 1000),
      },
    ]);
  }, []);

  // Funzione per generare una risposta del bot
  const getBotResponse = useCallback(async (userMessage: string): Promise<string> => {
    try {
      // Utilizzo direttamente la funzione del servizio che restituisce già la stringa della risposta
      let response = await sendMessageToBot(userMessage);
      return response;
    } catch (error) {
      console.error('Errore nella comunicazione con il bot:', error);
      return 'Mi dispiace, si è verificato un errore. Riprova più tardi.';
    }
  }, []);

  // Gestione dell'invio dei messaggi - ora separata dall'input
  const handleSendMessage = useCallback(async (text: string) => {
    // Creiamo il messaggio dell'utente
    const userMessage: Message = {
      id: Math.random().toString(),
      text,
      sender: USER,
      createdAt: new Date(),
    };
    
    // Aggiungiamo il messaggio dell'utente
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Scroll automatico dopo l'invio del messaggio dell'utente
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      // Aggiungiamo un messaggio temporaneo "Bot sta scrivendo..."
      const tempId = Math.random().toString();
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: tempId,
          text: "Sto pensando...",
          sender: BOT,
          createdAt: new Date(),
        }
      ]);
      
      // Otteniamo la risposta dal server
      const botResponseText = await getBotResponse(text);
      // Rimuoviamo il messaggio temporaneo e aggiungiamo la risposta reale
      setMessages(prevMessages => {
        const filtered = prevMessages.filter(msg => msg.id !== tempId);
        return [
          ...filtered,
          {
            id: Math.random().toString(),
            text: botResponseText,
            sender: BOT,
            createdAt: new Date(),
          }
        ];
      });
      
    } catch (error) {
      console.log("Errore durante la comunicazione con il bot:", error);
      // In caso di errore, mostriamo un messaggio di errore
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: Math.random().toString(),
          text: "Mi dispiace, si è verificato un errore. Riprova più tardi.",
          sender: BOT,
          createdAt: new Date(),
        }
      ]);
    }
    
    // Scroll automatico alla fine della lista dopo la risposta
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
  }, [getBotResponse]);

  // Formatta la data per la visualizzazione
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Renderizza un singolo messaggio
  const renderMessage = ({ item }: { item: Message }) => {
    const isBot = item.sender === BOT;
    
    return (
      <View style={[
        styles.messageContainer,
        isBot ? styles.botMessageContainer : styles.userMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isBot ? styles.botBubble : styles.userBubble
        ]}>
          <Text style={[
            styles.messageText,
            isBot ? styles.botText : styles.userText
          ]}>
            {item.text}
          </Text>
        </View>
        <Text style={[
          styles.messageTime,
          isBot ? styles.botTime : styles.userTime
        ]}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="always"
        />
        <MemoizedChatInput onSendMessage={handleSendMessage} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: 15,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  messagesList: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  messageContainer: {
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#5B37B7', // Viola primario dell'app
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#333333',
  },
  messageTime: {
    fontSize: 11,
    marginHorizontal: 8,
    marginBottom: 2,
  },
  userTime: {
    color: '#FFFFFF80',
  },
  botTime: {
    color: '#33333380',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F8F8',
  },
});

export default BotChat;