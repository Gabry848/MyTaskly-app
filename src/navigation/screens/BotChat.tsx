import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, SafeAreaView, Alert, Keyboard } from 'react-native';
import { sendMessageToBot, createNewChat } from '../../services/botservice';
import { 
  ChatHeader, 
  ChatInput, 
  ChatList, 
  Message,
  chatStyles 
} from '../../../components/BotChat';

const BotChat: React.FC = () => {
  // Stati
  const [messages, setMessages] = useState<Message[]>([]);
  const [modelType, setModelType] = useState<'base' | 'advanced'>('base');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Costanti
  const USER = 'user';
  const BOT = 'bot';

  // Inizializzazione della chat al primo render
  useEffect(() => {
    initializeChat();
  }, []);

  // Gestione eventi tastiera per Android
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);
  // Funzione per inizializzare la chat con messaggi di benvenuto
  const initializeChat = async () => {
    const welcomeMessages = await createNewChat();
    setMessages(welcomeMessages as Message[]);
  };

  // Handler per creare una nuova chat
  const handleNewChat = () => {
    Alert.alert(
      "Nuova Chat",
      "Vuoi creare una nuova chat? Tutti i messaggi attuali verranno eliminati.",
      [
        {
          text: "Annulla",
          style: "cancel"
        },
        {
          text: "Conferma",
          onPress: () => initializeChat()
        }
      ]
    );
  };

  // Handler per cambiare il tipo di modello
  const handleModelChange = (newModelType: 'base' | 'advanced') => {
    setModelType(newModelType);
    // Notifica all'utente del cambio
    const modelName = newModelType === 'advanced' ? 'avanzato' : 'base';
    
    setMessages(prevMessages => [
      ...prevMessages,
      {
        id: Math.random().toString(),
        text: `Modello cambiato a: ${modelName}`,
        sender: BOT,
        createdAt: new Date(),
        modelType: newModelType
      }
    ]);
  };

  // Handler per inviare messaggi
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
    
    try {
      // Otteniamo gli ultimi messaggi per inviarli al server
      const currentMessages = [...messages, userMessage];
      const lastMessages = currentMessages.slice(-5);
      
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
      
      // Otteniamo la risposta dal server usando il modello selezionato e i messaggi precedenti
      const botResponseText = await sendMessageToBot(text, modelType, lastMessages);
      
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
            modelType: modelType  // Aggiungiamo l'informazione sul modello utilizzato
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
  }, [modelType, messages]);  return (
    <SafeAreaView style={chatStyles.container}>
      <KeyboardAvoidingView
        style={chatStyles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        enabled={Platform.OS === 'ios' || keyboardVisible}
      >
        <ChatHeader
          modelType={modelType}
          onModelChange={handleModelChange}
          onNewChat={handleNewChat}
        />
        <ChatList messages={messages} />
        <ChatInput onSendMessage={handleSendMessage} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BotChat;