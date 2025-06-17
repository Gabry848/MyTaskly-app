import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, SafeAreaView, Alert, Keyboard, Dimensions } from 'react-native';
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

  // Helper per determinare il tipo di dispositivo
  const getDeviceType = () => {
    const { width, height } = Dimensions.get('window');
    const aspectRatio = height / width;
    
    if (Platform.OS === 'ios') {
      // iPad ha generalmente un aspect ratio più piccolo (più quadrato)
      // iPhone ha un aspect ratio più alto (più rettangolare)
      return aspectRatio < 1.6 ? 'ipad' : 'iphone';
    }
    return 'android';
  };

  const deviceType = getDeviceType();  // Configurazione KeyboardAvoidingView basata sul dispositivo
  const getKeyboardAvoidingViewConfig = () => {
    switch (deviceType) {
      case 'ipad':
        return {
          behavior: 'padding' as const, // Usiamo padding anche per iPad
          keyboardVerticalOffset: 20, // Ma con offset molto ridotto
          enabled: true
        };
      case 'iphone':
        return {
          behavior: 'padding' as const,
          keyboardVerticalOffset: 35, // Ridotto da 90 a 35 per meno spazio
          enabled: true
        };
      case 'android':
      default:
        return {
          behavior: 'height' as const,
          keyboardVerticalOffset: 0,
          enabled: keyboardVisible
        };
    }
  };

  // Inizializzazione della chat al primo render
  useEffect(() => {
    initializeChat();
  }, []);
  // Gestione eventi tastiera per Android e iPad
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardVisible(true);
      
      // Su iPad, forziamo uno scroll aggiuntivo per assicurarci che l'input sia visibile
      if (deviceType === 'ipad') {
        setTimeout(() => {
          // Scroll aggiuntivo specifico per iPad
        }, 150);
      }
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [deviceType]);
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

  // Handler per inviare messaggi vocali
  const handleSendVoiceMessage = useCallback(async (audioUri: string) => {
    // Per ora gestiamo i messaggi vocali come messaggi di testo
    // In futuro si potrebbe mantenere anche l'URI audio per la riproduzione
    console.log('Messaggio vocale ricevuto:', audioUri);
    
    // Il messaggio vocale viene già trascritto e inserito nel campo di input
    // dal componente ChatInput, quindi non è necessario fare altro qui
    // Se volessi, potresti aggiungere metadata sul messaggio vocale
  }, []);

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
    }  }, [modelType, messages]);

  const keyboardConfig = getKeyboardAvoidingViewConfig();
  // Per iPad, usiamo un approccio ibrido: KeyboardAvoidingView con offset minimo
  if (deviceType === 'ipad') {
    return (
      <SafeAreaView style={chatStyles.container}>
        <View style={chatStyles.chatContainer}>
          <ChatHeader
            modelType={modelType}
            onModelChange={handleModelChange}
            onNewChat={handleNewChat}
          />          <ChatList messages={messages} />
          <KeyboardAvoidingView
            behavior="padding"
            keyboardVerticalOffset={10}
            enabled={true}
          >
            <ChatInput 
              onSendMessage={handleSendMessage}
              onSendVoiceMessage={handleSendVoiceMessage}
            />
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    );
  }

  // Per iPhone e Android, usiamo l'approccio standard
  return (
    <SafeAreaView style={chatStyles.container}>
      <KeyboardAvoidingView
        style={chatStyles.chatContainer}
        behavior={keyboardConfig.behavior}
        keyboardVerticalOffset={keyboardConfig.keyboardVerticalOffset}
        enabled={keyboardConfig.enabled}
      >
        <ChatHeader
          modelType={modelType}
          onModelChange={handleModelChange}
          onNewChat={handleNewChat}
        />        <ChatList messages={messages} />
        <ChatInput 
          onSendMessage={handleSendMessage}
          onSendVoiceMessage={handleSendVoiceMessage}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BotChat;