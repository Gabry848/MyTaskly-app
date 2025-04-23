import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Button } from 'react-native';
import { Chat } from '@flyerhq/react-native-chat-ui';
import { MessageType } from '@flyerhq/react-native-chat-ui';
import * as Speech from 'expo-speech';

const ChatBotShowcase: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const userId = 'user';
  const botId = 'bot';

  useEffect(() => {
    setMessages([
      {
        id: '1',
        text: 'Ciao! Sono un bot demo. Dimmi qualcosa.',
        createdAt: new Date(),
        position: 'left',
        type: 'text',
      },
    ]);
  }, []);

  const handleBotResponse = (text: string) => {
    const reply = 'Ciao! Questo è un messaggio generato automaticamente.';
    const botMessage: MessageType = {
      id: Math.random().toString(),
      text: reply,
      createdAt: new Date(),
      position: 'left',
      type: 'text',
    };
    setMessages(prev => [...prev, botMessage]);
    Speech.speak(reply, { language: 'it-IT' });
  };

  const onSend = (message: string) => {
    const userMessage: MessageType = {
      id: Math.random().toString(),
      text: message,
      createdAt: new Date(),
      position: 'right',
      type: 'text',
    };
    setMessages(prev => [...prev, userMessage]);
    setTimeout(() => handleBotResponse(message), 1000);
  };

  const simulateVoiceInput = () => {
    const simulatedText = 'Che tempo fa oggi?';
    onSend(simulatedText);
  };

  return (
    <View style={styles.container}>
      <Button title="Simula input vocale" onPress={simulateVoiceInput} />
      <Chat
        messages={messages}
        onSendPress={onSend}
        user={{ id: userId }}
        placeholder="Scrivi un messaggio..."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ChatBotShowcase;