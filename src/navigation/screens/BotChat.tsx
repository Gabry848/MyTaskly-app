import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { GiftedChat, Bubble, Send, IMessage } from 'react-native-gifted-chat';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendMessageToChatGPT, transcribeAudio } from '../../services/api';

// ID univoco per il bot
const BOT_ID = 2;
const USER_ID = 1;

const BotChat = () => {
  // Stato per i messaggi della chat
  const [messages, setMessages] = useState<IMessage[]>([]);
  
  // Stato per la registrazione audio
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  // Stato per l'invio di messaggi e sintesi vocale
  const [isSending, setIsSending] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  useEffect(() => {
    // Configura l'audio
    const configureAudio = async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permesso richiesto', 'Per usare la funzione vocale, concedi l\'accesso al microfono');
          return;
        }
        
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
      } catch (error) {
        console.error('Errore nella configurazione audio:', error);
        Alert.alert('Errore', 'Impossibile accedere al microfono');
      }
    };
    
    configureAudio();

    // Aggiungi un messaggio di benvenuto
    setMessages([
      {
        _id: 1,
        text: 'Ciao! Sono il tuo assistente virtuale. Come posso aiutarti oggi?',
        createdAt: new Date(),
        user: {
          _id: BOT_ID,
          name: 'Bot',
          avatar: 'https://placehold.co/100x100/4e54c8/ffffff?text=BOT&font=montserrat',
        },
      },
    ]);

    // Pulisci quando il componente viene smontato
    return () => {
      if (isSpeaking) {
        Speech.stop();
      }
    };
  }, []);

  // Funzione per inviare messaggi al bot
  const onSend = useCallback(async (newMessages = []) => {
    // Aggiorna la UI con il messaggio dell'utente
    setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));
    
    const userMessage = newMessages[0].text;
    setIsSending(true);
    setLoadingText('Bot sta pensando...');
    
    try {
      // Prepara i messaggi per l'API di OpenAI
      const messageHistory = messages.map(msg => ({
        role: msg.user._id === USER_ID ? 'user' : 'assistant',
        content: msg.text,
      }));
      
      messageHistory.push({ role: 'user', content: userMessage });
      
      // Invia il messaggio all'API e ottieni la risposta
      const botResponse = await sendMessageToChatGPT(messageHistory);
      
      // Crea il messaggio del bot
      const botMessage: IMessage = {
        _id: Math.random().toString(36).substring(7),
        text: botResponse,
        createdAt: new Date(),
        user: {
          _id: BOT_ID,
          name: 'Bot',
          avatar: 'https://placehold.co/100x100/4e54c8/ffffff?text=BOT&font=montserrat',
        },
      };
      
      // Aggiorna la chat con la risposta del bot
      setMessages(previousMessages => GiftedChat.append(previousMessages, [botMessage]));
      
      // Leggi la risposta del bot
      speakBotResponse(botResponse);
      
    } catch (error) {
      console.error('Errore nell\'invio del messaggio:', error);
      Alert.alert('Errore', 'Impossibile comunicare con il bot in questo momento');
    } finally {
      setIsSending(false);
      setLoadingText('');
    }
  }, [messages]);

  // Funzione per la sintesi vocale della risposta del bot
  const speakBotResponse = async (text: string) => {
    try {
      setIsSpeaking(true);
      setLoadingText('Bot sta parlando...');
      
      Speech.speak(text, {
        language: 'it-IT',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          setIsSpeaking(false);
          setLoadingText('');
        },
        onError: (error) => {
          console.error('Errore nella sintesi vocale:', error);
          setIsSpeaking(false);
          setLoadingText('');
        },
      });
    } catch (error) {
      console.error('Errore nell\'avvio della sintesi vocale:', error);
      setIsSpeaking(false);
      setLoadingText('');
    }
  };

  // Funzioni per gestire la registrazione audio
  const startRecording = async () => {
    try {
      // Interrompi la sintesi vocale se è in corso
      if (isSpeaking) {
        Speech.stop();
        setIsSpeaking(false);
      }
      
      setIsRecording(true);
      setLoadingText('Registrazione in corso...');
      
      // Crea una nuova registrazione
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
    } catch (error) {
      console.error('Errore nell\'avvio della registrazione:', error);
      setIsRecording(false);
      setLoadingText('');
      Alert.alert('Errore', 'Impossibile avviare la registrazione');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    setIsRecording(false);
    setLoadingText('Elaborazione audio...');
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      if (uri) {
        // Trascrivi l'audio in testo
        const transcribedText = await transcribeAudio(uri);
        
        if (transcribedText) {
          // Crea un nuovo messaggio con il testo trascritto
          const userMessage: IMessage = {
            _id: Math.random().toString(36).substring(7),
            text: transcribedText,
            createdAt: new Date(),
            user: {
              _id: USER_ID,
              name: 'User',
            },
          };
          
          // Invia il messaggio trascritto al bot
          onSend([userMessage]);
        }
      }
    } catch (error) {
      console.error('Errore nella registrazione audio:', error);
      setLoadingText('');
      Alert.alert('Errore', 'Impossibile elaborare l\'audio');
    }
  };

  // Personalizzazione componenti UI di GiftedChat
  const renderBubble = (props: any) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#4e54c8',
          },
          left: {
            backgroundColor: '#f0f0f0',
          },
        }}
        textStyle={{
          right: {
            color: 'white',
          },
          left: {
            color: '#333',
          },
        }}
      />
    );
  };

  const renderSend = (props: any) => {
    return (
      <Send
        {...props}
        containerStyle={styles.sendContainer}
      >
        <Ionicons name="send" size={24} color="#4e54c8" />
      </Send>
    );
  };

  // Render del componente
  return (
    <SafeAreaView style={styles.container}>
      {/* Stato attuale (caricamento/parlando) */}
      {loadingText ? (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color="#4e54c8" />
          <Text style={styles.statusText}>{loadingText}</Text>
        </View>
      ) : null}
      
      {/* Chat principale */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{ _id: USER_ID }}
          renderBubble={renderBubble}
          renderSend={renderSend}
          placeholder="Scrivi un messaggio..."
          alwaysShowSend
          renderAvatar={null}
          isTyping={isSending}
        />
      </KeyboardAvoidingView>
      
      {/* Pulsante per la registrazione audio */}
      <View style={styles.micContainer}>
        <TouchableOpacity
          style={[styles.micButton, isRecording ? styles.recording : null]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isRecording ? "radio" : "mic"} 
            size={28} 
            color="white" 
          />
        </TouchableOpacity>
        <Text style={styles.micText}>
          {isRecording ? 'Rilascia per inviare' : 'Tieni premuto per parlare'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

// Stili
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  micContainer: {
    position: 'absolute',
    right: 10,
    bottom: 75,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  micButton: {
    backgroundColor: '#4e54c8',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  recording: {
    backgroundColor: '#ff4d4d',
    transform: [{ scale: 1.1 }],
  },
  micText: {
    marginTop: 5,
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
  statusContainer: {
    padding: 8,
    backgroundColor: '#f8f8f8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default BotChat;